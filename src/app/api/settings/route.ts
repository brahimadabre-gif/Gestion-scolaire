import { z } from "zod";
import { db } from "@/lib/db";
import { ok, handle, assertSameOrigin, getClientIp, logAction } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/settings — Paramètres publics du site (contact, réseaux sociaux...)
export async function GET() {
  return handle(async () => {
    const s = await db.siteSettings.findUnique({ where: { id: "main" } });
    return ok({
      siteName: s?.siteName ?? "Gestion Scolaire Pro Plus",
      slogan: s?.slogan ?? "Simplifiez votre travail avec Gestion Scolaire Pro Plus !",
      contactEmail: s?.contactEmail,
      contactPhone: s?.contactPhone,
      addressLine: s?.addressLine,
      facebookUrl: s?.facebookUrl ?? "",
      twitterUrl: s?.twitterUrl ?? "",
      linkedinUrl: s?.linkedinUrl ?? "",
      youtubeUrl: s?.youtubeUrl ?? "",
    });
  });
}

// PATCH /api/settings — Mise à jour des paramètres (administration uniquement)
const settingsPatchSchema = z.object({
  siteName: z.string().trim().min(2).max(80).optional(),
  slogan: z.string().trim().max(160).optional(),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().max(30).optional(),
  addressLine: z.string().trim().max(200).optional(),
  facebookUrl: z.string().trim().max(300).optional(),
  twitterUrl: z.string().trim().max(300).optional(),
  linkedinUrl: z.string().trim().max(300).optional(),
  youtubeUrl: z.string().trim().max(300).optional(),
  maintenanceMode: z.boolean().optional(),
  defaultDownloadUrl: z.string().trim().max(500).optional(),
});

export async function PATCH(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const ip = getClientIp(req);
    const data = settingsPatchSchema.parse(await req.json());

    const updated = await db.siteSettings.update({
      where: { id: "main" },
      data,
    });
    await logAction("ADMIN_UPDATE", admin.id, "settings", ip);
    return ok({
      siteName: updated.siteName,
      slogan: updated.slogan,
      contactEmail: updated.contactEmail,
      contactPhone: updated.contactPhone,
      addressLine: updated.addressLine,
      facebookUrl: updated.facebookUrl,
      twitterUrl: updated.twitterUrl,
      linkedinUrl: updated.linkedinUrl,
      youtubeUrl: updated.youtubeUrl,
      maintenanceMode: updated.maintenanceMode,
      defaultDownloadUrl: updated.defaultDownloadUrl,
    });
  });
}
