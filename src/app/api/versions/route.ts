import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

const currentRelease = {
  id: "release-2.3.26",
  version: "2.3.26",
  channel: "stable",
  releaseDate: new Date("2026-11-07T00:00:00.000Z"),
  fileSizeMb: 9.79,
  minOs: "Android 5.1 ou supérieur, téléphone ou tablette",
  installerName: "APK Android",
  downloadUrl: "/downloads/Gestion-Scolaire-Pro-v2.3.26.apk",
  changelog: "## Version 2.3.26 (Android)\n- Fenêtres de confirmation modernes dans tout le logiciel.\n- Réinitialisation complète en trois étapes de sécurité numérotées.\n- Documents de l’élève regroupés dans une seule entrée, avec aperçus.\n- Groupe d’EPS : saisie des tailles et rangement du plus petit au plus grand.\n- EPS grandes classes (CE2, CM1, CM2) : nouveau tableau de bord.",
  md5: null,
  downloads: 0,
  active: true,
  createdAt: new Date("2026-11-07T00:00:00.000Z"),
  updatedAt: new Date("2026-11-07T00:00:00.000Z"),
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
