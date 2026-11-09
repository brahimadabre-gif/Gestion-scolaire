"use client";

// ── Bandeau d'annonce des tutoriels vidéo ────────────────────
// Visible en haut de toutes les pages publiques ; masqué sur /videos et
// dans l'espace admin. La croix le cache pour ce navigateur seulement.
import { useState, useSyncExternalStore } from "react";
import { Link, useRoute } from "./router";
import { PUBLISHED_VIDEOS } from "@/lib/videos";
import { Clapperboard, X } from "lucide-react";

const KEY = "gspp-annonce-videos-masquee";

const noSubscribe = () => () => {};
function readClosed() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function AnnouncementBar() {
  const { path } = useRoute();
  const [closedNow, setClosedNow] = useState(false);
  const closedBefore = useSyncExternalStore(noSubscribe, readClosed, () => false);
  const hidden = closedNow || closedBefore;

  if (hidden || path === "/videos" || path.startsWith("/admin")) return null;

  const close = () => {
    setClosedNow(true);
    try { localStorage.setItem(KEY, "1"); } catch { /* stockage indisponible */ }
  };

  return (
    <div className="relative bg-gradient-to-r from-orange-700 to-orange-600 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-0.5 py-2 pl-4 pr-10 text-center text-[13px] font-semibold sm:text-sm">
        <Clapperboard className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="md:hidden">{PUBLISHED_VIDEOS.length} tutoriels vidéo gratuits</span>
        <span className="hidden md:inline">Nouveau : {PUBLISHED_VIDEOS.length} tutoriels vidéo gratuits pour prendre le logiciel en main</span>
        <Link to="/videos" className="whitespace-nowrap font-extrabold underline underline-offset-2 hover:no-underline">Regarder les vidéos →</Link>
      </div>
      <button type="button" onClick={close} aria-label="Masquer l'annonce" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-white/15">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
