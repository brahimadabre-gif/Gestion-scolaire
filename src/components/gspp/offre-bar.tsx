"use client";

// ── Barre de l'offre d'inscription (maquette C) ──────────────
// Collée en bas de l'écran jusqu'à la fin de l'offre : texte qui défile en
// continu, minuteur jours/heures/minutes/secondes et bouton d'inscription.
// La croix la masque seulement pour la visite en cours (sessionStorage).
import { useEffect, useState } from "react";
import { Link, useRoute } from "./router";
import { useAuth } from "./auth-context";
import { OFFRE_FIN, OFFRE_FIN_TEXTE, OFFRE_MOIS } from "@/lib/offre-inscription";
import { Gift, X } from "lucide-react";

const KEY = "gspp-offre-3-mois-masquee";

function deux(n: number) {
  return String(n).padStart(2, "0");
}

export function OffreBar() {
  const { path } = useRoute();
  const { user } = useAuth();
  // null tant que la page n'est pas montée : évite un écart serveur / navigateur
  const [reste, setReste] = useState<number | null>(null);
  const [fermee, setFermee] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem(KEY) === "1") setFermee(true); } catch { /* stockage indisponible */ }
    const maj = () => setReste(Math.max(0, OFFRE_FIN.getTime() - Date.now()));
    maj();
    const id = window.setInterval(maj, 1000);
    return () => window.clearInterval(id);
  }, []);

  const visible = reste !== null && reste > 0 && !fermee && !path.startsWith("/admin");

  // Réserve la place de la barre en bas de page pour ne rien cacher du pied de page
  useEffect(() => {
    document.body.classList.toggle("avec-offre-bar", visible);
    return () => document.body.classList.remove("avec-offre-bar");
  }, [visible]);

  if (!visible || reste === null) return null;

  const j = Math.floor(reste / 86_400_000);
  const h = Math.floor(reste / 3_600_000) % 24;
  const m = Math.floor(reste / 60_000) % 60;
  const s = Math.floor(reste / 1000) % 60;

  const message = `${OFFRE_MOIS} mois offerts à chaque nouvelle inscription · Une clé d'activation fournie automatiquement dans votre espace (Windows ou Android, au choix) · Inscription gratuite · Offre valable jusqu'au ${OFFRE_FIN_TEXTE}`;

  const fermer = () => {
    setFermee(true);
    try { sessionStorage.setItem(KEY, "1"); } catch { /* stockage indisponible */ }
  };

  return (
    <div
      role="region"
      aria-label="Offre d'inscription"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-800/30 bg-orange-600 text-white shadow-[0_-6px_20px_rgba(0,0,0,0.18)]"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1.5 py-2 pl-3 pr-9 sm:flex-nowrap sm:gap-3 sm:pl-4 sm:pr-11">
        <Gift className="hidden h-5 w-5 shrink-0 sm:block" aria-hidden="true" />
        <div className="offre-defile min-w-0 basis-full text-[13px] sm:basis-0 sm:flex-1 font-semibold sm:text-sm">
          <span>{message}</span>
        </div>
        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-orange-50 sm:text-sm" aria-hidden="true">Fin de la promo dans</span>
        <span
          className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold tabular-nums text-orange-800 sm:text-sm"
          aria-label={`Fin de la promo dans ${j} jours ${h} heures ${m} minutes`}
        >
          {j} j {deux(h)}:{deux(m)}:{deux(s)}
        </span>
        <Link
          to={user ? "/compte" : "/inscription"}
          className="shrink-0 whitespace-nowrap rounded-full bg-orange-900 px-3 py-1.5 text-xs font-bold hover:bg-orange-950 sm:px-4 sm:text-sm"
        >
          {user ? "Ma clé" : "S'inscrire"}
        </Link>
      </div>
      <button
        type="button"
        onClick={fermer}
        aria-label="Masquer l'offre"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-white/15 sm:right-2"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
