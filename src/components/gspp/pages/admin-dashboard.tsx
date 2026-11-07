"use client";

// ── Tableau de bord d'administration ─────────────────────────
// Clients, licences (actives / expirées / révoquées / disponibles),
// répartition PC ↔ Android, activations récentes et échéances.
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { Spinner, ErrorNote } from "../ui-bits";
import { formatDate, formatFcfa } from "@/lib/site";
import { PlatformBadge } from "./admin-licenses";
import {
  Activity, AlarmClock, ArrowUpCircle, Ban, CheckCircle2, Clock3, KeyRound, LifeBuoy, Monitor,
  Receipt, ShieldAlert, Smartphone, TrendingUp, UserCheck, Users,
} from "lucide-react";

type Platform = "PC" | "ANDROID";
type LicenseStatus = "AVAILABLE" | "ACTIVE" | "EXPIRED" | "REVOKED";
interface LicenseSummary {
  id: string; key: string; platform: Platform | null; status: LicenseStatus;
  activatedAt: string | null; endDate: string | null; plan: string | null;
  client: { name: string; email: string; establishment: string | null } | null;
}
export interface AdminStats {
  users: { total: number; active: number; new30: number };
  subscriptions: { total: number; active: number };
  payments: { completed: number; pending: number };
  tickets: { open: number };
  articles: { total: number };
  revenue: { total: number; thisMonth: number };
  version: { version: string; releaseDate: string; downloads: number } | null;
  licenses: {
    total: number;
    byStatus: Record<LicenseStatus, number>;
    byPlatform: Record<Platform | "UNKNOWN", Record<LicenseStatus, number>>;
    activations30: number;
    refusedPlatform30: number;
    activationsByMonth: { key: string; PC: number; ANDROID: number; UNKNOWN: number }[];
    recentActivations: LicenseSummary[];
    expiringSoon: LicenseSummary[];
  };
  clients: { active: number; PC: number; ANDROID: number; UNKNOWN: number; both: number };
  recentLogs: { id: string; action: string; details: string | null; createdAt: string; user?: { firstName: string; lastName: string } | null }[];
  recentUsers: { id: string; firstName: string; lastName: string; email: string; createdAt: string }[];
}

// Couleurs validées (contrôle daltonisme) : PC = indigo, Android = émeraude.
const chartVars = "[--c-pc:#4f46e5] dark:[--c-pc:#6366f1] [--c-android:#059669] [--c-unknown:#a1a1aa] dark:[--c-unknown:#71717a]";
const SERIES = [
  { key: "PC" as const, label: "PC Windows", color: "var(--c-pc)" },
  { key: "ANDROID" as const, label: "Android", color: "var(--c-android)" },
  { key: "UNKNOWN" as const, label: "À rattacher", color: "var(--c-unknown)" },
];
const STATUS_ROWS: { key: LicenseStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { key: "ACTIVE", label: "Actives", icon: CheckCircle2 },
  { key: "EXPIRED", label: "Expirées", icon: Clock3 },
  { key: "REVOKED", label: "Révoquées", icon: Ban },
  { key: "AVAILABLE", label: "Disponibles", icon: KeyRound },
];
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" });
};
const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
const goTab = (id: string) => document.getElementById(`tab-${id}`)?.click();

function Tile({ icon: Icon, label, value, sub, tab, tone = "default" }: {
  icon: typeof Users; label: string; value: string | number; sub?: React.ReactNode; tab?: string; tone?: "default" | "warn" | "danger";
}) {
  const toneCls = tone === "danger" ? "bg-destructive/10 text-destructive" : tone === "warn" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-orange-600/10 text-orange-700 dark:text-orange-400";
  const Comp = tab ? "button" : "div";
  return (
    <Comp onClick={tab ? () => goTab(tab) : undefined} className={`min-w-0 rounded-2xl border bg-card p-4 text-left ${tab ? "card-hover" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneCls}`}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
        <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-[28px] font-extrabold leading-none tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </Comp>
  );
}

function Card({ title, icon: Icon, children, action }: { title: string; icon: typeof Users; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold"><Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />{title}</h3>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PlatformSplit({ stats }: { stats: AdminStats }) {
  const { clients } = stats;
  const total = clients.PC + clients.ANDROID + clients.UNKNOWN;
  const parts = SERIES.map((s) => ({ ...s, value: clients[s.key] })).filter((s) => s.value > 0 || s.key !== "UNKNOWN");
  return (
    <Card title="Clients par plateforme" icon={Users} action={<span className="text-xs text-muted-foreground">licences en cours</span>}>
      <div className="grid grid-cols-2 gap-3">
        {[{ key: "PC" as const, icon: Monitor, label: "PC Windows" }, { key: "ANDROID" as const, icon: Smartphone, label: "Android" }].map((p) => (
          <div key={p.key} className="rounded-xl border p-4">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.key === "PC" ? "var(--c-pc)" : "var(--c-android)" }} aria-hidden="true" />
              <p.icon className="h-3.5 w-3.5" aria-hidden="true" />{p.label}
            </p>
            <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight">{clients[p.key]}</p>
            <p className="text-xs text-muted-foreground">{pct(clients[p.key], total)} % des clients · {stats.licenses.byPlatform[p.key].ACTIVE} licence(s) active(s)</p>
          </div>
        ))}
      </div>
      {/* Barre 100 % : segments séparés par un espace de 2 px */}
      <div className="mt-4 flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-muted" role="img" aria-label={`Répartition : ${parts.map((p) => `${p.label} ${p.value}`).join(", ")}`}>
        {total > 0 && parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.key} title={`${p.label} : ${p.value} client(s) (${pct(p.value, total)} %)`} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {parts.map((p) => <li key={p.key} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} aria-hidden="true" />{p.label} · {p.value}</li>)}
        {clients.both > 0 && <li>{clients.both} client(s) sur les deux plateformes</li>}
      </ul>
      {clients.UNKNOWN > 0 && <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{clients.UNKNOWN} ancienne(s) clé(s) GSPP- seront rattachées automatiquement au prochain contrôle de l’application.</p>}
    </Card>
  );
}

function StatusByPlatform({ stats }: { stats: AdminStats }) {
  const { byPlatform, byStatus } = stats.licenses;
  const showUnknown = STATUS_ROWS.some((r) => byPlatform.UNKNOWN[r.key] > 0);
  return (
    <Card title="Licences par statut" icon={KeyRound} action={<button className="text-xs font-semibold text-orange-700 hover:underline dark:text-orange-400" onClick={() => goTab("licenses")}>Gérer les licences</button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">Statut</th>
            <th className="px-2 py-2 text-right font-semibold">PC</th>
            <th className="px-2 py-2 text-right font-semibold">Android</th>
            {showUnknown && <th className="px-2 py-2 text-right font-semibold">À rattacher</th>}
            <th className="py-2 pl-2 text-right font-semibold">Total</th>
          </tr></thead>
          <tbody className="divide-y">
            {STATUS_ROWS.map((r) => (
              <tr key={r.key}>
                <td className="py-2.5 pr-3"><span className="flex items-center gap-2 font-medium"><r.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{r.label}</span></td>
                <td className="px-2 py-2.5 text-right tabular-nums">{byPlatform.PC[r.key]}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">{byPlatform.ANDROID[r.key]}</td>
                {showUnknown && <td className="px-2 py-2.5 text-right tabular-nums">{byPlatform.UNKNOWN[r.key]}</td>}
                <td className="py-2.5 pl-2 text-right font-bold tabular-nums">{byStatus[r.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ActivationsChart({ stats }: { stats: AdminStats }) {
  const data = stats.licenses.activationsByMonth.map((m) => ({ ...m, label: monthLabel(m.key) }));
  const showUnknown = data.some((d) => d.UNKNOWN > 0);
  const series = SERIES.filter((s) => s.key !== "UNKNOWN" || showUnknown);
  return (
    <Card title="Activations sur 6 mois" icon={TrendingUp} action={<span className="text-xs text-muted-foreground">{stats.licenses.activations30} sur 30 jours</span>}>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {series.map((s) => <li key={s.key} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />{s.label}</li>)}
      </ul>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="currentColor" className="text-border" strokeOpacity={1} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={({ active, payload, label }) => active && payload?.length ? (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="mb-1 font-semibold text-popover-foreground">{label}</p>
                  {payload.map((p) => <p key={String(p.dataKey)} className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-sm" style={{ background: String(p.color) }} aria-hidden="true" />{SERIES.find((s) => s.key === p.dataKey)?.label} : <span className="font-semibold text-popover-foreground tabular-nums">{String(p.value)}</span></p>)}
                </div>
              ) : null}
            />
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} stroke="var(--card)" strokeWidth={2} maxBarSize={36} isAnimationActive={false}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-muted-foreground">Voir le tableau</summary>
        <table className="mt-2 w-full">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1">Mois</th>{series.map((s) => <th key={s.key} className="py-1 text-right">{s.label}</th>)}</tr></thead>
          <tbody>{data.map((d) => <tr key={d.key}><td className="py-1">{d.label}</td>{series.map((s) => <td key={s.key} className="py-1 text-right tabular-nums">{d[s.key]}</td>)}</tr>)}</tbody>
        </table>
      </details>
    </Card>
  );
}

function LicenseList({ items, empty, dateOf }: { items: LicenseSummary[]; empty: string; dateOf: (l: LicenseSummary) => string }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y">
      {items.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold">{l.client?.name ?? "Code direct"}{l.client?.establishment && <span className="font-normal text-muted-foreground"> · {l.client.establishment}</span>}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">{l.key}{l.plan && <span className="font-sans"> · {l.plan}</span>}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <PlatformBadge platform={l.platform} />
            <span className="text-[11px] text-muted-foreground">{dateOf(l)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<AdminStats>("/api/admin/stats"),
    refetchInterval: 30_000,
  });

  if (error) return <ErrorNote message="Impossible de charger les statistiques." />;
  if (isLoading || !stats) return <Spinner />;
  const { licenses } = stats;

  return (
    <div className={`min-w-0 space-y-5 ${chartVars}`}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={Users} label="Clients actifs" value={stats.clients.active} tab="users"
          sub={<><Monitor className="mr-0.5 inline h-3 w-3 align-[-2px]" aria-hidden="true" />{stats.clients.PC} PC · <Smartphone className="mr-0.5 inline h-3 w-3 align-[-2px]" aria-hidden="true" />{stats.clients.ANDROID} Android</>} />
        <Tile icon={CheckCircle2} label="Licences actives" value={licenses.byStatus.ACTIVE} tab="licenses" sub={`${licenses.total} clé(s) émise(s) au total`} />
        <Tile icon={Clock3} label="Expirées" value={licenses.byStatus.EXPIRED} tab="licenses" tone={licenses.byStatus.EXPIRED ? "warn" : "default"} sub={`${licenses.expiringSoon.length} expirent sous 30 jours`} />
        <Tile icon={Ban} label="Révoquées" value={licenses.byStatus.REVOKED} tab="licenses" tone={licenses.byStatus.REVOKED ? "danger" : "default"} sub={`${licenses.byStatus.AVAILABLE} code(s) disponible(s)`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-2"><PlatformSplit stats={stats} /></div>
        <div className="min-w-0 lg:col-span-3"><ActivationsChart stats={stats} /></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <StatusByPlatform stats={stats} />
        <Card title="Activations récentes" icon={Activity}>
          <LicenseList items={licenses.recentActivations} empty="Aucune activation pour l’instant." dateOf={(l) => l.activatedAt ? formatDate(l.activatedAt) : "—"} />
        </Card>
        <Card title="Expirent bientôt" icon={AlarmClock} action={<span className="text-xs text-muted-foreground">30 jours</span>}>
          <LicenseList items={licenses.expiringSoon} empty="Aucune licence n’expire dans les 30 jours." dateOf={(l) => l.endDate ? `fin ${formatDate(l.endDate)}` : "—"} />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile icon={TrendingUp} label="Revenus totaux" value={formatFcfa(stats.revenue.total)} tab="payments" sub={`${formatFcfa(stats.revenue.thisMonth)} ce mois`} />
        <Tile icon={ArrowUpCircle} label="Abonnements actifs" value={stats.subscriptions.active} tab="subscriptions" sub={`${stats.subscriptions.total} au total`} />
        <Tile icon={Receipt} label="Paiements" value={stats.payments.completed} tab="payments" tone={stats.payments.pending ? "warn" : "default"} sub={`${stats.payments.pending} en attente`} />
        <Tile icon={LifeBuoy} label="Tickets ouverts" value={stats.tickets.open} tab="tickets" tone={stats.tickets.open ? "warn" : "default"} sub="à traiter" />
        <Tile icon={ShieldAlert} label="Refus de plateforme" value={licenses.refusedPlatform30} tone={licenses.refusedPlatform30 ? "danger" : "default"} sub="clé utilisée sur la mauvaise plateforme · 30 j" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Journal d’activité (sécurité & audit)" icon={Activity}>
          <ul className="max-h-80 space-y-2.5 overflow-y-auto gspp-scrollbar pr-2">
            {stats.recentLogs.map((l) => (
              <li key={l.id} className="flex items-start gap-3 text-sm">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${l.action === "LICENSE_PLATFORM_REFUSED" ? "bg-destructive" : "bg-orange-500"}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate"><span className="font-mono text-xs font-bold text-primary">{l.action}</span> {l.details}{l.user && <span className="text-muted-foreground"> — {l.user.firstName} {l.user.lastName}</span>}</p>
                  <p className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString("fr-FR")}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Derniers inscrits" icon={UserCheck} action={<span className="text-xs text-muted-foreground">{stats.users.new30} sur 30 jours · {stats.users.total} au total</span>}>
          <ul className="space-y-3">
            {stats.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0"><p className="truncate font-semibold">{u.firstName} {u.lastName}</p><p className="truncate text-xs text-muted-foreground">{u.email}</p></div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
