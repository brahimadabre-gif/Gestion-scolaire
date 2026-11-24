import { db } from "@/lib/db";
import { fail, getClientIp, handle, ok, rateLimit, withPublicLicenseCors } from "@/lib/api-helpers";
import { normaliserCle } from "@/lib/software-messages";

// POST /api/software/messages/lu — le logiciel signale qu'un message a été lu
// (bouton « J'ai compris »). Corps : { ids: string[], licenseKey?, installId? }
export async function POST(req: Request) {
  return withPublicLicenseCors(await handle(async () => {
    const client = req.headers.get("x-gspp-client");
    if (client !== "desktop" && client !== "android") return fail("Client inconnu.", 401);
    const rl = rateLimit(`swmsglu:${getClientIp(req)}`, 120, 15 * 60 * 1000);
    if (!rl.allowed) return fail("Trop de requêtes. Réessayez plus tard.", 429);

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown): x is string => typeof x === "string").slice(0, 50) : [];
    const licenseKey = typeof body.licenseKey === "string" && body.licenseKey.trim() ? normaliserCle(body.licenseKey).slice(0, 60) : null;
    const installId = typeof body.installId === "string" ? body.installId.trim().slice(0, 80) : "";
    const viewer = licenseKey ?? (installId ? `install:${installId}` : null);
    if (!viewer || !ids.length) return fail("Rien à enregistrer.", 400);

    const res = await db.softwareMessageView.updateMany({
      where: { viewer, messageId: { in: ids }, readAt: null },
      data: { readAt: new Date() },
    });
    return ok({ updated: res.count });
  }));
}

export function OPTIONS() {
  return withPublicLicenseCors(new Response(null, { status: 204 }));
}
