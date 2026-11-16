// ── Essai gratuit : 0 FCFA pendant 30 jours, PC Windows + Android ──
// L'essai est intégré au logiciel : il démarre tout seul à l'installation, sans clé.
// Cette formule sert seulement à l'afficher dans les tarifs ; son bouton mène au téléchargement.
// Elle est créée automatiquement en base au premier affichage des tarifs ;
// l'administrateur peut ensuite la désactiver ou la modifier dans « Formules ».
import { db } from "./db";

export const ESSAI_SLUG = "essai-30-jours";

export const ESSAI_PLAN = {
  slug: ESSAI_SLUG,
  name: "Essai gratuit — 30 jours",
  description: "Le logiciel complet gratuitement pendant 30 jours, sur ordinateur Windows et sur Android. L'essai démarre dès l'installation, sans clé ni paiement.",
  monthlyPrice: 0,
  annualPrice: 0,
  platform: "PC",
  durationMonths: 1,
  maxUsers: 1, maxSchools: 1, maxStudents: 1000,
  features: JSON.stringify([
    "Élèves, classes, notes, moyennes et bulletins",
    "Compositions et rapports de résultats",
    "Import intelligent de documents",
    "Caisse, reçus et suivi des paiements",
    "Signatures électroniques",
    "Démarre dès l'installation, sans clé",
    "Aucun paiement, aucun engagement",
  ]),
  highlighted: false,
  active: true,
  sortOrder: -1, // en premier dans la liste
};

export function estEssai(plan: { slug?: string | null } | null | undefined): boolean {
  return plan?.slug === ESSAI_SLUG;
}

/** Crée la formule d'essai si elle n'existe pas encore (sans jamais écraser les réglages de l'admin). */
export async function assurerPlanEssai(): Promise<void> {
  const existe = await db.subscriptionPlan.findUnique({ where: { slug: ESSAI_SLUG }, select: { id: true } });
  if (!existe) {
    await db.subscriptionPlan.upsert({ where: { slug: ESSAI_SLUG }, update: {}, create: ESSAI_PLAN });
  }
}
