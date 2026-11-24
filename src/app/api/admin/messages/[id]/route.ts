import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, fail, getClientIp, handle, logAction, ok } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { messageInputSchema, nettoyerMessage } from "@/lib/software-messages";
import { verifierDestinataires } from "@/lib/software-messages-admin";

// PATCH /api/admin/messages/:id
//   { action: "update", message: {...} }   → modifier un brouillon
//   { action: "publish" }                   → publier un brouillon
//   { action: "archive" }                   → retirer (lève aussi une suspension : paiement reçu)
//   { action: "deadline", deadlineAt }      → repousser l'échéance d'un message publié
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const message = await db.softwareMessage.findUnique({ where: { id } });
    if (!message) return fail("Message introuvable.", 404);
    const ip = getClientIp(req);

    switch (body?.action) {
      case "update": {
        if (message.status !== "DRAFT") return fail("Seul un brouillon peut être modifié.", 409);
        const donnees = nettoyerMessage(messageInputSchema.parse(body.message));
        const erreur = await verifierDestinataires(donnees.targetUserIds, donnees.targetKeys);
        if (erreur) return erreur;
        return ok(await db.softwareMessage.update({ where: { id }, data: donnees }));
      }
      case "publish": {
        if (message.status !== "DRAFT") return fail("Ce message n'est pas un brouillon.", 409);
        const maj = await db.softwareMessage.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
        await logAction("SOFTWARE_MESSAGE_PUBLISHED", admin.id, `${id} · ${message.title}`, ip);
        return ok(maj);
      }
      case "archive": {
        if (message.status === "ARCHIVED") return fail("Ce message est déjà retiré.", 409);
        const maj = await db.softwareMessage.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() } });
        const suite = message.suspendAtDeadline ? " (suspension levée)" : "";
        await logAction("SOFTWARE_MESSAGE_ARCHIVED", admin.id, `${id} · ${message.title}${suite}`, ip);
        return ok(maj);
      }
      case "deadline": {
        if (message.status !== "PUBLISHED" || !message.deadlineAt) return fail("Ce message n'a pas de minuteur en cours.", 409);
        const deadlineAt = z.coerce.date().parse(body.deadlineAt);
        if (deadlineAt <= new Date()) return fail("La nouvelle échéance doit être dans le futur.", 422);
        const maj = await db.softwareMessage.update({ where: { id }, data: { deadlineAt } });
        await logAction("SOFTWARE_MESSAGE_DEADLINE", admin.id, `${id} → ${deadlineAt.toISOString()}`, ip);
        return ok(maj);
      }
      default:
        return fail("Action invalide.", 400);
    }
  });
}

// DELETE /api/admin/messages/:id — supprimer un brouillon (un message publié se retire, il ne s'efface pas).
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const { id } = await params;
    const n = await db.softwareMessage.deleteMany({ where: { id, status: "DRAFT" } });
    if (n.count !== 1) return fail("Seul un brouillon peut être supprimé.", 409);
    await logAction("SOFTWARE_MESSAGE_DELETED", admin.id, id, getClientIp(req));
    return ok({ id });
  });
}
