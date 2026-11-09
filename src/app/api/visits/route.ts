import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handle, getClientIp, rateLimit, assertSameOrigin } from "@/lib/api-helpers";

// POST /api/visits — compteur de visites anonyme (public).
// On ne stocke ni l'adresse IP ni le navigateur : seulement une empreinte
// hachée qui change chaque jour (Côte d'Ivoire = UTC, le jour est le jour UTC).
const schema = z.object({
  path: z.string().trim().min(1).max(200).regex(/^\//),
  video: z.string().trim().max(80).regex(/^[a-z0-9-]+$/).optional(),
  referrer: z.string().trim().max(500).optional(),
});

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|headless|lighthouse|curl|wget|python|node-fetch/i;

function sourceOf(referrer: string | undefined, host: string | null): string {
  if (!referrer) return "direct";
  let h = "";
  try { h = new URL(referrer).hostname.replace(/^www\./, ""); } catch { return "direct"; }
  if (!h || (host && host.split(":")[0].replace(/^www\./, "") === h)) return "direct";
  if (/whatsapp|wa\.me/.test(h)) return "whatsapp";
  if (/facebook|fb\.|messenger|instagram/.test(h)) return "facebook";
  if (/youtube|youtu\.be/.test(h)) return "youtube";
  if (/google|bing|yahoo|duckduckgo|qwant|ecosia/.test(h)) return "google";
  return "autre";
}

function deviceOf(ua: string): string {
  if (/ipad|tablet|kindle|silk/i.test(ua)) return "tablette";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "ordinateur";
}

export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || BOT.test(ua)) return ok({ counted: false });
    const ip = getClientIp(req);
    if (!rateLimit(`visit:${ip}`, 120, 10 * 60 * 1000).allowed) return fail("Trop de requêtes", 429);

    const body = schema.parse(await req.json().catch(() => ({})));
    if (body.path.startsWith("/admin")) return ok({ counted: false });

    const day = new Date().toISOString().slice(0, 10);
    const secret = process.env.JWT_SECRET ?? "gspp";
    const visitor = createHash("sha256").update(`${ip}|${ua}|${day}|${secret}`).digest("hex").slice(0, 32);

    await db.siteVisit.create({
      data: {
        visitor,
        path: body.path,
        video: body.video ?? null,
        source: sourceOf(body.referrer, req.headers.get("host")),
        device: deviceOf(ua),
      },
    });
    return ok({ counted: true });
  });
}
