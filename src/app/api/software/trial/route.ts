import { db } from "@/lib/db";
import { fail, getClientIp, handle, ok, rateLimit, withPublicLicenseCors } from "@/lib/api-helpers";
import { detectDevicePlatform, normalizeProduct } from "@/lib/license-platform";

// POST /api/software/trial — date de début de l'essai gratuit d'un appareil.
// Corps : { deviceId: string (empreinte SHA-256 de l'appareil), product?: "CANTINE", platform?: "PC" | "ANDROID", premier?: string }
// Le premier appel enregistre la date ; les suivants renvoient toujours la même. Désinstaller puis réinstaller
// le logiciel ne redonne donc pas un nouvel essai. Aucune donnée personnelle : seulement l'empreinte de l'appareil.
// Enregistré dans le journal (action TRIAL_START, details = produit:plateforme:empreinte), sans nouvelle table.
const ACTION = "TRIAL_START";
const PLUS_ANCIEN_ACCEPTE = Date.parse("2026-01-01T00:00:00Z");

export async function POST(req: Request) {
  return withPublicLicenseCors(await handle(async () => {
    const client = req.headers.get("x-gspp-client");
    if (client !== "desktop" && client !== "android") return fail("Client inconnu.", 401);
    const rl = rateLimit(`swtrial:${getClientIp(req)}`, 30, 15 * 60 * 1000);
    if (!rl.allowed) return fail("Trop de requêtes. Réessayez plus tard.", 429);

    const body = await req.json().catch(() => ({}));
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim().toLowerCase() : "";
    if (!/^[a-f0-9]{64}$/.test(deviceId)) return fail("Appareil non reconnu.", 400);
    const platform = detectDevicePlatform({ userAgent: req.headers.get("user-agent"), clientHeader: client, bodyPlatform: body.platform });
    const details = `${normalizeProduct(body.product)}:${platform}:${deviceId}`;

    const connu = await db.activityLog.findFirst({ where: { action: ACTION, details }, orderBy: { createdAt: "asc" }, select: { createdAt: true } });
    const maintenant = new Date();
    if (connu) return ok({ firstSeen: connu.createdAt.toISOString(), serverTime: maintenant.toISOString() });

    // Premier contact : la date annoncée par le logiciel est gardée si elle est plus ancienne (jamais dans le futur).
    const annonce = typeof body.premier === "string" ? Date.parse(body.premier) : NaN;
    const debut = Number.isFinite(annonce) && annonce >= PLUS_ANCIEN_ACCEPTE && annonce < maintenant.getTime() ? new Date(annonce) : maintenant;
    await db.activityLog.create({ data: { action: ACTION, details, ipAddress: null, createdAt: debut } });
    return ok({ firstSeen: debut.toISOString(), serverTime: maintenant.toISOString() });
  }));
}

export function OPTIONS() {
  return withPublicLicenseCors(new Response(null, { status: 204 }));
}
