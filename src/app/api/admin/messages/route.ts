import { db } from "@/lib/db";
import { assertSameOrigin, getClientIp, handle, logAction, ok } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { messageInputSchema, nettoyerMessage } from "@/lib/software-messages";
import { statsMessages, verifierDestinataires } from "@/lib/software-messages-admin";

// GET /api/admin/messages — tous les messages aux logiciels, avec reçus / lus.
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const messages = await db.softwareMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    const stats = await statsMessages(messages);
    return ok({ serverTime: new Date().toISOString(), items: messages.map((m) => ({ ...m, stats: stats.get(m.id) })) });
  });
}

// POST /api/admin/messages — crée un brouillon, ou publie directement avec { publish: true }.
export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const donnees = nettoyerMessage(messageInputSchema.parse(body));
    const erreur = await verifierDestinataires(donnees.targetUserIds, donnees.targetKeys);
    if (erreur) return erreur;
    const publier = body?.publish === true;
    const message = await db.softwareMessage.create({
      data: { ...donnees, createdById: admin.id, status: publier ? "PUBLISHED" : "DRAFT", publishedAt: publier ? new Date() : null },
    });
    await logAction(publier ? "SOFTWARE_MESSAGE_PUBLISHED" : "SOFTWARE_MESSAGE_DRAFT", admin.id, `${message.id} · ${message.title}`, getClientIp(req));
    return ok(message, 201);
  });
}
