"use client";

import { Link } from "./router";
import { useAuth } from "./auth-context";
import { Logo } from "./site-header";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { GraduationCap, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  const { user } = useAuth();

  return (
    <footer className="mt-auto border-t bg-muted/40 safe-bottom">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Marque */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              « {SITE.slogan} » — La solution complète pour les enseignants, directeurs et
              établissements scolaires. Notes, bulletins, classements et administration, sans stress.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Connexion sécurisée HTTPS · Données chiffrées
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label="Navigation du pied de page">
            <h2 className="text-sm font-semibold">Navigation</h2>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_NAV.navigation.map((l) => (
                <li key={l.route}>
                  <Link to={l.route} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Compte */}
          <nav aria-label="Liens du compte">
            <h2 className="text-sm font-semibold">Compte</h2>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_NAV.account.map((l) => {
                // Un utilisateur connecté est renvoyé vers son espace
                const target = user && l.route === "/connexion" ? "/compte" : l.route;
                return (
                  <li key={l.route}>
                    <Link to={target} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link to="/tutoriel-compte" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Tutoriel : créer un compte
                </Link>
              </li>
            </ul>
          </nav>

          {/* Légal + contact */}
          <div>
            <h2 className="text-sm font-semibold">Légal</h2>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_NAV.legal.map((l) => (
                <li key={l.route}>
                  <Link to={l.route} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 text-sm font-semibold">Contact</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {SITE.email}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {SITE.phone}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {SITE.city}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Conçu pour les professionnels de l&apos;éducation, en Côte d&apos;Ivoire et partout en Afrique de l&apos;Ouest.
          </p>
        </div>
      </div>
    </footer>
  );
}
