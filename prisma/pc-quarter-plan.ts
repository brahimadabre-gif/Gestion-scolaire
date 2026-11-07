// Formule PC 3 mois à 5 000 FCFA — partagée par le seed et la migration des plateformes.
export const PC_QUARTER_PLAN = {
  slug: "pc-3-mois",
  name: "Ordinateur Windows — 3 mois",
  description: "Le logiciel complet sur un ordinateur Windows pendant 3 mois : idéal pour un trimestre ou pour essayer.",
  monthlyPrice: 0,
  annualPrice: 5000, // prix de la période entière (durationMonths)
  platform: "PC",
  durationMonths: 3,
  maxUsers: 5, maxSchools: 1, maxStudents: 1000,
  features: JSON.stringify([
    "Élèves, classes, notes, moyennes et bulletins",
    "Compositions et rapports de résultats",
    "Import intelligent de documents",
    "Caisse, reçus et suivi des paiements",
    "Signatures électroniques",
    "Promotion automatique des élèves",
    "Gestion administrative et documents officiels",
    "Synchronisation entre les postes de l'école",
    "Support prioritaire (e-mail + téléphone)",
  ]),
  highlighted: false, active: true, sortOrder: 2,
};
