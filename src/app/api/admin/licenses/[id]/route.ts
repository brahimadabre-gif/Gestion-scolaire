import { db } from "@/lib/db";
import { assertSameOrigin, fail, getClientIp, handle, logAction, ok } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/licenses/:id — seule la révocation est autorisée ici.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !("action" in body) || body.action !== "revoke") {
      return fail("Action invalide.", 400);
    }

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
