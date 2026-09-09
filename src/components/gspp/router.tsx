"use client";

// ── Routeur SPA par hash (architecture du sandbox : page unique) ──
// Routes : #/fonctionnalites, #/tarifs, #/notice?section=xxx ...
// Implémentation : useSyncExternalStore (store externe = window.location.hash)
import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

export interface RouteInfo {
  path: string;
  query: Record<string, string>;
}

// Cache : getSnapshot doit renvoyer une référence stable entre deux appels
let cachedHash = "";
let cachedRoute: RouteInfo = { path: "/", query: {} };

function parseHash(): RouteInfo {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  if (hash !== cachedHash) {
    cachedHash = hash;
    const [path, queryString] = hash.split("?");
    const query: Record<string, string> = {};
    if (queryString) {
      for (const [k, v] of new URLSearchParams(queryString).entries()) query[k] = v;
    }
    cachedRoute = { path: path || "/", query };
  }
  return cachedRoute;
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const EMPTY_ROUTE: RouteInfo = { path: "/", query: {} };
function getServerRoute(): RouteInfo {
  return EMPTY_ROUTE;
}

const RouterContext = createContext<RouteInfo>(EMPTY_ROUTE);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const route = useSyncExternalStore(subscribeHash, parseHash, getServerRoute);

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
  const target = to.startsWith("#") ? to : `#${to}`;
  if (window.location.hash === target) {
    // Même route : forcer le rafraîchissement de l'état
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = target;
  if (!opts?.keepScroll) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

// Lien interne du site (navigation hash)
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
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      navigate(to);
    },
    [to]
  );
  return (
    <a href={`#${to}`} onClick={handleClick} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
