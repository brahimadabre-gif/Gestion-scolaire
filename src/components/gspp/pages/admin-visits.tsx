"use client";

// ── Statistiques du site : compteur de visiteurs ─────────────
// Données de /api/admin/visits (compteur anonyme, voir /api/visits).
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { Spinner, ErrorNote } from "../ui-bits";
import { TUTORIAL_VIDEOS } from "@/lib/videos";
import { formatDate } from "@/lib/site";
import { Clapperboard, Eye, FileText, Globe2, MonitorSmartphone } from "lucide-react";

type Count = { key: string; value: number };
interface VisitStats {
  days: number; visitors: number; previous: number; views: number; today: number; total: number;
  since: string | null;
  series: { day: string; visitors: number; views: number }[];
  pages: Count[]; videos: Count[]; sources: Count[]; devices: Count[];
}

const PERIODS = [
  { days: 1, label: "Aujourd'hui" },
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
];
const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", facebook: "Facebook / Instagram", google: "Recherche (Google…)", youtube: "YouTube", autre: "Autres sites", direct: "Accès direct",
};
const DEVICE_LABELS: Record<string, string> = { mobile: "Téléphone", ordinateur: "Ordinateur", tablette: "Tablette" };
const PAGE_LABELS: Record<string, string> = {
  "/": "Accueil", "/videos": "Vidéos de démo", "/telecharger": "Télécharger", "/tarifs": "Tarifs", "/tutoriel": "Tutoriel illustré",
  "/notice": "Notice", "/documents": "Documents", "/fonctionnalites": "Fonctionnalités", "/faq": "FAQ", "/support": "Contact",
};
const nf = new Intl.NumberFormat("fr-FR");
const dayLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

function Ranking({ title, icon: Icon, rows, label, empty, unit = "visiteurs" }: {
  title: string; icon: typeof Eye; rows: Count[]; label: (k: string) => string; empty: string; unit?: string;
}) {
  const total = rows.reduce((a, r) => a + r.value, 0);
  return (
    <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold"><Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />{title}</h3>
      {rows.length ? (
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate">{label(r.key)}</span>
                <span className="shrink-0 font-bold tabular-nums" title={`${r.value} ${unit}`}>{nf.format(r.value)}<span className="ml-1.5 text-xs font-normal text-muted-foreground">{total ? Math.round((r.value / total) * 100) : 0} %</span></span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-orange-600 dark:bg-orange-500" style={{ width: `${rows[0].value ? (r.value / rows[0].value) * 100 : 0}%` }} /></div>
            </li>
          ))}
        </ul>
      ) : <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}

export function AdminVisits() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useQuery<VisitStats>({
    queryKey: ["admin", "visits", days],
    queryFn: () => api.get<VisitStats>(`/api/admin/visits?days=${days}`),
    refetchInterval: 60_000,
  });

  const trend = data && data.previous > 0 && days > 1 ? Math.round(((data.visitors - data.previous) / data.previous) * 100) : null;
  const videoTitle = (slug: string) => TUTORIAL_VIDEOS.find((v) => v.slug === slug)?.title ?? slug;
  const chart = (data?.series ?? []).map((s, i, a) => ({ ...s, label: dayLabel(s.day), last: i === a.length - 1 }));

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Statistiques du site</h2>
          <p className="text-xs text-muted-foreground">Compteur anonyme : un visiteur est compté une fois par jour, sans cookie. Les pages d&apos;administration ne sont pas comptées.</p>
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Période">
          {PERIODS.map((p) => (
            <button key={p.days} type="button" aria-pressed={days === p.days} onClick={() => setDays(p.days)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${days === p.days ? "border-orange-600 bg-orange-600 text-white" : "bg-card hover:bg-secondary"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorNote message="Impossible de charger le compteur de visites." /> : isLoading || !data ? <Spinner /> : (
        <>
          <section className="grid min-w-0 items-center gap-6 rounded-2xl border bg-card p-5 lg:grid-cols-[260px_1fr]">
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"><Eye className="h-4 w-4" aria-hidden="true" />Visiteurs — {PERIODS.find((p) => p.days === days)?.label.toLowerCase()}</p>
              <p className="mt-1 text-5xl font-extrabold leading-tight tracking-tight tabular-nums">{nf.format(data.visitors)}</p>
              {trend !== null && (
                <p className={`text-sm font-bold ${trend >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>{trend >= 0 ? "▲ +" : "▼ "}{trend} % <span className="font-normal text-muted-foreground">vs période précédente</span></p>
              )}
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <dt>Aujourd&apos;hui</dt><dd className="text-right font-bold text-foreground tabular-nums">{nf.format(data.today)}</dd>
                <dt>Pages vues</dt><dd className="text-right font-bold text-foreground tabular-nums">{nf.format(data.views)}</dd>
                <dt>Total</dt><dd className="text-right font-bold text-foreground tabular-nums">{nf.format(data.total)}</dd>
              </dl>
              {data.since && <p className="mt-1 text-xs text-muted-foreground">depuis le {formatDate(data.since)}</p>}
            </div>
            {days > 1 ? (
              <div className="min-w-0">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="18%">
                      <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                      <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                        content={({ active, payload }) => active && payload?.length ? (
                          <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                            <p className="font-semibold text-popover-foreground">{dayLabel(String(payload[0].payload.day))}</p>
                            <p className="text-muted-foreground">Visiteurs : <b className="text-popover-foreground tabular-nums">{String(payload[0].payload.visitors)}</b></p>
                            <p className="text-muted-foreground">Pages vues : <b className="text-popover-foreground tabular-nums">{String(payload[0].payload.views)}</b></p>
                          </div>
                        ) : null} />
                      <Bar dataKey="visitors" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
                        {chart.map((d) => <Cell key={d.day} className={d.last ? "fill-zinc-800 dark:fill-zinc-200" : "fill-orange-600 dark:fill-orange-500"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Voir le tableau</summary>
                  <table className="mt-2 w-full">
                    <thead><tr className="text-left text-muted-foreground"><th className="py-1">Jour</th><th className="py-1 text-right">Visiteurs</th><th className="py-1 text-right">Pages vues</th></tr></thead>
                    <tbody>{[...data.series].reverse().map((s) => <tr key={s.day}><td className="py-0.5">{dayLabel(s.day)}</td><td className="py-0.5 text-right tabular-nums">{s.visitors}</td><td className="py-0.5 text-right tabular-nums">{s.views}</td></tr>)}</tbody>
                  </table>
                </details>
              </div>
            ) : <p className="text-sm text-muted-foreground">Choisissez 7, 30 ou 90 jours pour voir l&apos;évolution jour par jour.</p>}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Ranking title="Vidéos les plus regardées depuis le site" icon={Clapperboard} rows={data.videos} label={videoTitle} empty="Aucune vidéo lancée sur cette période." />
            <Ranking title="Pages les plus visitées" icon={FileText} rows={data.pages} label={(k) => PAGE_LABELS[k] ?? k} empty="Aucune visite sur cette période." />
            <Ranking title="D'où viennent les visiteurs" icon={Globe2} rows={data.sources} label={(k) => SOURCE_LABELS[k] ?? k} empty="Aucune visite sur cette période." />
            <Ranking title="Appareils des visiteurs" icon={MonitorSmartphone} rows={data.devices} label={(k) => DEVICE_LABELS[k] ?? k} empty="Aucune visite sur cette période." />
          </div>
        </>
      )}
    </div>
  );
}
