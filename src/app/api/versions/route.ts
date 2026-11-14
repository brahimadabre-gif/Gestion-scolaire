import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

const currentRelease = {
  id: "release-2.3.31",
  version: "2.3.31",
  channel: "stable",
  releaseDate: new Date("2026-11-13T00:00:00.000Z"),
  fileSizeMb: 9.97,
  minOs: "Android 5.1 ou supérieur, téléphone ou tablette",
  installerName: "APK Android",
  downloadUrl: "/downloads/Gestion-Scolaire-Pro-v2.3.31.apk",
  changelog: "## Version 2.3.31 (Android)\n- Écrans modernisés : bulletins, rangement, liste de classe, élèves, matières, EPS, rapport de fin d’année.\n- Registre d’appel et assiduité refaits, affichage jusqu’à 10 fois plus rapide.\n- Progression : nouvelle vue « Données » en 3 colonnes.\n- Rapport de fin d’année : chiffres modifiables avec recalcul automatique.\n- Signature importée nette et centrée, notifications plus courtes.",
  md5: "10891f06eaa26df3e485a72e22afa795",
  downloads: 0,
  active: true,
  createdAt: new Date("2026-11-13T00:00:00.000Z"),
  updatedAt: new Date("2026-11-13T00:00:00.000Z"),
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
