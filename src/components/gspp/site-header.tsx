"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";
import { Link, navigate, useRoute } from "./router";
import { useAuth } from "./auth-context";
import { MAIN_NAV, SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Moon, Sun, SunDim, LogOut, LayoutDashboard, ShieldCheck, GraduationCap,
  LifeBuoy, Download, User as UserIcon,
} from "lucide-react";

// ── Logo ─────────────────────────────────────────────────────
// Toque pleine dont le plateau porte les trois traits du menu, gravés à jour
// (on voit l'orange de la tuile à travers, sans pastille ni trait blanc).
function ToqueMenu() {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="#fff" />
          <g stroke="#000" strokeWidth="1.15" strokeLinecap="round">
            <path d="M8.6 6h6.8M8.6 8h6.8M8.6 10h6.8" />
          </g>
        </mask>
      </defs>
      <g fill="#fff" mask={`url(#${id})`}>
        <path d="M12 2.5 23 8l-11 5.5L1 8z" />
        <path d="M5.6 11.3v3.9c0 1.7 2.9 3.2 6.4 3.2s6.4-1.5 6.4-3.2v-3.9L12 14.5z" />
      </g>
      <path d="M21.4 8.8v5.4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="21.4" cy="15" r="1.1" fill="#fff" />
    </svg>
  );
}

function LogoIcone({ menu = false }: { menu?: boolean }) {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 shadow-sm">
      {menu ? <ToqueMenu /> : <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />}
    </span>
  );
}

function LogoTexte() {
  return (
    <span className="flex flex-col leading-none">
      <span className="text-[15px] font-bold tracking-tight">
        Gestion Scolaire <span className="gspp-gradient-text">Pro Plus</span>
      </span>
      <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
        SIMPLIFIEZ VOTRE TRAVAIL
      </span>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0" ariaLabel="Accueil — Gestion Scolaire Pro Plus">
      <LogoIcone />
      {!compact && <LogoTexte />}
    </Link>
  );
}

// ── Bascule thème clair / sombre / confort ───────────────────
// Même cycle que le logiciel : clair -> sombre -> confort -> clair.
// L'icône montre le mode suivant ; le bouton devient ambré en mode confort.
const CYCLE_THEMES = ["light", "dark", "confort"] as const;

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const suivant = () => {
    const actuel = theme === "system" || !theme ? resolvedTheme ?? "light" : theme;
    const i = CYCLE_THEMES.indexOf(actuel as (typeof CYCLE_THEMES)[number]);
    setTheme(CYCLE_THEMES[(i === -1 ? 0 : i + 1) % CYCLE_THEMES.length]);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Changer de thème : clair, sombre ou confort"
      title="Mode clair / sombre / confort"
      onClick={suivant}
      className="rounded-full confort:bg-amber-500 confort:text-white confort:hover:bg-amber-600 confort:hover:text-white"
    >
      {/* Affichage par variantes CSS : aucun rendu conditionnel à l'hydratation */}
      <Moon className="block h-4.5 w-4.5 dark:hidden confort:hidden" aria-hidden="true" />
      <SunDim className="hidden h-4.5 w-4.5 dark:block" aria-hidden="true" />
      <Sun className="hidden h-4.5 w-4.5 confort:block" aria-hidden="true" />
    </Button>
  );
}

// ── En-tête ──────────────────────────────────────────────────
export function SiteHeader() {
  const route = useRoute();
  const { user, isLoading, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (r: string) => route.path === r;

  const userInitials = user ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() : "";

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all ${
        scrolled
          ? "border-border/80 bg-background/85 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl"
          : "border-transparent bg-background/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* L'icône du logo ouvre la barre latérale (à gauche) ; le nom ramène à l'accueil */}
        <Sheet open={open} onOpenChange={setOpen}>
          <div className="flex min-w-0 shrink-0 items-center gap-2.5">
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Ouvrir le menu"
                title="Menu"
                className="group relative shrink-0 rounded-xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <LogoIcone menu />
              </button>
            </SheetTrigger>
            <Link to="/" className="min-w-0" ariaLabel="Accueil — Gestion Scolaire Pro Plus">
              <LogoTexte />
            </Link>
          </div>
          <SheetContent side="left" className="w-80 overflow-y-auto gspp-scrollbar">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            {/* Un clic sur un lien ferme la barre */}
            <div className="mt-2 flex flex-col gap-1" onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}>
              <Logo />
              <div className="mt-4 h-px bg-border" />
              {MAIN_NAV.map((item) => (
                <Link
                  key={item.route}
                  to={item.route}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(item.route) ? "bg-secondary text-primary" : "text-foreground/80 hover:bg-secondary/60"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 h-px bg-border" />
              {user ? (
                <>
                  <Link to="/compte" className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary/60">
                    Mon compte
                  </Link>
                  <Link to="/compte/abonnement" className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary/60">
                    Mon abonnement
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary/60">
                      Administration
                    </Link>
                  )}
                  <button
                    onClick={() => { setOpen(false); logout(); }}
                    className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  <Button variant="outline" className="w-full" onClick={() => { setOpen(false); navigate("/connexion"); }}>
                    Se connecter
                  </Button>
                  <Button className="w-full" onClick={() => { setOpen(false); navigate("/inscription"); }}>
                    Créer un compte
                  </Button>
                </div>
              )}
              <div className="mt-4 rounded-2xl bg-secondary/60 p-4 text-xs leading-relaxed text-muted-foreground">
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                  <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" /> Besoin d&apos;aide ?
                </p>
                {SITE.email}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Navigation bureau */}
        <nav className="hidden 2xl:flex items-center gap-1" aria-label="Navigation principale">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.route}
              to={item.route}
              className={`rounded-full px-3 py-2 text-[13.5px] font-medium transition-colors ${
                isActive(item.route)
                  ? "bg-secondary text-primary"
                  : item.route === "/videos"
                    ? "font-bold text-orange-700 hover:bg-secondary/70 dark:text-orange-400"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />

          {!isLoading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border border-border/70 bg-card py-1 pl-1 pr-2.5 shadow-sm transition hover:border-ring/50 hover:shadow"
                  aria-label="Menu du compte"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-[13px] font-semibold max-w-[110px] truncate">
                    {user.firstName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-[13px] font-semibold truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs font-normal text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/compte")} className="cursor-pointer">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Mon compte
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/compte/abonnement")} className="cursor-pointer">
                  <UserIcon className="h-4 w-4" aria-hidden="true" /> Mon abonnement
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/telecharger")} className="cursor-pointer">
                  <Download className="h-4 w-4" aria-hidden="true" /> Télécharger le logiciel
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Administration
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !isLoading && (
              <div className="hidden sm:flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => navigate("/connexion")}>
                  Se connecter
                </Button>
                <Button size="sm" className="rounded-full shadow-sm" onClick={() => navigate("/inscription")}>
                  Créer un compte
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
