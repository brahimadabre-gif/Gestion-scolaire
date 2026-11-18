import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

const currentRelease = {
  id: "release-2.3.32",
  version: "2.3.32",
  channel: "stable",
  releaseDate: new Date("2026-11-18T00:00:00.000Z"),
  fileSizeMb: 9.97,
  minOs: "Android 5.1 ou supérieur, téléphone ou tablette",
  installerName: "APK Android",
  downloadUrl: "/downloads/Gestion-Scolaire-Pro-v2.3.32.apk",
  changelog: "## Version 2.3.32 (Android)\n- Avis de mise à jour : le logiciel prévient dès qu’une nouvelle version est en ligne et propose de la télécharger.\n- Tableau récapitulatif : cartes des effectifs sans débordement sur téléphone.\n- Reprend toutes les nouveautés de la 2.3.31.",
  md5: "19e4dd39bc12d54db6619a3de2f99789",
  downloads: 0,
  active: true,
  createdAt: new Date("2026-11-18T00:00:00.000Z"),
  updatedAt: new Date("2026-11-18T00:00:00.000Z"),
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
