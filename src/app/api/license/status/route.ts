import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, getClientIp } from "@/lib/api-helpers";

/**
 * POST /api/license/status — Vérification du statut licence/abonnement (API machine à machine)
 *
 * Appelé périodiquement par le logiciel pour synchroniser son statut :
 *  - licence valide ?
 *  - abonnement actif ? date d'expiration ? jours restants ?
 *  - vérification du compte utilisateur ?
 *
 * Sécurité : en-tête `x-api-key` = process.env.SOFTWARE_API_KEY (serveur uniquement).
 * Corps : { licenseKey }
 */
export async function POST(req: Request) {
  return handle(async () => {
    const ip = getClientIp(req);

    // Un secret ne doit pas être embarqué dans le logiciel client. Les clients
    // utilisent HTTPS + clé de licence + limitation des tentatives.
    const apiKey = req.headers.get("x-api-key");
    const publicClient = req.headers.get("x-gspp-client");
    const expectedKey = process.env.SOFTWARE_API_KEY;
    const trustedServer = Boolean(expectedKey && apiKey && apiKey === expectedKey);
    const trustedApp = publicClient === "desktop" || publicClient === "android";
    if (!trustedServer && !trustedApp) {
      return fail("Clé API invalide.", 401);
    }

    // 2. Anti abuse
    const rl = rateLimit(`licstatus:${ip}`, 60, 15 * 60 * 1000);
    if (!rl.allowed) return fail("Trop de requêtes. Réessayez plus tard.", 429);

    // 3. Corps
    const body = await req.json().catch(() => ({}));
    const licenseKey = typeof body.licenseKey === "string" ? body.licenseKey.trim().toUpperCase() : "";
    if (!licenseKey) return fail("Clé de licence requise.", 400);

    // 4. Licence
    const license = await db.licenseKey.findUnique({
      where: { key: licenseKey },
      include: {
        subscription: { include: { plan: true } },
        user: { select: { id: true, email: true, active: true, establishment: true } },
      },
    });
    if (!license || license.status === "REVOKED") {
      return ok({ valid: false, reason: "LICENSE_INVALID" });
    }
    if (!license.user.active) {
      return ok({ valid: false, reason: "ACCOUNT_DISABLED" });
    }

    // 5. Abonnement
    const sub = license.subscription;
    if (!sub) return ok({ valid: false, reason: "NO_SUBSCRIPTION" });

    let subStatus = sub.status;
    if (subStatus === "ACTIVE" && sub.endDate && sub.endDate < new Date()) {
      await db.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } });
      subStatus = "EXPIRED";
    }

    if (subStatus !== "ACTIVE") {
      return ok({
        valid: false,
        reason: subStatus === "EXPIRED" ? "SUBSCRIPTION_EXPIRED" : "SUBSCRIPTION_INACTIVE",
        subscription: { status: subStatus, plan: sub.plan.name, endDate: sub.endDate },
      });
    }

    // 6. Synchronisation du dernier contrôle
    await db.licenseKey.update({
      where: { id: license.id },
      data: { lastCheckAt: new Date() },
    });

    return ok({
      valid: true,
      license: { key: license.key, status: license.status, maxDevices: license.maxDevices },
      subscription: {
        status: "ACTIVE",
        plan: sub.plan.name,
        billingCycle: sub.billingCycle,
        startDate: sub.startDate,
        endDate: sub.endDate,
        daysRemaining: sub.endDate
          ? Math.max(0, Math.ceil((sub.endDate.getTime() - Date.now()) / 86_400_000))
          : null,
      },
      account: {
        email: license.user.email,
        establishment: license.user.establishment,
      },
    });
  });
}
