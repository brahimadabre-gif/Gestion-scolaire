import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, getClientIp, logAction, withPublicLicenseCors } from "@/lib/api-helpers";
import { licenseActivateSchema } from "@/lib/validations";
import { addCalendarMonths } from "@/lib/license-duration";

/** POST /api/license/activate — activation depuis le logiciel. */
export async function POST(req: Request) {
  return withPublicLicenseCors(await handle(async () => {
    const ip = getClientIp(req);
    const apiKey = req.headers.get("x-api-key");
    const publicClient = req.headers.get("x-gspp-client");
    const expectedKey = process.env.SOFTWARE_API_KEY;
    const trustedServer = Boolean(expectedKey && apiKey && apiKey === expectedKey);
    const trustedApp = publicClient === "desktop" || publicClient === "android";
    if (!trustedServer && !trustedApp) return fail("Clé API invalide.", 401);

    const rl = rateLimit(`license:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) return fail("Trop de tentatives. Réessayez plus tard.", 429);
    const data = licenseActivateSchema.parse(await req.json());
    const key = data.licenseKey.toUpperCase();
    let license = await db.licenseKey.findUnique({
      where: { key },
      include: {
        subscription: { include: { plan: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true, establishment: true, active: true } },
      },
    });
    if (!license || license.status === "REVOKED") return fail("Licence invalide ou révoquée.", 404);
    if (license.user && !license.user.active) return fail("Compte désactivé. Contactez le support.", 403);

    const now = new Date();
    const subscription = license.subscription;
    if (subscription) {
      if (subscription.status !== "ACTIVE") return fail("Aucun abonnement actif associé à cette licence.", 403);
      if (subscription.endDate && subscription.endDate <= now) {
        await db.subscription.update({ where: { id: subscription.id }, data: { status: "EXPIRED" } });
        return fail("Abonnement expiré. Renouvelez depuis votre espace client.", 403);
      }
    } else if (!license.validityMonths || license.validityMonths < 1) {
      return fail("Aucun abonnement ni durée de licence n'est associé à ce code.", 403);
    }

    if (license.status === "INACTIVE") {
      const expiresAt = subscription ? null : addCalendarMonths(now, license.validityMonths!);
      const activated = await db.licenseKey.updateMany({
        where: { id: license.id, status: "INACTIVE" },
        data: {
          status: "ACTIVE",
          activatedAt: now,
          expiresAt,
          deviceFingerprint: data.deviceFingerprint,
          lastCheckAt: now,
        },
      });
      if (activated.count === 1) {
        await logAction("LICENSE_ACTIVATED", license.userId, license.key, ip);
      }
      // Relecture après l'écriture conditionnelle : deux installations qui
      // activent le même code au même instant ne peuvent pas toutes deux gagner.
      license = await db.licenseKey.findUnique({
        where: { id: license.id },
        include: {
          subscription: { include: { plan: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true, establishment: true, active: true } },
        },
      });
      if (!license || license.status === "REVOKED") return fail("Licence invalide ou révoquée.", 404);
    }

    if (license.status !== "ACTIVE") return fail("Cette licence n'est pas activée.", 403);
    if (!license.deviceFingerprint || license.deviceFingerprint !== data.deviceFingerprint) {
      return fail("Cette licence est déjà active sur un autre appareil.", 409);
    }
    if (!subscription && license.expiresAt && license.expiresAt <= now) {
      return fail("Licence expirée. Contactez l'administrateur pour la renouveler.", 403);
    }
    if (!subscription && !license.expiresAt) return fail("Date d'expiration de la licence introuvable.", 403);

    await db.licenseKey.update({ where: { id: license.id }, data: { lastCheckAt: now } });
    const endDate = subscription?.endDate ?? license.expiresAt;
    return ok({
      activated: true,
      license: { key: license.key, status: "ACTIVE", maxDevices: license.maxDevices, expiresAt: license.expiresAt },
      subscription: {
        plan: subscription?.plan.name ?? "Licence directe",
        billingCycle: subscription?.billingCycle ?? "duration",
        startDate: subscription?.startDate ?? license.activatedAt,
        endDate,
        daysRemaining: endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86_400_000)) : null,
      },
      account: license.user ? {
        establishment: license.user.establishment,
        name: `${license.user.firstName} ${license.user.lastName}`,
      } : null,
    });
  }));
}

export function OPTIONS() {
  return withPublicLicenseCors(new Response(null, { status: 204 }));
}
