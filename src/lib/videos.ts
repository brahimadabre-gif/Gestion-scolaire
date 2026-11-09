// Tutoriels vidéo de la chaîne YouTube @GESTIONSCOLAIREPRO.
// Pour ajouter une vidéo : ajouter une ligne ici et sa miniature dans
// public/videos/<slug>.jpg (640 px de large). `youtubeId: null` = « bientôt ».

export const YOUTUBE_CHANNEL = {
  handle: "@GESTIONSCOLAIREPRO",
  url: "https://www.youtube.com/@GESTIONSCOLAIREPRO",
  subscribeUrl: "https://www.youtube.com/@GESTIONSCOLAIREPRO?sub_confirmation=1",
};

export const VIDEO_PLAYLISTS = [
  "Démarrer",
  "Élèves et classes",
  "Notes et bulletins",
  "Appel et assiduité",
  "Documents de l'élève",
  "Caisse",
  "EPS",
  "Administration",
  "Sauvegarde",
] as const;
export type VideoPlaylist = (typeof VIDEO_PLAYLISTS)[number];

export interface TutorialVideo {
  number: number;
  slug: string;
  title: string;
  summary: string;
  playlist: VideoPlaylist;
  /** Durée « m:ss » */
  duration: string;
  youtubeId: string | null;
}

export const TUTORIAL_VIDEOS: TutorialVideo[] = [
  { number: 2, slug: "02-creer-le-compte-directeur", title: "Créer le compte directeur et se connecter", summary: "Identifiants, mot de passe et code de secours au premier lancement.", playlist: "Démarrer", duration: "2:46", youtubeId: "aLffWZs526s" },
  { number: 3, slug: "03-inscrire-un-eleve", title: "Inscrire un nouvel élève", summary: "La fiche de l'élève remplie pas à pas.", playlist: "Élèves et classes", duration: "3:01", youtubeId: "cssFM3xOgsU" },
  { number: 4, slug: "04-importer-une-liste", title: "Importer une liste d'élèves", summary: "Toute une classe d'un coup depuis Excel, Word, PDF ou une photo.", playlist: "Élèves et classes", duration: "2:26", youtubeId: "jmhcL2BExYI" },
  { number: 5, slug: "05-imprimer-la-liste-de-classe", title: "Imprimer la liste de classe", summary: "Effectifs garçons / filles et en-tête de l'école.", playlist: "Élèves et classes", duration: "1:54", youtubeId: "X_rowGiNawM" },
  { number: 6, slug: "06-creer-les-matieres", title: "Créer les matières, coefficients et barèmes", summary: "Régler les matières de chaque classe avant les notes.", playlist: "Notes et bulletins", duration: "1:46", youtubeId: "OXglWbKY5XI" },
  { number: 7, slug: "07-saisir-les-notes", title: "Saisir les notes d'une composition", summary: "Les notes élève par élève, sans erreur.", playlist: "Notes et bulletins", duration: "2:29", youtubeId: "FsZfHD2r1q4" },
  { number: 8, slug: "08-voir-le-classement", title: "Voir le classement d'une classe", summary: "Rangs, moyennes et admis calculés automatiquement.", playlist: "Notes et bulletins", duration: "2:24", youtubeId: "cUM1vybfUWE" },
  { number: 9, slug: "09-imprimer-les-bulletins", title: "Imprimer les bulletins scolaires", summary: "Un élève ou toute la classe, prêts à signer.", playlist: "Notes et bulletins", duration: "2:27", youtubeId: "IwvnDigNfek" },
  { number: 10, slug: "10-faire-l-appel", title: "Faire l'appel et suivre les absences", summary: "Matin et après-midi, puis l'assiduité de chaque élève.", playlist: "Appel et assiduité", duration: "2:25", youtubeId: "v1O8mEaK1xc" },
  { number: 11, slug: "11-certificat-de-scolarite", title: "Délivrer un certificat de scolarité", summary: "Le document prêt à imprimer en quelques clics.", playlist: "Documents de l'élève", duration: "2:01", youtubeId: "oaVawiGDIng" },
  { number: 12, slug: "12-dossier-individuel-de-l-eleve", title: "Le dossier individuel de l'élève", summary: "Extrait de naissance, fiche individuelle et pièces.", playlist: "Documents de l'élève", duration: "1:48", youtubeId: "KQEdX_WoYQA" },
  { number: 13, slug: "13-encaisser-un-paiement", title: "Encaisser un paiement et imprimer le reçu", summary: "Le reste à payer se calcule tout seul.", playlist: "Caisse", duration: "1:39", youtubeId: "_F-kOoE38tQ" },
  { number: 14, slug: "14-enregistrer-une-depense", title: "Enregistrer une dépense", summary: "Chaque sortie d'argent de la caisse.", playlist: "Caisse", duration: "1:30", youtubeId: "3roIRPx0VHk" },
  { number: 15, slug: "15-payer-les-salaires", title: "Payer les salaires", summary: "Le personnel payé et le bulletin de paie imprimé.", playlist: "Caisse", duration: "2:01", youtubeId: "7xAHm0qtLG4" },
  { number: 16, slug: "16-groupes-d-eps-et-tailles", title: "Saisir les tailles et former les groupes d'EPS", summary: "Des groupes équilibrés en quelques minutes.", playlist: "EPS", duration: "1:45", youtubeId: "bxTemgxXi_0" },
  { number: 17, slug: "17-eps-grandes-classes", title: "EPS grandes classes : course, clubs et équipes", summary: "CE2, CM1 et CM2 : deux séances de course.", playlist: "EPS", duration: "2:23", youtubeId: "BDWrj3iFsy8" },
  { number: 18, slug: "18-registre-matricule", title: "Le registre matricule de l'école", summary: "Le numéro d'ordre devient le matricule de l'élève.", playlist: "Administration", duration: "1:56", youtubeId: "JVVJUy1AnGU" },
  { number: 19, slug: "19-rapport-fin-annee", title: "Préparer le rapport de fin d'année", summary: "Résultats, compte rendu et permanence.", playlist: "Administration", duration: "2:45", youtubeId: "XPhhg6oRwB8" },
  { number: 20, slug: "20-passage-de-classe-classeur", title: "Passage de classe et archives", summary: "Les admis passent en classe supérieure, l'année est archivée.", playlist: "Administration", duration: "2:08", youtubeId: "YSkBUH9N1R0" },
  { number: 21, slug: "21-sauvegarde-et-restauration", title: "Sauvegarder et restaurer les données", summary: "Ne plus jamais perdre une année de travail.", playlist: "Sauvegarde", duration: "1:47", youtubeId: "mP0U8xmWE8c" },
  { number: 22, slug: "22-synchroniser-plusieurs-appareils", title: "Synchroniser plusieurs appareils", summary: "Direction et enseignants travaillent ensemble.", playlist: "Sauvegarde", duration: "1:51", youtubeId: null },
];

export const PUBLISHED_VIDEOS = TUTORIAL_VIDEOS.filter((v) => v.youtubeId);

export function videoThumb(v: TutorialVideo) {
  return `/videos/${v.slug}.jpg`;
}

/** Durée moyenne arrondie à la minute, pour l'affichage (« 2 min ») */
export function averageMinutes(): number {
  const secs = TUTORIAL_VIDEOS.map((v) => {
    const [m, s] = v.duration.split(":").map(Number);
    return m * 60 + s;
  });
  return Math.round(secs.reduce((a, b) => a + b, 0) / secs.length / 60);
}
