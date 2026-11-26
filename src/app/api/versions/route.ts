import { db } from "@/lib/db";
import { ok, handle, withPublicLicenseCors } from "@/lib/api-helpers";

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

// Cantine Pro : dernière version publiée par plateforme. À mettre à jour à chaque nouveau setup ou APK
// (version, lien, taille, md5 du fichier). md5 null = le logiciel ouvre seulement la page de téléchargement.
const cantineReleases = {
  pc: {
    id: "cantine-pc-1.0.0",
    product: "CANTINE",
    platform: "PC",
    version: "1.0.0",
    channel: "stable",
    releaseDate: "2026-11-25T00:00:00.000Z",
    fileSizeMb: null as number | null,
    installerName: "Cantine Pro pour Windows",
    downloadUrl: "/downloads/Cantine-Pro-Setup-v1.0.0.exe",
    changelog: "## Cantine Pro 1.0.0\n- Première version : présences, repas, vivres, CFC et registres.",
    md5: null as string | null,
  },
  android: {
    id: "cantine-android-1.0.0",
    product: "CANTINE",
    platform: "ANDROID",
    version: "1.0.0",
    channel: "stable",
    releaseDate: "2026-11-25T00:00:00.000Z",
    fileSizeMb: null as number | null,
    installerName: "Cantine Pro pour Android (APK)",
    downloadUrl: "/downloads/Cantine-Pro-v1.0.0.apk",
    changelog: "## Cantine Pro 1.0.0\n- Première version : présences, repas, vivres, CFC et registres.",
    md5: null as string | null,
  },
};

// GET /api/versions — Dernière version stable active du logiciel (public)
// ?produit=cantine&plateforme=pc|android — version de Cantine Pro (lue par le logiciel lui-même, d'où le CORS).
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (params.get("produit")?.toLowerCase() === "cantine") {
    const plateforme = params.get("plateforme")?.toLowerCase() === "android" ? "android" : "pc";
    return withPublicLicenseCors(ok(cantineReleases[plateforme]));
  }
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
