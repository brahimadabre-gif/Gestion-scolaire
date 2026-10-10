import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, getClientIp, withPublicLicenseCors } from "@/lib/api-helpers";

/** POST /api/license/status — statut de l'abonnement ou de la licence directe. */
export async function POST(req: Request) {
  return withPublicLicenseCors(await handle(async () => {
    const ip = getClientIp(req);
    const apiKey = req.headers.get("x-api-key");
    const publicClient = req.headers.get("x-gspp-client");
    const expectedKey = process.env.SOFTWARE_API_KEY;
    const trustedServer = Boolean(expectedKey && apiKey && apiKey === expectedKey);
    const trustedApp = publicClient === "desktop" || publicClient === "android";
    if (!trustedServer && !trustedApp) return fail("Clé API invalide.", 401);

    const rl = rateLimit(`licstatus:${ip}`, 60, 15 * 60 * 1000);
    if (!rl.allowed) return fail("Trop de requêtes. Réessayez plus tard.", 429);
    const body = await req.json().catch(() => ({}));
    const licenseKey = typeof body.licenseKey === "string" ? body.licenseKey.trim().toUpperCase() : "";
    if (!licenseKey) return fail("Clé de licence requise.", 400);

    const license = await db.licenseKey.findUnique({
      where: { key: licenseKey },
      include: {
        subscription: { include: { plan: true } },
        user: { select: { id: true, email: true, active: true, establishment: true } },
      },
    });
    if (!license || license.status === "REVOKED") return ok({ valid: false, reason: "LICENSE_INVALID" });
    if (license.status !== "ACTIVE") return ok({ valid: false, reason: "LICENSE_NOT_ACTIVATED" });
    if (license.user && !license.user.active) return ok({ valid: false, reason: "ACCOUNT_DISABLED" });

    const now = new Date();
    const sub = license.subscription;
    if (sub) {
      if (sub.status === "ACTIVE" && sub.endDate && sub.endDate <= now) {
        await db.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } });
        return ok({ valid: false, reason: "SUBSCRIPTION_EXPIRED", subscription: { status: "EXPIRED", plan: sub.plan.name, endDate: sub.endDate } });
      }
      if (sub.status !== "ACTIVE") {
        return ok({
          valid: false,
          reason: sub.status === "EXPIRED" ? "SUBSCRIPTION_EXPIRED" : "SUBSCRIPTION_INACTIVE",
          subscription: { status: sub.status, plan: sub.plan.name, endDate: sub.endDate },
        });
      }

      await db.licenseKey.update({ where: { id: license.id }, data: { lastCheckAt: now } });
      return ok({
        valid: true,
        license: { key: license.key, status: license.status, maxDevices: license.maxDevices },
        subscription: {
          status: "ACTIVE",
          plan: sub.plan.name,
          billingCycle: sub.billingCycle,
          startDate: sub.startDate,
          endDate: sub.endDate,
          daysRemaining: sub.endDate ? Math.max(0, Math.ceil((sub.endDate.getTime() - now.getTime()) / 86_400_000)) : null,
        },
        account: { email: license.user?.email ?? null, establishment: license.user?.establishment ?? null },
      });
    }

    if (!license.validityMonths || !license.expiresAt) return ok({ valid: false, reason: "NO_SUBSCRIPTION" });
    if (license.expiresAt <= now) return ok({ valid: false, reason: "LICENSE_EXPIRED", license: { expiresAt: license.expiresAt } });
    await db.licenseKey.update({ where: { id: license.id }, data: { lastCheckAt: now } });
    return ok({
      valid: true,
      license: { key: license.key, status: license.status, maxDevices: license.maxDevices, expiresAt: license.expiresAt },
      subscription: {
        status: "ACTIVE",
        plan: "Licence directe",
        billingCycle: "duration",
        startDate: license.activatedAt,
        endDate: license.expiresAt,
        daysRemaining: Math.max(0, Math.ceil((license.expiresAt.getTime() - now.getTime()) / 86_400_000)),
      },
      account: { email: license.user?.email ?? null, establishment: license.user?.establishment ?? null },
    });
  }));
}

export function OPTIONS() {
  return withPublicLicenseCors(new Response(null, { status: 204 }));
}
