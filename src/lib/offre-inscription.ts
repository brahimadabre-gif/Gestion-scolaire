// ── Offre d'inscription : clés d'activation offertes ─────────
// Du 21/11/2026 au 05/12/2026 (fin de journée, heure d'Abidjan = GMT),
// chaque nouveau compte reçoit automatiquement une clé PC et une clé Android
// valables 3 mois à partir de leur activation dans le logiciel.
// Le bandeau du site (offre-bar.tsx) lit la même date de fin.

export const OFFRE_FIN_ISO = "2026-12-05T23:59:59.000Z";
export const OFFRE_FIN = new Date(OFFRE_FIN_ISO);
export const OFFRE_MOIS = 3;
export const OFFRE_FIN_TEXTE = "5 décembre 2026";

export function offreActive(maintenant: Date = new Date()): boolean {
  return maintenant.getTime() <= OFFRE_FIN.getTime();
}
