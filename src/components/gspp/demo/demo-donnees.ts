// ── Démo interactive : données FICTIVES (EPP Les Palmiers) ──
// Tout reste dans la mémoire de la page : rien n'est envoyé ni enregistré.

export type Genre = "F" | "M";

export interface Eleve {
  id: string;
  matricule: string | null;
  nom: string;
  prenoms: string;
  genre: Genre;
  naissance: string; // AAAA-MM-JJ
  lieu: string;
  parent: string;
  tel: string;
  statut: "Nouveau" | "Redoublant";
  notes: Record<string, number | null>;
  matin: boolean;
  soir: boolean;
  absences: number;
  renfo: boolean;
}

export interface Matiere { id: string; nom: string; sur: number }
export interface Paiement { id: string; eleveId: string; montant: number; motif: string; date: string }
export interface Fiche { id: string; matiere: string; lecon: string; seance: string; statut: "Brouillon" | "Validée" }
export interface Progression { matiere: string; faites: number; total: number }
export interface Ligne { heure: string; texte: string }

export interface EtatDemo {
  ecole: string;
  annee: string;
  classe: string;
  enseignant: string;
  eleves: Eleve[];
  matieres: Matiere[];
  paiements: Paiement[];
  fiches: Fiche[];
  progression: Progression[];
  seuil: number;
  fraisScolarite: number;
  journal: Ligne[];
  couleurFilles: string;
  couleurGarcons: string;
}

export const MATIERES: Matiere[] = [
  { id: "maths", nom: "Mathématiques", sur: 30 },
  { id: "francais", nom: "Français", sur: 30 },
  { id: "histgeo", nom: "Histoire-Géographie", sur: 10 },
  { id: "sciences", nom: "Sciences", sur: 10 },
  { id: "edhc", nom: "EDHC", sur: 10 },
  { id: "lecture", nom: "Lecture", sur: 10 },
];

type Brut = [string, string, Genre, string, string, string, string, Eleve["statut"], number[], number];
const BRUT: Brut[] = [
  ["KONAN", "Aya Grâce", "F", "2015-03-12", "Abidjan", "KONAN Hervé", "07 07 12 34 56", "Nouveau", [26, 24, 9, 8, 9, 9], 0],
  ["TRAORE", "Moussa", "M", "2014-11-02", "Bouaké", "TRAORE Adama", "05 05 23 45 67", "Nouveau", [18, 20, 7, 6, 8, 7], 2],
  ["DIABATE", "Fatou", "F", "2015-06-21", "Korhogo", "DIABATE Mariam", "01 01 34 56 78", "Nouveau", [28, 27, 9, 9, 10, 9], 0],
  ["KOUASSI", "Yao Serge", "M", "2014-01-15", "Yamoussoukro", "KOUASSI Jean", "07 08 45 67 89", "Redoublant", [11, 13, 5, 4, 6, 5], 4],
  ["BAMBA", "Salimata", "F", "2015-09-30", "Daloa", "BAMBA Issouf", "05 04 56 78 90", "Nouveau", [21, 22, 8, 7, 7, 8], 1],
  ["OUATTARA", "Ibrahim", "M", "2015-04-08", "San-Pédro", "OUATTARA Awa", "01 02 67 89 01", "Nouveau", [15, 14, 6, 6, 7, 6], 3],
  ["KONE", "Mariam", "F", "2014-08-19", "Abidjan", "KONE Seydou", "07 09 78 90 12", "Nouveau", [9, 11, 4, 5, 5, 4], 5],
  ["YAO", "Kouadio Elie", "M", "2015-02-27", "Gagnoa", "YAO Christine", "05 06 89 01 23", "Nouveau", [23, 19, 8, 8, 8, 7], 1],
];

export function etatInitial(): EtatDemo {
  const eleves: Eleve[] = BRUT.map((b, i) => ({
    id: "e" + (i + 1),
    matricule: "2026" + String(141 + i).padStart(3, "0"),
    nom: b[0], prenoms: b[1], genre: b[2], naissance: b[3], lieu: b[4], parent: b[5], tel: b[6], statut: b[7],
    notes: Object.fromEntries(MATIERES.map((m, j) => [m.id, b[8][j]])),
    matin: true, soir: true, absences: b[9], renfo: i % 3 === 0,
  }));
  return {
    ecole: "EPP Les Palmiers",
    annee: "2026-2027",
    classe: "CM2 A",
    enseignant: "M. TANOH Serge",
    eleves,
    matieres: MATIERES.map((m) => ({ ...m })),
    paiements: [
      { id: "p1", eleveId: "e1", montant: 10000, motif: "Frais de scolarité", date: "16/09/2026" },
      { id: "p2", eleveId: "e3", montant: 10000, motif: "Frais de scolarité", date: "17/09/2026" },
      { id: "p3", eleveId: "e5", montant: 5000, motif: "Frais de scolarité (1re tranche)", date: "22/09/2026" },
      { id: "p4", eleveId: "e2", montant: 2500, motif: "Cours de renforcement", date: "02/10/2026" },
    ],
    fiches: [
      { id: "f1", matiere: "Mathématiques", lecon: "Les fractions", seance: "Comparer des fractions", statut: "Validée" },
      { id: "f2", matiere: "Français", lecon: "Le marché", seance: "Lecture : le marché de Treichville", statut: "Validée" },
      { id: "f3", matiere: "Sciences", lecon: "L'eau", seance: "Les états de l'eau", statut: "Brouillon" },
    ],
    progression: [
      { matiere: "Mathématiques", faites: 9, total: 24 },
      { matiere: "Français", faites: 11, total: 26 },
      { matiere: "Histoire-Géographie", faites: 4, total: 12 },
      { matiere: "Sciences", faites: 5, total: 12 },
      { matiere: "EDHC", faites: 6, total: 10 },
    ],
    seuil: 5,
    fraisScolarite: 10000,
    journal: [{ heure: "07:58", texte: "Connexion de M. TANOH Serge (directeur)" }],
    couleurFilles: "#DB2777",
    couleurGarcons: "#2563EB",
  };
}

// ── Calculs ──────────────────────────────────────────────────
export function totalSur(matieres: Matiere[]) {
  return matieres.reduce((a, m) => a + m.sur, 0);
}

export function moyenne(e: Eleve, matieres: Matiere[]): number {
  let total = 0, sur = 0;
  for (const m of matieres) {
    const n = e.notes[m.id];
    if (n !== null && n !== undefined && !Number.isNaN(n)) { total += n; sur += m.sur; }
  }
  return sur ? (total / sur) * 10 : 0;
}

export function totalPoints(e: Eleve, matieres: Matiere[]) {
  return matieres.reduce((a, m) => a + (e.notes[m.id] ?? 0), 0);
}

export function classement(eleves: Eleve[], matieres: Matiere[]) {
  return [...eleves].sort((a, b) => moyenne(b, matieres) - moyenne(a, matieres));
}

export function rangDe(id: string, eleves: Eleve[], matieres: Matiere[]) {
  return classement(eleves, matieres).findIndex((e) => e.id === id) + 1;
}

export const fmt = (n: number, d = 2) => n.toFixed(d).replace(".", ",");
export const fcfa = (n: number) => n.toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA";
export const rangTexte = (r: number) => (r === 1 ? "1er" : r + "e");
export const initiales = (e: Pick<Eleve, "nom" | "prenoms">) => (e.nom[0] + (e.prenoms[0] || "")).toUpperCase();
export const age = (naissance: string) => 2026 - Number(naissance.slice(0, 4));
export const dateFr = (iso: string) => iso.split("-").reverse().join("/");
export const heureMaintenant = () => {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
};

// ── Menu du logiciel (mêmes groupes et libellés que GSPP) ────
export interface EntreeMenu { id: string; libelle: string; icone: string }
export interface GroupeMenu { titre: string; entrees: EntreeMenu[] }

export const MENU: GroupeMenu[] = [
  {
    titre: "Principal", entrees: [
      { id: "dashboard", libelle: "Tableau de bord", icone: "📊" },
      { id: "caisse", libelle: "Caisse", icone: "💰" },
      { id: "renforcement", libelle: "Cours de renforcement", icone: "📚" },
      { id: "eleves", libelle: "Gestion des élèves", icone: "👥" },
      { id: "listeClasse", libelle: "Liste de classe", icone: "📋" },
      { id: "groupe-eps", libelle: "Groupe d'EPS", icone: "🏃" },
      { id: "recap", libelle: "Tableau récapitulatif", icone: "🧮" },
    ],
  },
  {
    titre: "Académique", entrees: [
      { id: "matieres", libelle: "Gestion des matières", icone: "📘" },
      { id: "notes", libelle: "Saisie des notes", icone: "📝" },
      { id: "classement", libelle: "Rangement", icone: "🏆" },
      { id: "bulletins", libelle: "Bulletins scolaires", icone: "📄" },
      { id: "parents", libelle: "Contacts parents", icone: "📞" },
    ],
  },
  {
    titre: "Pédagogie", entrees: [
      { id: "progression", libelle: "Progression", icone: "📈" },
      { id: "fiches", libelle: "Fiches de séance", icone: "🗂️" },
    ],
  },
  {
    titre: "Édition", entrees: [
      { id: "documents", libelle: "Documents de l'élève", icone: "🎓" },
      { id: "statistiques", libelle: "Statistiques", icone: "📉" },
      { id: "dossier", libelle: "Dossier individuel élève", icone: "🗃️" },
      { id: "dossier-ens", libelle: "Dossier individuel enseignant", icone: "👨‍🏫" },
      { id: "classeur", libelle: "Classeur", icone: "🗄️" },
      { id: "rapport", libelle: "Rapport de fin d'année", icone: "📑" },
      { id: "registre-matricule", libelle: "Registre matricule", icone: "🔢" },
    ],
  },
  {
    titre: "Assiduité", entrees: [
      { id: "appel", libelle: "Registre d'appel", icone: "✅" },
      { id: "assiduite", libelle: "Assiduité", icone: "📆" },
    ],
  },
  {
    titre: "Système", entrees: [
      { id: "admission", libelle: "Admission exceptionnelle", icone: "⚖️" },
      { id: "conversion", libelle: "Convertisseur de fichiers", icone: "🔄" },
      { id: "parametres", libelle: "Paramètres", icone: "⚙️" },
      { id: "licences", libelle: "Gestion des licences", icone: "🔑" },
      { id: "historique", libelle: "Historique", icone: "🕘" },
      { id: "synchronisation", libelle: "Synchronisation", icone: "🔁" },
    ],
  },
];

export const TOUTES_ENTREES = MENU.flatMap((g) => g.entrees);
export const libelleDe = (id: string) => TOUTES_ENTREES.find((e) => e.id === id)?.libelle ?? id;
export const iconeDe = (id: string) => TOUTES_ENTREES.find((e) => e.id === id)?.icone ?? "📄";
