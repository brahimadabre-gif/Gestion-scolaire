"use client";

// ── Compteur de visites anonyme ──────────────────────────────
// Envoie une ligne par page vue (et par vidéo lancée) à /api/visits.
// Aucun cookie ni identifiant stocké : le serveur calcule une empreinte
// anonyme du jour. Les pages /admin ne sont pas comptées.
import { useEffect } from "react";
import { useRoute } from "./router";

let lastSent = "";

export function trackVisit(payload: { path: string; video?: string }) {
  try {
    const body = JSON.stringify({ ...payload, referrer: document.referrer || "" });
    void fetch("/api/visits", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* le compteur ne doit jamais gêner la navigation */
  }
}

export function VisitTracker() {
  const { path } = useRoute();
  useEffect(() => {
    if (path.startsWith("/admin") || path === lastSent) return;
    lastSent = path;
    trackVisit({ path });
  }, [path]);
  return null;
}
