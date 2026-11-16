"use client";

// ── Essai gratuit 30 jours (côté interface) ──
// L'essai est intégré au logiciel (sans clé) : le bouton de la carte mène au téléchargement.
// Le slug doit rester identique à celui de src/lib/essai-gratuit.ts (côté serveur).
export const ESSAI_SLUG = "essai-30-jours";
export const LIEN_ESSAI = "/telecharger";

export function estPlanEssai(plan: { slug: string } | null | undefined) {
  return plan?.slug === ESSAI_SLUG;
}

/** « 30 jours » pour l'essai, « 12 mois » pour les autres formules. */
export function dureePlan(plan: { slug: string; durationMonths?: number | null }) {
  return estPlanEssai(plan) ? "30 jours" : `${plan.durationMonths || 12} mois`;
}

/** Plateforme(s) couvertes par la formule. */
export function plateformePlan(plan: { slug: string; platform: string }) {
  if (estPlanEssai(plan)) return "PC Windows et Android";
  return plan.platform === "ANDROID" ? "Android" : "PC Windows";
}
