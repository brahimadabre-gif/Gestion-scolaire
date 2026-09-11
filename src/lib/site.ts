// Configuration centrale du site — modifiable sans toucher au code
// Les valeurs sensibles (secrets) restent dans .env — JAMAIS ici.

export const SITE = {
  name: "Gestion Scolaire Pro Plus",
  shortName: "GSP Pro Plus",
  slogan: "Simplifiez votre travail avec Gestion Scolaire Pro Plus !",
  tagline: "La solution complète pour simplifier la gestion scolaire.",
  description:
    "Gagnez du temps, réduisez les erreurs et simplifiez la gestion quotidienne de votre école primaire grâce à une solution pensée pour les directeurs et enseignants : CP1, CP2, CE1, CE2, CM1, CM2, notes, bulletins, classements, certificats et administration.",
  url: "https://gestionscolaire.pro",
  email: "brahimadabre@yahoo.com",
  phone: "+2250709933364",
  city: "Abidjan, Côte d'Ivoire",
  keywords: [
    "gestion scolaire",
    "logiciel de gestion scolaire",
    "logiciel scolaire",
    "gestion école primaire",
    "Gestion Scolaire Pro Plus",
    "bulletins scolaires",
    "notes élèves",
    "bulletins primaire",
    "CP1 CP2 CE1 CE2 CM1 CM2",
    "logiciel éducation",
  ],
};

// Types de routes de l'application (routeur par hash côté client)
export type Route =
  | "/" | "/fonctionnalites" | "/tarifs" | "/telecharger" | "/notice" | "/bibliotheque"
  | "/tutoriel-compte" | "/faq" | "/support" | "/actualites"
  | "/connexion" | "/inscription" | "/mot-de-passe-oublie"
  | "/compte" | "/compte/abonnement" | "/compte/paiements" | "/compte/support"
  | "/admin"
  | "/legal/cgu" | "/legal/confidentialite" | "/legal/cookies" | "/legal/mentions";

export const MAIN_NAV: { label: string; route: Route }[] = [
  { label: "Accueil", route: "/" },
  { label: "Fonctionnalités", route: "/fonctionnalites" },
  { label: "Tarifs", route: "/tarifs" },
  { label: "Télécharger", route: "/telecharger" },
  { label: "Notice", route: "/notice" },
  { label: "Bibliothèque", route: "/bibliotheque" },
  { label: "Actualités", route: "/actualites" },
  { label: "FAQ", route: "/faq" },
  { label: "Contact", route: "/support" },
];

export const FOOTER_NAV = {
  navigation: [
    { label: "Accueil", route: "/" },
    { label: "Fonctionnalités", route: "/fonctionnalites" },
    { label: "Tarifs", route: "/tarifs" },
    { label: "Télécharger", route: "/telecharger" },
    { label: "Documentation", route: "/notice" },
    { label: "Bibliothèque", route: "/bibliotheque" },
    { label: "Tutoriels", route: "/tutoriel-compte" },
    { label: "FAQ", route: "/faq" },
    { label: "Contact", route: "/support" },
  ] as { label: string; route: Route }[],
  account: [
    { label: "Connexion", route: "/connexion" },
    { label: "Créer un compte", route: "/inscription" },
    { label: "Mon compte", route: "/compte" },
  ] as { label: string; route: Route }[],
  legal: [
    { label: "Conditions générales d'utilisation", route: "/legal/cgu" },
    { label: "Politique de confidentialité", route: "/legal/confidentialite" },
    { label: "Politique de cookies", route: "/legal/cookies" },
    { label: "Mentions légales", route: "/legal/mentions" },
  ] as { label: string; route: Route }[],
};

// Formater un prix en FCFA
export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount) + " FCFA";
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(d));
}
