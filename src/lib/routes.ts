// Pages publiques du site : adresse, titre et description pour Google.
// Chaque adresse (ex. https://gestionscolaire.pro/tarifs) est une vraie page,
// ce qui permet à Google de l'indexer séparément (les anciennes adresses en
// « #/… » sont redirigées automatiquement par le routeur client).
import type { Route } from "./site";

export interface RouteMeta {
  title: string;
  description: string;
  /** false : page privée ou sans intérêt pour les moteurs de recherche */
  index: boolean;
  /** Priorité dans le sitemap (pages indexées uniquement) */
  priority?: number;
  changeFrequency?: "weekly" | "monthly" | "yearly";
}

export const ROUTE_META: Record<Exclude<Route, "/">, RouteMeta> = {
  "/fonctionnalites": {
    title: "Fonctionnalités",
    description:
      "Élèves, classes de CP1 à CM2, notes, moyennes, classements, bulletins, certificats, registre d'appel, caisse scolaire : toutes les fonctions de Gestion Scolaire Pro Plus.",
    index: true, priority: 0.9, changeFrequency: "monthly",
  },
  "/tarifs": {
    title: "Tarifs et abonnement",
    description:
      "Formules et prix de Gestion Scolaire Pro Plus en FCFA, durée d'accès et obtention de la clé d'activation.",
    index: true, priority: 0.9, changeFrequency: "monthly",
  },
  "/telecharger": {
    title: "Télécharger le logiciel",
    description:
      "Téléchargez Gestion Scolaire Pro Plus pour Windows (Microsoft Store) ou Android, puis activez-le avec votre clé.",
    index: true, priority: 0.9, changeFrequency: "weekly",
  },
  "/notice": {
    title: "Notice d'utilisation",
    description:
      "Guide complet de Gestion Scolaire Pro Plus : installation, élèves, notes, bulletins, documents administratifs et sauvegardes.",
    index: true, priority: 0.8, changeFrequency: "weekly",
  },
  "/bibliotheque": {
    title: "Bibliothèque",
    description:
      "Programmes éducatifs et guides d'exécution du primaire (CP1 à CM2) à télécharger gratuitement.",
    index: true, priority: 0.8, changeFrequency: "weekly",
  },
  "/tutoriel-compte": {
    title: "Tutoriel : créer un compte",
    description:
      "Créez votre compte Gestion Scolaire Pro Plus étape par étape pour accéder à votre espace client et à votre licence.",
    index: true, priority: 0.7, changeFrequency: "monthly",
  },
  "/actualites": {
    title: "Actualités et tutoriels",
    description:
      "Nouvelles versions, tutoriels et conseils pour utiliser Gestion Scolaire Pro Plus dans votre école primaire.",
    index: true, priority: 0.7, changeFrequency: "weekly",
  },
  "/faq": {
    title: "Questions fréquentes",
    description:
      "Réponses aux questions sur le logiciel, le compte, l'abonnement, l'activation et le fonctionnement hors connexion.",
    index: true, priority: 0.6, changeFrequency: "monthly",
  },
  "/support": {
    title: "Support et contact",
    description:
      "Contactez le support de Gestion Scolaire Pro Plus par formulaire, WhatsApp ou téléphone.",
    index: true, priority: 0.6, changeFrequency: "monthly",
  },
  "/inscription": {
    title: "Créer un compte",
    description: "Créez gratuitement votre compte Gestion Scolaire Pro Plus.",
    index: true, priority: 0.5, changeFrequency: "yearly",
  },
  "/connexion": { title: "Connexion", description: "Connectez-vous à votre espace client.", index: false },
  "/mot-de-passe-oublie": { title: "Mot de passe oublié", description: "Réinitialisez votre mot de passe.", index: false },
  "/compte": { title: "Mon compte", description: "Votre espace client.", index: false },
  "/compte/abonnement": { title: "Mon abonnement", description: "Votre abonnement.", index: false },
  "/compte/paiements": { title: "Mes paiements", description: "Vos paiements.", index: false },
  "/compte/support": { title: "Mes demandes", description: "Vos demandes au support.", index: false },
  "/admin": { title: "Administration", description: "Administration du site.", index: false },
  "/legal/cgu": {
    title: "Conditions générales d'utilisation",
    description: "Conditions générales d'utilisation du site et du logiciel Gestion Scolaire Pro Plus.",
    index: true, priority: 0.3, changeFrequency: "yearly",
  },
  "/legal/confidentialite": {
    title: "Politique de confidentialité",
    description: "Données collectées, finalités et protection, conformément à la loi ivoirienne n° 2013-450.",
    index: true, priority: 0.3, changeFrequency: "yearly",
  },
  "/legal/cookies": {
    title: "Politique de cookies",
    description: "Cookies utilisés sur le site et comment les gérer.",
    index: true, priority: 0.3, changeFrequency: "yearly",
  },
  "/legal/mentions": {
    title: "Mentions légales",
    description: "Éditeur, hébergeur et informations légales du site Gestion Scolaire Pro Plus.",
    index: true, priority: 0.3, changeFrequency: "yearly",
  },
};

export function pathFromSlug(slug: string[] | undefined): string {
  if (!slug || slug.length === 0) return "/";
  return "/" + slug.map((s) => decodeURIComponent(s)).join("/");
}

export function isKnownPath(path: string): path is Exclude<Route, "/"> {
  return Object.prototype.hasOwnProperty.call(ROUTE_META, path);
}
