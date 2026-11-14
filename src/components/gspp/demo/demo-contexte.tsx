"use client";

// ── Démo interactive : état partagé, petits composants d'interface ──
import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { EtatDemo } from "./demo-donnees";

export interface CtxDemo {
  s: EtatDemo;
  /** Modifie l'état (copie profonde fournie) ; `texte` s'ajoute à l'historique. */
  maj: (fn: (s: EtatDemo) => void, texte?: string) => void;
  /** Signale une action à la visite guidée. */
  signal: (evt: string) => void;
  toast: (msg: string) => void;
  apercu: (titre: string, contenu: ReactNode) => void;
  aller: (page: string) => void;
  /** Classes de mise en évidence si l'élément est la cible de l'étape en cours. */
  g: (id: string) => string;
  telephone: boolean;
}

export const Ctx = createContext<CtxDemo | null>(null);
export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo hors de la démo");
  return c;
}

export const CIBLE = "relative z-10 ring-[3px] ring-orange-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 animate-pulse";

// ── Briques visuelles (style du logiciel GSPP) ──────────────
export function TitrePage({ icone, children, droite }: { icone: string; children: ReactNode; droite?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <h3 className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-3 py-1.5 text-[14px] font-extrabold text-slate-900 dark:border-blue-400 dark:bg-slate-900 dark:text-white">
        <span aria-hidden="true">{icone}</span>
        {children}
      </h3>
      {droite && <div className="ml-auto flex flex-wrap items-center gap-1.5">{droite}</div>}
    </div>
  );
}

export function Carte({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border-2 border-blue-500/70 bg-white p-3 dark:border-blue-400/60 dark:bg-slate-900", className)}>
      {children}
    </div>
  );
}

export function Kpi({ icone, valeur, libelle, teinte = "bg-blue-50 dark:bg-blue-950" }: { icone: string; valeur: ReactNode; libelle: string; teinte?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border-2 border-blue-500/70 bg-white p-2 dark:border-blue-400/60 dark:bg-slate-900">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px]", teinte)} aria-hidden="true">{icone}</span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-extrabold leading-tight text-slate-900 dark:text-white">{valeur}</span>
        <span className="block truncate text-[10.5px] text-slate-500 dark:text-slate-400">{libelle}</span>
      </span>
    </div>
  );
}

export function Bouton({ children, onClick, variante = "plein", className, id, disabled }: {
  children: ReactNode; onClick?: () => void; variante?: "plein" | "contour" | "vert" | "rouge"; className?: string; id?: string; disabled?: boolean;
}) {
  const { g } = useDemo();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold transition active:scale-[0.97] disabled:opacity-50",
        variante === "plein" && "bg-blue-600 text-white hover:bg-blue-700",
        variante === "vert" && "bg-emerald-600 text-white hover:bg-emerald-700",
        variante === "rouge" && "bg-red-600 text-white hover:bg-red-700",
        variante === "contour" && "border border-blue-600 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-400 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800",
        id && g(id),
        className
      )}
    >
      {children}
    </button>
  );
}

export function Selecteur({ value, onChange, children, className, label, id }: {
  value: string; onChange: (v: string) => void; children: ReactNode; className?: string; label: string; id?: string;
}) {
  const { g } = useDemo();
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 rounded-lg border-2 border-orange-500 bg-white px-2 text-[12px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-orange-300 dark:bg-slate-900 dark:text-slate-100",
        id && g(id),
        className
      )}
    >
      {children}
    </select>
  );
}

export function Champ({ label, value, onChange, type = "text", placeholder, className }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string;
}) {
  return (
    <label className={cn("block text-[11px] font-semibold text-slate-600 dark:text-slate-300", className)}>
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-[12px] font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
      />
    </label>
  );
}

export function Pastille({ children, ton = "bleu" }: { children: ReactNode; ton?: "bleu" | "vert" | "rouge" | "orange" | "gris" }) {
  const c = {
    bleu: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    vert: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    rouge: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
    gris: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  }[ton];
  return <span className={cn("inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10.5px] font-bold", c)}>{children}</span>;
}

export function Avatar({ texte, genre }: { texte: string; genre: "F" | "M" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9.5px] font-extrabold",
        genre === "F" ? "bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
      )}
      aria-hidden="true"
    >
      {texte}
    </span>
  );
}

/** Tableau compact qui défile horizontalement s'il est trop large (jamais de débordement de l'écran). */
export function Tableau({ entetes, children, className }: { entetes: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700", className)}>
      <table className="w-full min-w-max border-collapse text-[11.5px]">
        <thead>
          <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {entetes.map((h, i) => <th key={i} className="whitespace-nowrap px-2 py-1.5 font-bold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">{children}</tbody>
      </table>
    </div>
  );
}
export const td = "whitespace-nowrap px-2 py-1.5";

/** Feuille A4 pour les aperçus d'impression. */
export function Feuille({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[520px] rounded-sm bg-white p-4 text-[11px] text-slate-900 shadow-lg ring-1 ring-slate-200">{children}</div>;
}

export function EnteteDocument({ titre }: { titre: string }) {
  const { s } = useDemo();
  return (
    <div className="mb-3 border-b-2 border-slate-800 pb-2 text-center">
      <p className="text-[9px] font-bold uppercase leading-tight">République de Côte d'Ivoire<br />Ministère de l'Éducation nationale et de l'Alphabétisation</p>
      <p className="mt-1 text-[12px] font-extrabold uppercase">{s.ecole}</p>
      <p className="mt-1 inline-block rounded border border-slate-800 px-2 py-0.5 text-[11px] font-extrabold uppercase">{titre}</p>
      <p className="mt-0.5 text-[9.5px]">Année scolaire {s.annee}</p>
    </div>
  );
}

export function Signatures() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 text-center text-[9.5px] font-semibold">
      <div>L'enseignant(e)<div className="mt-6 border-t border-dashed border-slate-400" /></div>
      <div>Le directeur<div className="mt-6 border-t border-dashed border-slate-400" /></div>
    </div>
  );
}
