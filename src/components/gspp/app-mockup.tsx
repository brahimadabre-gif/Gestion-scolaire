"use client";

// ── Maquettes du logiciel (captures d'écran vivantes en CSS pur) ──
// Rapides, nettes à toutes les résolutions, thème clair/sombre natif.
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, FileText, Trophy, Printer,
  Settings, Search, Bell, BarChart3, CalendarDays, ChevronRight,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", active: false },
  { icon: Users, label: "Élèves", active: false },
  { icon: BookOpen, label: "Notes", active: true },
  { icon: FileText, label: "Bulletins", active: false },
  { icon: Trophy, label: "Classement", active: false },
  { icon: Printer, label: "Impressions", active: false },
  { icon: Settings, label: "Paramètres", active: false },
];

function AppWindow({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-emerald-900/10 dark:shadow-black/40">
      {/* Barre de fenêtre */}
      <div className="flex items-center gap-2 border-b bg-muted/70 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
        <span className="ml-3 flex-1 truncate text-[11px] font-medium text-muted-foreground">
          Gestion Scolaire Pro Plus — {title}
        </span>
        <Bell className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex min-h-[340px] text-[10.5px] leading-normal sm:text-[11.5px]">
        {/* Menu latéral */}
        <aside className="hidden w-40 shrink-0 flex-col gap-0.5 border-r bg-muted/40 p-2.5 sm:flex" aria-hidden="true">
          <div className="mb-2 flex items-center gap-1.5 px-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600">
              <GraduationMark />
            </span>
            <span className="text-[10px] font-bold">GSPP</span>
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium",
                item.active ? "bg-emerald-600 text-white" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-3 w-3" />
              {item.label}
            </div>
          ))}
          <div className="mt-auto rounded-lg bg-amber-500/15 px-2 py-1.5 text-[9.5px] font-semibold text-amber-700 dark:text-amber-400">
            Année 2026-2027
          </div>
        </aside>
        {/* Contenu */}
        <div className="flex-1 p-3.5 sm:p-4">{children}</div>
      </div>
    </div>
  );
}

function GraduationMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white" aria-hidden="true">
      <path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zm-7 9.2V16c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z" />
    </svg>
  );
}

// ── Variante : Tableau de bord ───────────────────────────────
function DashboardContent() {
  const stats = [
    { label: "Élèves", value: "486", trend: "+18" },
    { label: "Moyenne CM2", value: "13,8", trend: "+0,6" },
    { label: "Bulletins", value: "98%", trend: "Prêts" },
    { label: "Classes", value: "12", trend: "CP1 à CM2" },
  ];
  const rows = [
    { n: "Konan Aya", cls: "CM2 A", moy: "16,2", rank: "1ere" },
    { n: "Traoré Ibrahima", cls: "CM1 B", moy: "15,1", rank: "2e" },
    { n: "Bamba Fatou", cls: "CE2 A", moy: "8,4", rank: "3e" },
    { n: "Kouassi Jean", cls: "CP2 B", moy: "7,8", rank: "4e" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold">Tableau de bord</p>
          <p className="text-[9.5px] text-muted-foreground">Groupe Scolaire Primaire Anono — 2026-2027</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border bg-background px-2 py-1 text-[9.5px] text-muted-foreground">
          <Search className="h-2.5 w-2.5" /> Rechercher…
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-2.5">
            <p className="text-[9px] font-medium text-muted-foreground">{s.label}</p>
            <p className="mt-0.5 text-base font-bold text-emerald-700 dark:text-emerald-400">{s.value}</p>
            <p className="text-[9px] text-amber-600 dark:text-amber-400">{s.trend}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-background">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="font-semibold">Derniers résultats saisis</p>
          <span className="flex items-center gap-0.5 text-[9.5px] font-medium text-emerald-700 dark:text-emerald-400">
            Tout voir <ChevronRight className="h-2.5 w-2.5" />
          </span>
        </div>
        <div className="divide-y">
          {rows.map((r) => (
            <div key={r.n} className="flex items-center justify-between px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-100 text-[8px] font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  {r.n[0]}
                </span>
                <span className="font-medium">{r.n}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{r.cls}</span>
                <span className="rounded-md bg-emerald-600/10 px-1.5 py-0.5 font-bold text-emerald-700 dark:text-emerald-400">
                  {r.cls.startsWith("CP") || r.cls.startsWith("CE") ? `${r.moy}/10` : `${r.moy}/20`}
                </span>
                <span className="w-6 text-right">{r.rank}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Variante : Saisie des notes ──────────────────────────────
function NotesContent() {
  const students = [
    { n: "KONAN Aya", notes: ["8", "9", "8,5"] },
    { n: "TRAORE Moussa", notes: ["6", "7", "6,5"] },
    { n: "DIABATE Fatoumata", notes: ["9", "9,5", "9"] },
    { n: "KOUASSI Yao", notes: ["5", "6", "5,5"] },
    { n: "BAMBA Salif", notes: ["7", "6", "6,5"] },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="mr-auto font-bold">Notes — Mathématiques · CE2 A · Composition 1</p>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold">Barème /10</span>
        <span className="rounded-md bg-emerald-600/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
          Moy. classe : 7,4
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border bg-background">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-[9px] uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-1.5 font-semibold">Élève</th>
              <th className="px-2 py-1.5 text-center font-semibold">Devoir 1</th>
              <th className="px-2 py-1.5 text-center font-semibold">Devoir 2</th>
              <th className="px-2 py-1.5 text-center font-semibold">Compo.</th>
              <th className="px-3 py-1.5 text-right font-semibold">Moyenne</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((s, i) => {
              const m = s.notes.reduce((a, b) => a + parseFloat(b.replace(",", ".")), 0) / 3;
              return (
                <tr key={s.n}>
                  <td className="px-3 py-1.5 font-medium">{s.n}</td>
                  {s.notes.map((n, j) => (
                    <td key={j} className="px-2 py-1.5 text-center">
                      <span className={cn(
                        "inline-block w-9 rounded-md border px-1 py-0.5 text-center font-semibold",
                        parseFloat(n.replace(",", ".")) >= 5
                          ? "border-emerald-600/30 bg-emerald-600/5 text-emerald-700 dark:text-emerald-400"
                          : "border-rose-400/40 bg-rose-500/5 text-rose-600 dark:text-rose-400",
                        i === 2 && j === 2 && "ring-2 ring-emerald-500"
                      )}>
                        {n}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    {m.toFixed(1).replace(".", ",")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-muted-foreground">
        Saisie rapide : Entrée pour valider, flèches pour naviguer. Les moyennes se calculent automatiquement.
      </p>
    </div>
  );
}

// ── Variante : Bulletin scolaire ─────────────────────────────
function BulletinContent() {
  const lines = [
    { m: "Mathématiques", c: "4", moy: "15,2", ap: "Très bon travail" },
    { m: "Français", c: "4", moy: "13,8", ap: "Résultats solides" },
    { m: "Orthographe", c: "2", moy: "16,5", ap: "Excellent" },
    { m: "Éveil au milieu", c: "2", moy: "14,0", ap: "Bien" },
    { m: "Histoire-Géo", c: "2", moy: "12,5", ap: "Peut mieux faire" },
    { m: "EPS", c: "1", moy: "17,0", ap: "Très impliqué" },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="font-bold">Bulletin — 1re composition</p>
        <span className="rounded-md border bg-background px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
          <Printer className="mr-1 inline h-2.5 w-2.5" /> Imprimer / PDF
        </span>
      </div>
      <div className="rounded-xl border bg-background p-3">
        <div className="mb-2 flex items-center gap-2 border-b pb-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
            <GraduationMark />
          </span>
          <div>
            <p className="text-[10px] font-bold">GROUPE SCOLAIRE LES PALMIERS</p>
            <p className="text-[8.5px] text-muted-foreground">Bulletin de composition — Année 2026-2027</p>
          </div>
        </div>
        <p className="mb-1.5 text-[10px] font-semibold">
          KONAN Aya — CM2 A <span className="ml-1 font-normal text-muted-foreground">(effectif : 38)</span>
        </p>
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-[8.5px] uppercase text-muted-foreground">
              <th className="py-1 font-semibold">Matière</th>
              <th className="py-1 text-center font-semibold">Coef.</th>
              <th className="py-1 text-center font-semibold">Moy.</th>
              <th className="py-1 text-right font-semibold">Appréciation</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lines.map((l) => (
              <tr key={l.m}>
                <td className="py-1 font-medium">{l.m}</td>
                <td className="py-1 text-center text-muted-foreground">{l.c}</td>
                <td className="py-1 text-center font-bold">{l.moy}</td>
                <td className="py-1 text-right text-muted-foreground">{l.ap}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-600/10 px-2.5 py-1.5">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
            Moyenne générale : 14,55/20
          </span>
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Rang : 3e / 42</span>
          <span className="text-[9.5px] font-semibold text-amber-700 dark:text-amber-400">Félicitations</span>
        </div>
      </div>
    </div>
  );
}

// ── Variante : Classement ────────────────────────────────────
function ClassementContent() {
  const podium = [
    { n: "DIABATE Fatoumata", m: "17,1", c: "bg-amber-400" },
    { n: "KONAN Aya", m: "16,2", c: "bg-slate-400" },
    { n: "TOURE Ali", m: "15,9", c: "bg-orange-400" },
  ];
  const rest = [
    { n: "TRAORE Moussa", m: "14,8", r: 4 },
    { n: "KOUASSI Yao", m: "13,5", r: 5 },
    { n: "BAMBA Salif", m: "12,2", r: 6 },
    { n: "OUATTARA Mariam", m: "11,9", r: 7 },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="font-bold">Classement — CM2 A · Composition 1</p>
        <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
          <BarChart3 className="h-2.5 w-2.5" /> Rapport PDF
        </span>
      </div>
      <div className="grid grid-cols-3 items-end gap-1.5 pt-2">
        {podium.map((p, i) => (
          <div key={p.n} className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold">{p.m}</span>
            <span className="max-w-full truncate rounded-t-lg bg-emerald-600 px-1.5 py-1 text-[8.5px] font-semibold text-white">
              {p.n.split(" ")[1]}
            </span>
            <span className={cn("w-full rounded-sm", p.c, i === 0 ? "h-14" : i === 1 ? "h-10" : "h-8")} />
            <span className="text-[8.5px] font-bold text-muted-foreground">{i + 1}{i === 0 ? "er" : "e"}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-background divide-y">
        {rest.map((r) => (
          <div key={r.n} className="flex items-center justify-between px-3 py-1.5">
            <span className="flex items-center gap-2">
              <span className="w-4 text-center font-bold text-muted-foreground">{r.r}</span>
              <span className="font-medium">{r.n}</span>
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{r.m}/20</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export type MockupVariant = "dashboard" | "notes" | "bulletin" | "classement";

const TITLES: Record<MockupVariant, string> = {
  dashboard: "Tableau de bord",
  notes: "Saisie des notes",
  bulletin: "Bulletins scolaires",
  classement: "Classement",
};

export function AppMockup({ variant = "dashboard", className }: { variant?: MockupVariant; className?: string }) {
  return (
    <div className={cn("animate-fade-up", className)} aria-label={`Aperçu du logiciel — ${TITLES[variant]}`}>
      <AppWindow title={TITLES[variant]}>
        {variant === "dashboard" && <DashboardContent />}
        {variant === "notes" && <NotesContent />}
        {variant === "bulletin" && <BulletinContent />}
        {variant === "classement" && <ClassementContent />}
      </AppWindow>
    </div>
  );
}
