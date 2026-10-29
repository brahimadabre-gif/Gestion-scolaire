"use client";

// ── Routeur SPA par adresse réelle ──────────────────────────
// Routes : /fonctionnalites, /tarifs, /notice?section=xxx ...
// Chaque adresse est aussi une page Next.js (src/app/[...slug]) : le serveur
// rend directement la bonne page et Google peut l'indexer.
// Compatibilité : les anciens liens « https://gestionscolaire.pro/#/tarifs »
// sont convertis automatiquement en « /tarifs ».
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

export interface RouteInfo {
  path: string;
  query: Record<string, string>;
}

const NAV_EVENT = "gspp:navigate";

// Cache : getSnapshot doit renvoyer une référence stable entre deux appels
let cachedKey = "";
let cachedRoute: RouteInfo = { path: "/", query: {} };

function normalizePath(path: string): string {
  const clean = path.replace(/\/+$/, "");
  return clean === "" ? "/" : clean;
}

function parseLocation(): RouteInfo {
  const key = window.location.pathname + window.location.search;
  if (key !== cachedKey) {
    cachedKey = key;
    const query: Record<string, string> = {};
    for (const [k, v] of new URLSearchParams(window.location.search).entries()) query[k] = v;
    cachedRoute = { path: normalizePath(decodeURIComponent(window.location.pathname)), query };
  }
  return cachedRoute;
}

function subscribeLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAV_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAV_EVENT, onChange);
  };
}

// Ancien lien « #/chemin?x=y » → adresse réelle « /chemin?x=y »
function legacyHashTarget(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith("#/")) return null;
  return hash.slice(1);
}

const EMPTY_ROUTE: RouteInfo = { path: "/", query: {} };
const RouterContext = createContext<RouteInfo>(EMPTY_ROUTE);

export function RouterProvider({ children, initialPath = "/" }: { children: React.ReactNode; initialPath?: string }) {
  // Rendu serveur (et première hydratation) : la page demandée par l'adresse
  const serverRoute = useMemo<RouteInfo>(() => ({ path: initialPath, query: {} }), [initialPath]);
  const getServerRoute = useCallback(() => serverRoute, [serverRoute]);
  const route = useSyncExternalStore(subscribeLocation, parseLocation, getServerRoute);

  // Anciens liens en « #/… » (partagés sur WhatsApp, favoris, e-mails déjà envoyés)
  useEffect(() => {
    const target = legacyHashTarget();
    if (target) {
      window.history.replaceState(null, "", target);
      window.dispatchEvent(new Event(NAV_EVENT));
    }
  }, []);

  // Remonter en haut à chaque changement de page (sans état React)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [route.path, route.query.section, route.query.article]);

  return <RouterContext.Provider value={route}>{children}</RouterContext.Provider>;
}

export function useRoute(): RouteInfo {
  return useContext(RouterContext);
}

export function navigate(to: string, opts?: { keepScroll?: boolean }) {
  // Accepte aussi l'ancienne écriture « #/chemin »
  const target = to.replace(/^#/, "") || "/";
  const current = window.location.pathname + window.location.search;
  if (current !== target) window.history.pushState(null, "", target);
  // Même route : l'événement force quand même le rafraîchissement de l'état
  window.dispatchEvent(new Event(NAV_EVENT));
  if (!opts?.keepScroll) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

// Lien interne du site : vraie adresse (ouvrable dans un nouvel onglet,
// lisible par Google), navigation instantanée au clic.
export function Link({
  to,
  children,
  className,
  ariaLabel,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const href = to.replace(/^#/, "") || "/";
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Ctrl/Cmd/Maj + clic ou clic du milieu : laisser le navigateur ouvrir un nouvel onglet
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigate(href);
    },
    [href]
  );
  return (
    <a href={href} onClick={handleClick} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
