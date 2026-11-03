import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

const currentRelease = {
  id: "release-2.3.19",
  version: "2.3.19",
  channel: "stable",
  releaseDate: new Date("2026-11-02T00:00:00.000Z"),
  fileSizeMb: 9.63,
  minOs: "Android 5.1 ou supérieur, téléphone ou tablette",
  installerName: "APK Android",
  downloadUrl: "/downloads/Gestion-Scolaire-Pro-v2.3.19.apk",
  changelog: "## Version 2.3.19 (Android)\n- Photo de l’élève prise directement dans l’application, sans la fermer.\n- Notes à virgule conservées telles quelles, jusqu’à deux décimales.\n- Moyennes de composition calculées sur le total des barèmes.\n- Connexion par empreinte digitale fiabilisée.",
  md5: null,
  downloads: 0,
  active: true,
  createdAt: new Date("2026-11-02T00:00:00.000Z"),
  updatedAt: new Date("2026-11-02T00:00:00.000Z"),
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
