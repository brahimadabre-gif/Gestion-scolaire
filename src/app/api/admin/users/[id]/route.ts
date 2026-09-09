import { db } from "@/lib/db";
import { ok, fail, handle, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/users/[id] — Modifier rôle / statut d'un compte
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const ip = getClientIp(req);
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const data: { role?: string; active?: boolean } = {};
    if (typeof body.role === "string" && ["USER", "SUPPORT", "ADMIN"].includes(body.role)) {
      data.role = body.role;
    }
    if (typeof body.active === "boolean") data.active = body.active;
    if (Object.keys(data).length === 0) return fail("Aucune modification valide fournie.", 400);

    const target = await db.user.findUnique({ where: { id } });
    if (!target) return fail("Compte introuvable.", 404);

    // Protection : un admin ne peut pas se désactiver ni se retirer lui-même
    if (target.id === admin.id && (data.active === false || (data.role && data.role !== "ADMIN"))) {
      return fail("Vous ne pouvez pas modifier votre propre rôle ou désactiver votre compte.", 400);
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: { id: true, firstName: true, lastName: true, email: true, role: true, active: true },
    });

    await logAction(
      "ADMIN_USER_UPDATED",
      admin.id,
      `${target.email} → ${JSON.stringify(data)}`,
      ip
    );
    return ok(updated);
  });
}
