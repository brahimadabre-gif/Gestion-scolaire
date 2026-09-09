"use client";

import { useEffect, useState } from "react";
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
  Menu, Moon, Sun, LogOut, LayoutDashboard, ShieldCheck, GraduationCap,
  LifeBuoy, Download, User as UserIcon,
} from "lucide-react";

// ── Logo ─────────────────────────────────────────────────────
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0" ariaLabel="Accueil — Gestion Scolaire Pro Plus">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-sm">
        <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight">
            Gestion Scolaire <span className="gspp-gradient-text">Pro Plus</span>
          </span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
            SIMPLIFIEZ VOTRE TRAVAIL
          </span>
        </span>
      )}
    </Link>
  );
}

// ── Bascule thème clair/sombre ───────────────────────────────
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Basculer entre mode clair et mode sombre"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="rounded-full"
    >
      {/* Affichage par variantes CSS : aucun rendu conditionnel à l'hydratation */}
      <Sun className="hidden h-4.5 w-4.5 dark:block" aria-hidden="true" />
      <Moon className="block h-4.5 w-4.5 dark:hidden" aria-hidden="true" />
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
        <Logo />

        {/* Navigation bureau */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.route}
              to={item.route}
              className={`rounded-full px-3 py-2 text-[13.5px] font-medium transition-colors ${
                isActive(item.route)
                  ? "bg-secondary text-primary"
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

          {/* Menu mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-full" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto gspp-scrollbar">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <div className="mt-2 flex flex-col gap-1">
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
        </div>
      </div>
    </header>
  );
}
