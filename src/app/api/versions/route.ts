import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

const currentRelease = {
  id: "release-2.3.34",
  version: "2.3.34",
  channel: "stable",
  releaseDate: new Date("2026-11-25T00:00:00.000Z"),
  fileSizeMb: 10.1,
  minOs: "Android 5.1 ou supérieur, téléphone ou tablette",
  installerName: "APK Android",
  downloadUrl: "/downloads/Gestion-Scolaire-Pro-v2.3.34.apk",
  changelog: "## Version 2.3.34 (Android)\n- Carte scolaire : cartes de toute la classe avec photo, QR code et code-barres, 6 modèles, impression A4 ou carte PVC.\n- Certificats et fiche scolaire : 5 nouveaux modèles aux couleurs de la République.\n- Bulletins : 3 nouveaux modèles (A, C en couleur, E), bulletin affiché en entier sur téléphone, signatures à la bonne taille.\n- Photos des élèves dans Gestion des élèves et la liste des bulletins.\n- Synchronisation Wi-Fi avec la direction dans les deux sens, plus rapide.\n- Reprend toutes les nouveautés de la 2.3.33.",
  md5: "0621d9814beec50b28caa42c0fa781d9",
  downloads: 0,
  active: true,
  createdAt: new Date("2026-11-25T00:00:00.000Z"),
  updatedAt: new Date("2026-11-25T00:00:00.000Z"),
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
