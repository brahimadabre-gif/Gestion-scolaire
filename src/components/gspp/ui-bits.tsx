"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Titre de section cohérent sur tout le site ───────────────
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      {eyebrow && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
      )}
    </div>
  );
}

export function Section({
  children,
  className,
  id,
  dotted = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  dotted?: boolean;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-20 lg:py-24", dotted && "gspp-dots", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

// ── Étoiles de témoignage ────────────────────────────────────
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`Note : ${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ── Avatar coloré d'après les initiales ──────────────────────
const AVATAR_COLORS: Record<string, string> = {
  emerald: "bg-emerald-600",
  teal: "bg-teal-600",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-600",
  violet: "bg-violet-600",
};

export function InitialsAvatar({ initials, color, size = "md" }: { initials: string; color: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        AVATAR_COLORS[color] ?? "bg-emerald-600",
        size === "sm" && "h-9 w-9 text-xs",
        size === "md" && "h-12 w-12 text-sm",
        size === "lg" && "h-14 w-14 text-base"
      )}
    >
      {initials}
    </span>
  );
}

// ── Chargement (squelettes élégants) ─────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)} role="status" aria-label="Chargement">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}

// ── Badge de statut d'abonnement ─────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: "Actif", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" },
    AWAITING_PAYMENT: { label: "En attente de paiement", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" },
    PENDING: { label: "En préparation", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    EXPIRED: { label: "Expiré", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300" },
    CANCELLED: { label: "Annulé", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
    COMPLETED: { label: "Payé", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" },
    FAILED: { label: "Échoué", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300" },
    OPEN: { label: "Ouvert", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
    IN_PROGRESS: { label: "En cours", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" },
    RESOLVED: { label: "Résolu", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" },
    CLOSED: { label: "Fermé", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  };
  const item = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", item.cls)}>
      {item.label}
    </span>
  );
}

// ── Bannière d'erreur discrète ───────────────────────────────
export function ErrorNote({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
      {message}
    </p>
  );
}
