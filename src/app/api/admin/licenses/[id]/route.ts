import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, fail, getClientIp, handle, logAction, ok } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { isLicensePlatform, platformFromKey } from "@/lib/license-platform";

const texte = z.string().trim().max(120).optional().default("");
const clientSchema = z.object({ lastName: texte, firstName: texte, school: texte, city: texte });

// PATCH /api/admin/licenses/:id
//   { action: "revoke" }                         → révocation (annulable avec "reactivate")
//   { action: "reactivate" }                     → remettre en service une clé révoquée
//   { action: "set-client", client: {...} }      → nom, prénoms, école et ville du client
//   { action: "set-platform", platform: "PC" }    → rattacher une ancienne clé GSPP- à une plateforme
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body: unknown = await req.json().catch(() => null);
    const action = body && typeof body === "object" && "action" in body ? body.action : null;

    if (action === "set-platform") {
      const platform = "platform" in (body as object) ? (body as { platform: unknown }).platform : null;
      if (!isLicensePlatform(platform)) return fail("Plateforme invalide : PC ou ANDROID.", 422);
      const license = await db.licenseKey.findUnique({ where: { id }, select: { id: true, key: true, platform: true } });
      if (!license) return fail("Licence introuvable.", 404);
      // Les clés GSPC-/GSAN- portent leur plateforme dans le préfixe : elle ne change jamais.
      if (platformFromKey(license.key)) return fail("La plateforme de cette clé est fixée par son préfixe.", 409);
      if (license.platform && license.platform !== platform) {
        return fail("Cette clé est déjà rattachée à une autre plateforme.", 409);
      }
      await db.licenseKey.update({ where: { id }, data: { platform } });
      await logAction("LICENSE_PLATFORM_SET", admin.id, `${license.key} → ${platform}`, getClientIp(req));
      return ok({ id, platform });
    }

    if (action === "set-client") {
      const fiche = clientSchema.parse((body as { client?: unknown }).client ?? {});
      const license = await db.licenseKey.findUnique({ where: { id }, select: { key: true } });
      if (!license) return fail("Licence introuvable.", 404);
      const data = {
        clientLastName: fiche.lastName || null,
        clientFirstName: fiche.firstName || null,
        clientSchool: fiche.school || null,
        clientCity: fiche.city || null,
      };
      await db.licenseKey.update({ where: { id }, data });
      await logAction("LICENSE_CLIENT_SET", admin.id, `${license.key} → ${[data.clientLastName, data.clientFirstName, data.clientSchool, data.clientCity].filter(Boolean).join(" · ") || "fiche vidée"}`, getClientIp(req));
      return ok({ id, ...data });
    }

    if (action === "reactivate") {
      const license = await db.licenseKey.findUnique({ where: { id }, select: { key: true, status: true, activatedAt: true } });
      if (!license) return fail("Licence introuvable.", 404);
      if (license.status !== "REVOKED") return fail("Cette licence n'est pas révoquée.", 409);
      // Une clé déjà utilisée redevient active (sa date d'expiration reste la même) ;
      // une clé jamais activée redevient disponible.
      const status = license.activatedAt ? "ACTIVE" : "INACTIVE";
      const changed = await db.licenseKey.updateMany({ where: { id, status: "REVOKED" }, data: { status } });
      if (changed.count !== 1) return fail("Réactivation impossible, réessayez.", 409);
      await logAction("LICENSE_REACTIVATED", admin.id, `${license.key} → ${status}`, getClientIp(req));
      return ok({ id, status });
    }

    if (action !== "revoke") return fail("Action invalide.", 400);

    const changed = await db.licenseKey.updateMany({
      where: { id, status: { in: ["INACTIVE", "ACTIVE"] } },
      data: { status: "REVOKED" },
    });
    if (changed.count !== 1) {
      const license = await db.licenseKey.findUnique({ where: { id }, select: { id: true, status: true } });
      return license ? fail("Cette licence est déjà révoquée ou ne peut plus être révoquée.", 409) : fail("Licence introuvable.", 404);
    }

    await logAction("LICENSE_REVOKED", admin.id, id, getClientIp(req));
    return ok({ id, status: "REVOKED" });
  });
}
