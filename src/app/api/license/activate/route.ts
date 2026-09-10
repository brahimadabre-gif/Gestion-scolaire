import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, getClientIp, logAction, withPublicLicenseCors } from "@/lib/api-helpers";
import { licenseActivateSchema } from "@/lib/validations";

/**
 * POST /api/license/activate — Activation du logiciel (API machine à machine)
 *
 * Sécurité :
 *  - En-tête `x-api-key` obligatoire = process.env.SOFTWARE_API_KEY (jamais exposé au frontend)
 *  - Limitation de tentatives anti brute-force sur les clés de licence
 *
 * Corps : { licenseKey, deviceFingerprint }
 * Réponse : statut d'activation + informations d'abonnement pour le logiciel.
 */
export async function POST(req: Request) {
  return withPublicLicenseCors(await handle(async () => {
    const ip = getClientIp(req);

    // 1. Les clients desktop/mobile ne peuvent pas garder un secret fiable
    // dans leur binaire. La protection repose donc sur HTTPS, la clé de licence
    // à forte entropie et la limitation des tentatives. La clé privée reste
    // disponible pour d'éventuels appels serveur à serveur.
    const apiKey = req.headers.get("x-api-key");
    const publicClient = req.headers.get("x-gspp-client");
    const expectedKey = process.env.SOFTWARE_API_KEY;
    const trustedServer = Boolean(expectedKey && apiKey && apiKey === expectedKey);
    const trustedApp = publicClient === "desktop" || publicClient === "android";
    if (!trustedServer && !trustedApp) {
      return fail("Clé API invalide.", 401);
    }

    // 2. Anti brute-force sur la clé de licence
    const rl = rateLimit(`license:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) return fail("Trop de tentatives. Réessayez plus tard.", 429);

    // 3. Validation du corps de la requête
    const data = licenseActivateSchema.parse(await req.json());

    // 4. Recherche de la licence
    const license = await db.licenseKey.findUnique({
      where: { key: data.licenseKey.toUpperCase() },
      include: {
        subscription: { include: { plan: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true, establishment: true, active: true } },
      },
    });
    if (!license || license.status === "REVOKED") return fail("Licence invalide ou révoquée.", 404);
    if (!license.user.active) return fail("Compte désactivé. Contactez le support.", 403);

    // 5. Vérification de l'abonnement lié
    const sub = license.subscription;
    if (!sub || sub.status !== "ACTIVE") {
      return fail("Aucun abonnement actif associé à cette licence.", 403);
    }
    if (sub.endDate && sub.endDate < new Date()) {
      await db.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } });
      return fail("Abonnement expiré. Renouvelez depuis votre espace client.", 403);
    }

    // 6. Activation — liaison de l'appareil
    if (license.status === "INACTIVE") {
      await db.licenseKey.update({
        where: { id: license.id },
        data: {
          status: "ACTIVE",
          activatedAt: new Date(),
          deviceFingerprint: data.deviceFingerprint,
          lastCheckAt: new Date(),
        },
      });
      await logAction("LICENSE_ACTIVATED", license.userId, `${license.key}`, ip);
    } else {
      // Déjà active : vérifier que l'empreinte correspond (anti-piratage multi-postes)
      if (!license.deviceFingerprint) {
        return fail("Cette licence active doit être réinitialisée par l’administrateur avant toute nouvelle activation.", 409);
      }
      if (license.deviceFingerprint !== data.deviceFingerprint) {
        return fail("Cette licence est déjà active sur un autre appareil.", 409);
      }
      await db.licenseKey.update({
        where: { id: license.id },
        data: { lastCheckAt: new Date() },
      });
    }

    return ok({
      activated: true,
      license: {
        key: license.key,
        status: "ACTIVE",
        maxDevices: license.maxDevices,
      },
      subscription: {
        plan: sub.plan.name,
        billingCycle: sub.billingCycle,
        endDate: sub.endDate,
        daysRemaining: sub.endDate
          ? Math.max(0, Math.ceil((sub.endDate.getTime() - Date.now()) / 86_400_000))
          : null,
      },
      account: {
        establishment: license.user.establishment,
        name: `${license.user.firstName} ${license.user.lastName}`,
      },
    });
  }));
}

export function OPTIONS() {
  return withPublicLicenseCors(new Response(null, { status: 204 }));
}
