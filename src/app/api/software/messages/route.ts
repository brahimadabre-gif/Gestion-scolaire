import { db } from "@/lib/db";
import { fail, getClientIp, handle, ok, rateLimit, withPublicLicenseCors } from "@/lib/api-helpers";
import { detectDevicePlatform, normalizeProduct } from "@/lib/license-platform";
import { normaliserCle, viseLogiciel } from "@/lib/software-messages";

// POST /api/software/messages — messages à afficher dans un logiciel installé.
// Corps : { licenseKey?: string, installId?: string, platform?: "PC" | "ANDROID" }
// Le logiciel envoie l'en-tête x-gspp-client (desktop | android), comme pour les licences.
// La réponse donne l'heure du serveur : le compte à rebours ne dépend pas de l'horloge du poste.
export async function POST(req: Request) {
  return withPublicLicenseCors(await handle(async () => {
    const client = req.headers.get("x-gspp-client");
    if (client !== "desktop" && client !== "android") return fail("Client inconnu.", 401);
    const rl = rateLimit(`swmsg:${getClientIp(req)}`, 60, 15 * 60 * 1000);
    if (!rl.allowed) return fail("Trop de requêtes. Réessayez plus tard.", 429);

    const body = await req.json().catch(() => ({}));
    const licenseKey = typeof body.licenseKey === "string" && body.licenseKey.trim() ? normaliserCle(body.licenseKey).slice(0, 60) : null;
    const installId = typeof body.installId === "string" ? body.installId.trim().slice(0, 80) : "";
    const platform = detectDevicePlatform({ userAgent: req.headers.get("user-agent"), clientHeader: client, bodyPlatform: body.platform });

    // Le compte n'est reconnu que par une clé qui existe vraiment.
    const licence = licenseKey
      ? await db.licenseKey.findUnique({ where: { key: licenseKey }, select: { key: true, userId: true } })
      : null;

    const now = new Date();
    const candidats = await db.softwareMessage.findMany({
      where: {
        status: "PUBLISHED",
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
    // Logiciel qui demande : Cantine Pro envoie product « CANTINE » ; sinon Gestion Scolaire Pro.
    const logiciel = { platform, licenseKey: licence?.key ?? null, userId: licence?.userId ?? null, product: normalizeProduct(body.product) };
    const messages = candidats.filter((m) => viseLogiciel(m, logiciel, now));

    // Accusé de réception (un par logiciel et par message).
    const viewer = licence?.key ?? (installId ? `install:${installId}` : null);
    if (viewer && messages.length) {
      await db.softwareMessageView.createMany({
        data: messages.map((m) => ({ messageId: m.id, viewer, platform })),
        skipDuplicates: true,
      });
    }

    return ok({
      product: logiciel.product,
      serverTime: now.toISOString(),
      messages: messages.map((m) => ({
        id: m.id,
        kind: m.kind,
        title: m.title,
        body: m.body,
        buttonLabel: m.buttonLabel,
        buttonUrl: m.buttonUrl,
        publishedAt: m.publishedAt,
        deadlineAt: m.deadlineAt,
        suspendAtDeadline: m.suspendAtDeadline,
      })),
    });
  }));
}

export function OPTIONS() {
  return withPublicLicenseCors(new Response(null, { status: 204 }));
}
