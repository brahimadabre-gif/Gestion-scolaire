import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

const currentRelease = {
  id: "release-2.3.12",
  version: "2.3.12",
  channel: "stable",
  releaseDate: new Date("2026-10-10T00:00:00.000Z"),
  fileSizeMb: 8.69,
  minOs: "Windows 10 64 bits (ou supérieur), 4 Go de RAM, 500 Mo d'espace disque",
  installerName: "Gestion_Scolaire_Pro_Plus_v2.3.12_x64_Setup.exe",
  downloadUrl: "https://gestionscolaire.pro/downloads/Gestion_Scolaire_Pro_Plus_v2.3.12_x64_Setup.exe",
  changelog: "## Version 2.3.12\n- Nouvel installateur Windows fourni pour cette mise à jour.",
  md5: null,
  downloads: 0,
  active: true,
  createdAt: new Date("2026-10-10T00:00:00.000Z"),
  updatedAt: new Date("2026-10-10T00:00:00.000Z"),
};

// GET /api/versions — Dernière version stable active du logiciel (public)
export async function GET() {
  return handle(async () => {
    const version = await db.softwareVersion.findFirst({
      where: { active: true, channel: "stable" },
      orderBy: { releaseDate: "desc" },
    });
    // Le build de production peut être déployé sans exécuter le seed complet.
    // Ce secours rend la version livrée avec le site téléchargeable dès le déploiement.
    return ok(!version || version.releaseDate < currentRelease.releaseDate ? currentRelease : version);
  });
}
