"use client";

// ── Administration — gestion complète de la plateforme ──────
// Onglets : Résumé, Utilisateurs, Abonnements, Paiements, Tickets,
// Formules, Versions, Articles, FAQ, Témoignages, Paramètres.
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth-context";
import { Spinner, StatusBadge, ErrorNote } from "../ui-bits";
import { formatDate, formatFcfa, SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, CreditCard, Receipt, LifeBuoy, Package, Download, BookOpen,
  Newspaper, HelpCircle, MessageSquareQuote, Settings, Plus, Pencil, Trash2,
  Loader2, TrendingUp, UserCheck, UserX, ShieldCheck, ArrowUpCircle, Activity,
} from "lucide-react";

// ═════════════════════════════════════════════════════════════
// CRUD générique d'entité (formules, articles, FAQ…)
// ═════════════════════════════════════════════════════════════

type FieldType = "text" | "textarea" | "number" | "boolean" | "select" | "list";
interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  hideInTable?: boolean;
  placeholder?: string;
}

function EntityCrud({ entity, title, fields, description }: {
  entity: string;
  title: string;
  description: string;
  fields: FieldDef[];
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["admin", entity],
    queryFn: () => api.get<Record<string, unknown>[]>(`/api/admin/${entity}`),
  });

  const openCreate = () => {
    const init: Record<string, unknown> = {};
    for (const f of fields) {
      init[f.name] = f.type === "boolean" ? (["published", "active"].includes(f.name) ? true : false)
        : f.type === "number" ? (f.name.includes("Price") || f.name === "fileSizeMb" ? 0 : 1)
        : f.type === "select" ? f.options?.[0] ?? ""
        : "";
    }
    setForm(init);
    setError(null);
    setCreating(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    const init: Record<string, unknown> = { id: item.id };
    for (const f of fields) init[f.name] = item[f.name] ?? "";
    setForm(init);
    setError(null);
    setEditing(item);
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const v = form[f.name];
      if (f.type === "number") payload[f.name] = Number(v) || 0;
      else if (f.type === "boolean") payload[f.name] = Boolean(v);
      else if (f.type === "list") payload[f.name] = String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      else payload[f.name] = v ?? "";
    }
    return payload;
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.patch(`/api/admin/${entity}/${editing.id}`, buildPayload());
        toast.success("Modifications enregistrées.");
      } else {
        await api.post(`/api/admin/${entity}`, buildPayload());
        toast.success("Élément créé.");
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", entity] });
      await queryClient.invalidateQueries({ queryKey: [entity === "plans" ? "plans" : entity === "articles" ? "articles" : entity === "faqs" ? "faqs" : entity === "testimonials" ? "testimonials" : entity === "versions" ? "version" : entity === "library" ? "library" : "docs"] });
      setEditing(null);
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: unknown) => {
    if (!window.confirm("Confirmer la suppression définitive ?")) return;
    try {
      await api.delete(`/api/admin/${entity}/${id}`);
      toast.success("Supprimé.");
      await queryClient.invalidateQueries({ queryKey: ["admin", entity] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible.");
    }
  };

  const tableFields = fields.filter((f) => !f.hideInTable);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button className="rounded-full" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Nouveau
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="mt-5 overflow-x-auto gspp-scrollbar rounded-2xl border">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                {tableFields.map((f) => (
                  <th key={f.name} className="px-4 py-3 font-semibold">{f.label}</th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(items ?? []).map((item) => (
                <tr key={String(item.id)} className="transition hover:bg-secondary/40">
                  {tableFields.map((f) => (
                    <td key={f.name} className="max-w-[280px] px-4 py-3">
                      {f.type === "boolean" ? (
                        item[f.name] ? <span className="text-emerald-600 dark:text-emerald-400">●</span> : <span className="text-muted-foreground/40">○</span>
                      ) : f.type === "list" && Array.isArray(item[f.name]) ? (
                        (item[f.name] as string[]).length + " élément(s)"
                      ) : (
                        <span className="line-clamp-2">{String(item[f.name] ?? "—")}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Modifier" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" aria-label="Supprimer" onClick={() => remove(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogue création / édition */}
      <Dialog open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto gspp-scrollbar">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier" : "Créer"} — {title}</DialogTitle>
            <DialogDescription>Les modifications sont visibles immédiatement sur le site.</DialogDescription>
          </DialogHeader>
          <ErrorNote message={error} />
          <div className="grid gap-4 py-2">
            {fields.map((f) => (
              <div key={f.name} className="space-y-1.5">
                {f.type !== "boolean" && <Label htmlFor={`f-${f.name}`}>{f.label}</Label>}
                {f.type === "textarea" ? (
                  <Textarea id={`f-${f.name}`} rows={4} value={String(form[f.name] ?? "")} placeholder={f.placeholder}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
                ) : f.type === "list" ? (
                  <Textarea id={`f-${f.name}`} rows={5} value={Array.isArray(form[f.name]) ? (form[f.name] as string[]).join("\n") : String(form[f.name] ?? "")}
                    placeholder="Une ligne par élément"
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
                ) : f.type === "boolean" ? (
                  <div className="flex items-center gap-2.5">
                    <Switch id={`f-${f.name}`} checked={Boolean(form[f.name])}
                      onCheckedChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} />
                    <Label htmlFor={`f-${f.name}`} className="font-normal">{f.label}</Label>
                  </div>
                ) : f.type === "select" ? (
                  <Select value={String(form[f.name] ?? "")} onValueChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))}>
                    <SelectTrigger id={`f-${f.name}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`f-${f.name}`}
                    type={f.type === "number" ? "number" : f.name.toLowerCase().includes("date") ? "date" : "text"}
                    value={f.name.toLowerCase().includes("date") && form[f.name]
                      ? String(form[f.name]).slice(0, 10) : String(form[f.name] ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Annuler</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Résumé
// ═════════════════════════════════════════════════════════════
interface AdminStats {
  users: { total: number; active: number };
  subscriptions: { total: number; active: number };
  payments: { completed: number; pending: number };
  tickets: { open: number };
  articles: { total: number };
  revenue: { total: number; thisMonth: number };
  version: { version: string; releaseDate: string; downloads: number } | null;
  recentLogs: { id: string; action: string; details: string | null; createdAt: string; user?: { firstName: string; lastName: string } | null }[];
  recentUsers: { id: string; firstName: string; lastName: string; email: string; createdAt: string }[];
}

function Overview() {
  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<AdminStats>("/api/admin/stats"),
    refetchInterval: 30_000,
  });

  if (error) return <ErrorNote message="Impossible de charger les statistiques." />;
  if (isLoading || !stats) return <Spinner />;

  const cards = [
    { icon: Users, label: "Utilisateurs", value: stats.users.total, sub: `${stats.users.active} actifs`, href: "users" },
    { icon: ArrowUpCircle, label: "Abonnements actifs", value: stats.subscriptions.active, sub: `${stats.subscriptions.total} au total`, href: "subscriptions" },
    { icon: TrendingUp, label: "Revenus totaux", value: formatFcfa(stats.revenue.total), sub: `${formatFcfa(stats.revenue.thisMonth)} ce mois`, href: "payments" },
    { icon: LifeBuoy, label: "Tickets ouverts", value: stats.tickets.open, sub: "à traiter", href: "tickets" },
    { icon: Receipt, label: "Paiements", value: stats.payments.completed, sub: `${stats.payments.pending} en attente`, href: "payments" },
    { icon: Newspaper, label: "Articles publiés", value: stats.articles.total, sub: "actualités", href: "articles" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <button key={c.label} className="card-hover rounded-2xl border bg-card p-5 text-left" onClick={() => document.getElementById(`tab-${c.href}`)?.click()}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {c.label === "Revenus totaux" && stats.version && (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold">
                  v{stats.version.version}
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight">{c.value}</p>
            <p className="text-sm font-semibold">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Journal d&apos;activité (sécurité & audit)
          </h3>
          <ul className="mt-4 max-h-80 space-y-2.5 overflow-y-auto gspp-scrollbar pr-2">
            {stats.recentLogs.map((l) => (
              <li key={l.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate">
                    <span className="font-mono text-xs font-bold text-primary">{l.action}</span>{" "}
                    {l.details}
                    {l.user && <span className="text-muted-foreground"> — {l.user.firstName} {l.user.lastName}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString("fr-FR")}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Derniers inscrits
          </h3>
          <ul className="mt-4 space-y-3">
            {stats.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{u.firstName} {u.lastName}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Utilisateurs
// ═════════════════════════════════════════════════════════════
function AdminUsers() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<{ users: Record<string, unknown>[]; total: number; pages: number }>({
    queryKey: ["admin", "users", q, page],
    queryFn: () => api.get(`/api/admin/users?q=${encodeURIComponent(q)}&page=${page}`),
  });

  const update = async (id: unknown, data: Record<string, unknown>) => {
    try {
      await api.patch(`/api/admin/users/${id}`, data);
      toast.success("Compte mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold">Comptes utilisateurs</h2>
      <p className="text-sm text-muted-foreground">Gérez les rôles et l&apos;accès des comptes de la plateforme.</p>
      <div className="mt-4 max-w-sm">
        <Input placeholder="Rechercher (nom, e-mail, établissement)…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Rechercher un utilisateur" />
      </div>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="mt-5 overflow-x-auto gspp-scrollbar rounded-2xl border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 font-semibold">Établissement</th>
                  <th className="px-4 py-3 font-semibold">Inscrit le</th>
                  <th className="px-4 py-3 font-semibold">Rôle</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data?.users ?? []).map((u) => (
                  <tr key={String(u.id)} className="transition hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{String(u.firstName)} {String(u.lastName)}</p>
                      <p className="text-xs text-muted-foreground">{String(u.email)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{String(u.establishment ?? "—")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(String(u.createdAt))}</td>
                    <td className="px-4 py-3">
                      <Select value={String(u.role)} onValueChange={(v) => update(u.id, { role: v })}>
                        <SelectTrigger className="h-8 w-28 text-xs" aria-label="Rôle du compte">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">Utilisateur</SelectItem>
                          <SelectItem value="SUPPORT">Support</SelectItem>
                          <SelectItem value="ADMIN">Administrateur</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><UserCheck className="h-3.5 w-3.5" aria-hidden="true" /> Actif</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400"><UserX className="h-3.5 w-3.5" aria-hidden="true" /> Désactivé</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full text-xs"
                          onClick={() => update(u.id, { active: !u.active })}
                        >
                          {u.active ? "Désactiver" : "Réactiver"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && data.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
              <span className="text-xs text-muted-foreground">Page {page} / {data.pages} — {data.total} comptes</span>
              <Button variant="outline" size="sm" className="rounded-full" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Abonnements & Paiements (validation manuelle)
// ═════════════════════════════════════════════════════════════
function AdminSubscriptions() {
  const queryClient = useQueryClient();
  const [extensionDays, setExtensionDays] = useState<Record<string, string>>({});
  const [endDates, setEndDates] = useState<Record<string, string>>({});
  const { data: subs, isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["admin", "subscriptions"],
    queryFn: async () => {
      // Liste via l'entité admin + enrichissement des statuts
      const all = await api.get<Record<string, unknown>[]>("/api/admin/subscriptions");
      return all;
    },
  });

  const updateSubscription = async (id: unknown, payload: Record<string, unknown>, message: string) => {
    try {
      await api.patch(`/api/admin/subscriptions/${id}`, payload);
      toast.success(message);
      await queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  };

  const setStatus = (id: unknown, status: string) => {
    const label = status === "CANCELLED" ? "mettre fin à cet abonnement" : status === "EXPIRED" ? "faire expirer cet abonnement" : "réactiver cet abonnement";
    if (!window.confirm(`Confirmer la décision : ${label} ?`)) return;
    return updateSubscription(id, { status }, status === "ACTIVE" ? "Abonnement réactivé — licence générée si nécessaire." : "Décision appliquée à l’abonnement.");
  };

  const extend = (id: unknown) => {
    const days = Number(extensionDays[String(id)]);
    if (!Number.isInteger(days) || days < 1) {
      toast.error("Saisissez un nombre de jours valide.");
      return;
    }
    if (!window.confirm(`Confirmer la prolongation de ${days} jour(s) ?`)) return;
    return updateSubscription(id, { extendDays: days }, `Abonnement prolongé de ${days} jour(s).`);
  };

  const setEndDate = (id: unknown) => {
    const date = endDates[String(id)];
    if (!date) { toast.error("Choisissez une date de fin."); return; }
    if (!window.confirm(`Confirmer la nouvelle date de fin : ${date} ?`)) return;
    return updateSubscription(id, { endDate: date }, "Date de fin enregistrée.");
  };

  return (
    <div>
      <h2 className="text-lg font-bold">Abonnements</h2>
      <p className="text-sm text-muted-foreground">
        Contrôlez les décisions d&apos;abonnement : activation, fin, expiration, prolongation et date de fin personnalisée.
      </p>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="mt-5 overflow-x-auto gspp-scrollbar rounded-2xl border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Référence</th>
                <th className="px-4 py-3 font-semibold">Formule</th>
                <th className="px-4 py-3 font-semibold">Cycle</th>
                <th className="px-4 py-3 font-semibold">Période</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Contrôle de durée</th>
                <th className="px-4 py-3 text-right font-semibold">Décision</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(subs ?? []).map((s) => {
                const plan = s.plan as Record<string, unknown> | undefined;
                return (
                  <tr key={String(s.id)} className="transition hover:bg-secondary/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{String(s.reference)}</td>
                    <td className="px-4 py-3">{plan ? String(plan.name) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.billingCycle === "annual" ? "Annuel" : "Mensuel"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {s.startDate ? new Date(String(s.startDate)).toLocaleDateString("fr-FR") : "—"} →{" "}
                      {s.endDate ? new Date(String(s.endDate)).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={String(s.status)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-[270px] flex-wrap items-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          max={3650}
                          className="h-8 w-20 text-xs"
                          placeholder="Jours"
                          aria-label={`Jours à ajouter pour ${String(s.reference)}`}
                          value={extensionDays[String(s.id)] ?? ""}
                          onChange={(e) => setExtensionDays((prev) => ({ ...prev, [String(s.id)]: e.target.value }))}
                        />
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => extend(s.id)}>Prolonger</Button>
                        <Input
                          type="date"
                          className="h-8 w-36 text-xs"
                          aria-label={`Date de fin pour ${String(s.reference)}`}
                          value={endDates[String(s.id)] ?? ""}
                          onChange={(e) => setEndDates((prev) => ({ ...prev, [String(s.id)]: e.target.value }))}
                        />
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEndDate(s.id)}>Enregistrer</Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {s.status !== "ACTIVE" && (
                          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={() => setStatus(s.id, "ACTIVE")}>
                            <ArrowUpCircle className="mr-1 h-3 w-3" aria-hidden="true" /> Activer
                          </Button>
                        )}
                        {s.status === "ACTIVE" && (
                          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs text-rose-600" onClick={() => setStatus(s.id, "CANCELLED")}>
                            Annuler
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminPayments() {
  const queryClient = useQueryClient();
  const [activationCodes, setActivationCodes] = useState<Record<string, string>>({});
  const { data: payments, isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["admin", "payments"],
    queryFn: () => api.get<Record<string, unknown>[]>("/api/admin/payments"),
  });

  const setStatus = async (id: unknown, status: string) => {
    try {
      const code = activationCodes[String(id)]?.trim();
      await api.patch(`/api/admin/payments/${id}`, { status, activationCode: code || undefined });
      toast.success(status === "COMPLETED" ? "Paiement confirmé — abonnement et licence activés." : "Statut mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  };

  const deletePayment = async (id: unknown, reference: string) => {
    if (!window.confirm(`Supprimer définitivement le paiement ${reference} ? Cette action ne supprimera pas l’abonnement ni la licence.`)) return;
    try {
      await api.delete(`/api/admin/payments/${id}`);
      toast.success("Paiement supprimé.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible.");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold">Paiements & factures</h2>
      <p className="text-sm text-muted-foreground">
        Confirmez les paiements Wave / Orange Money reçus. La confirmation active l&apos;abonnement et génère la facture + la licence.
      </p>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="mt-5 overflow-x-auto gspp-scrollbar rounded-2xl border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Référence</th>
                <th className="px-4 py-3 font-semibold">Montant</th>
                <th className="px-4 py-3 font-semibold">Moyen</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Code d&apos;activation</th>
                <th className="px-4 py-3 font-semibold">Facture</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(payments ?? []).map((p) => (
                <tr key={String(p.id)} className="transition hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{String(p.reference)}</td>
                  <td className="px-4 py-3 font-semibold">{formatFcfa(Number(p.amount))}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.method === "wave" ? "Wave" : p.method === "orange_money" ? "Orange Money" : String(p.method)}
                  </td>
                  <td className="px-4 py-3">
                    {p.user && typeof p.user === "object" ? `${String((p.user as Record<string, unknown>).firstName ?? "")} ${String((p.user as Record<string, unknown>).lastName ?? "")}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "PENDING" ? (
                      <Input
                        className="h-8 min-w-44 font-mono text-xs"
                        placeholder="Code manuel (facultatif)"
                        value={activationCodes[String(p.id)] ?? ""}
                        onChange={(e) => setActivationCodes((prev) => ({ ...prev, [String(p.id)]: e.target.value }))}
                      />
                    ) : (
                      <span className="font-mono text-xs">{(() => {
                        const subscription = p.subscription as Record<string, unknown> | undefined;
                        const keys = subscription?.licenseKeys as Array<Record<string, unknown>> | undefined;
                        return String(keys?.[0]?.key ?? "—");
                      })()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{String(p.invoiceNumber ?? "—")}</td>
                  <td className="px-4 py-3"><StatusBadge status={String(p.status)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {p.status === "PENDING" && (
                        <>
                          <Button size="sm" className="h-8 rounded-full text-xs" onClick={() => setStatus(p.id, "COMPLETED")}>
                            Confirmer
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs text-destructive" onClick={() => setStatus(p.id, "FAILED")}>
                            Échec
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full text-xs text-destructive"
                        onClick={() => deletePayment(p.id, String(p.reference ?? p.id))}
                        title="Supprimer ce paiement"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Tickets support
// ═════════════════════════════════════════════════════════════
function AdminTickets() {
  const queryClient = useQueryClient();
  const [replying, setReplying] = useState<Record<string, unknown> | null>(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: tickets, isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["admin", "tickets"],
    queryFn: () => api.get<Record<string, unknown>[]>("/api/admin/tickets"),
  });

  const update = async (id: unknown, data: Record<string, unknown>) => {
    try {
      await api.patch(`/api/admin/tickets/${id}`, data);
      toast.success("Ticket mis à jour.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  };

  const saveReply = async () => {
    if (!replying) return;
    setSaving(true);
    try {
      await api.patch(`/api/admin/tickets/${replying.id}`, { response, status: "RESOLVED" });
      toast.success("Réponse envoyée — ticket résolu.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
      setReplying(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold">Tickets de support</h2>
      <p className="text-sm text-muted-foreground">Traitez les demandes des utilisateurs et répondez-y directement.</p>
      {isLoading ? (
        <Spinner />
      ) : (
        <ul className="mt-5 space-y-3">
          {(tickets ?? []).map((t) => (
            <li key={String(t.id)} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-muted-foreground">{String(t.reference)}</span>
                <div className="flex items-center gap-2">
                  <Select value={String(t.priority)} onValueChange={(v) => update(t.id, { priority: v })}>
                    <SelectTrigger className="h-7 w-24 text-xs" aria-label="Priorité"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Basse</SelectItem>
                      <SelectItem value="NORMAL">Normale</SelectItem>
                      <SelectItem value="HIGH">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(t.status)} onValueChange={(v) => update(t.id, { status: v })}>
                    <SelectTrigger className="h-7 w-32 text-xs" aria-label="Statut"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Ouvert</SelectItem>
                      <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                      <SelectItem value="RESOLVED">Résolu</SelectItem>
                      <SelectItem value="CLOSED">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <h3 className="mt-2 text-[15px] font-semibold">{String(t.subject)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{String(t.message)}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{String(t.name)} — {String(t.email)} · {formatDate(String(t.createdAt))}</span>
                <div className="flex gap-2">
                  {t.response ? (
                    <span className="rounded-full bg-emerald-600/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      Répondu
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 rounded-full text-xs"
                      onClick={() => { setReplying(t); setResponse(String(t.response ?? "")); }}>
                      Répondre
                    </Button>
                  )}
                </div>
              </div>
              {Boolean(t.response) && (
                <div className="mt-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-500/5 px-4 py-3 text-sm text-muted-foreground">
                  {String(t.response)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!replying} onOpenChange={(o) => !o && setReplying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Répondre au ticket {replying && String(replying.reference)}</DialogTitle>
            <DialogDescription>La réponse sera visible par l&apos;utilisateur dans son espace support.</DialogDescription>
          </DialogHeader>
          <Textarea rows={6} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Votre réponse…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplying(null)}>Annuler</Button>
            <Button onClick={saveReply} disabled={saving || !response.trim()}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              Envoyer et résoudre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Paramètres du site
// ═════════════════════════════════════════════════════════════
function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery<Record<string, unknown>>({
    queryKey: ["settings", "public"],
    queryFn: () => api.get("/api/settings"),
  });
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && !form) setForm({ ...settings });
  }, [settings, form]);

  if (isLoading || !form) return <Spinner />;

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/api/settings", form);
      toast.success("Paramètres enregistrés.");
      await queryClient.invalidateQueries({ queryKey: ["settings", "public"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const FIELDS: { name: string; label: string; type?: string }[] = [
    { name: "siteName", label: "Nom du site" },
    { name: "slogan", label: "Slogan" },
    { name: "contactEmail", label: "E-mail de contact" },
    { name: "contactPhone", label: "Téléphone de contact" },
    { name: "addressLine", label: "Adresse" },
    { name: "defaultDownloadUrl", label: "URL de téléchargement par défaut" },
    { name: "facebookUrl", label: "URL Facebook" },
    { name: "twitterUrl", label: "URL X (Twitter)" },
    { name: "linkedinUrl", label: "URL LinkedIn" },
    { name: "youtubeUrl", label: "URL YouTube" },
  ];

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold">Paramètres du site</h2>
      <p className="text-sm text-muted-foreground">Centralisation des paramètres configurables — modifiables sans toucher au code.</p>
      <div className="mt-6 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label htmlFor={`set-${f.name}`}>{f.label}</Label>
            <Input
              id={`set-${f.name}`}
              value={String(form[f.name] ?? "")}
              onChange={(e) => setForm((s) => ({ ...s!, [f.name]: e.target.value }))}
            />
          </div>
        ))}
        <div className="flex items-center gap-2.5 rounded-2xl border p-4">
          <Switch
            id="set-maintenance"
            checked={Boolean(form.maintenanceMode)}
            onCheckedChange={(v) => setForm((s) => ({ ...s!, maintenanceMode: v }))}
          />
          <Label htmlFor="set-maintenance" className="font-normal">
            Mode maintenance (le site affiche un message d&apos;aux visiteurs pendant les mises à jour)
          </Label>
        </div>
        <Button onClick={save} disabled={saving} className="rounded-full">
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Page Administration
// ═════════════════════════════════════════════════════════════
export function AdminPage() {
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate(isAdmin ? "/" : "/connexion");
  }, [isLoading, isAdmin]);

  if (isLoading) {
    return (
      <main id="contenu" className="py-24">
        <Spinner />
      </main>
    );
  }
  if (!user || !isAdmin) {
    return (
      <main id="contenu" className="py-24 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold">Accès réservé aux administrateurs</h1>
        <p className="mt-2 text-sm text-muted-foreground">Connectez-vous avec un compte administrateur pour accéder à cet espace.</p>
        <Button className="mt-6 rounded-full" onClick={() => navigate("/connexion")}>Se connecter</Button>
      </main>
    );
  }

  const TABS = [
    { id: "overview", label: "Résumé", icon: LayoutDashboard },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "subscriptions", label: "Abonnements", icon: ArrowUpCircle },
    { id: "payments", label: "Paiements", icon: Receipt },
    { id: "tickets", label: "Tickets", icon: LifeBuoy },
    { id: "plans", label: "Formules", icon: Package },
    { id: "versions", label: "Versions", icon: Download },
    { id: "library", label: "Bibliothèque", icon: BookOpen },
    { id: "articles", label: "Articles", icon: Newspaper },
    { id: "faqs", label: "FAQ", icon: HelpCircle },
    { id: "testimonials", label: "Témoignages", icon: MessageSquareQuote },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <main id="contenu" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
            Administration
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Gestion de la plateforme</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connecté en tant qu&apos;administrateur — {SITE.name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto rounded-2xl p-1.5 gspp-scrollbar">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} id={`tab-${t.id === "overview" ? "users" : t.id}`} value={t.id} className="gap-1.5 rounded-xl px-3.5 py-2 text-[13px] data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6"><Overview /></TabsContent>
        <TabsContent value="users" className="mt-6"><AdminUsers /></TabsContent>
        <TabsContent value="subscriptions" className="mt-6"><AdminSubscriptions /></TabsContent>
        <TabsContent value="payments" className="mt-6"><AdminPayments /></TabsContent>
        <TabsContent value="tickets" className="mt-6"><AdminTickets /></TabsContent>

        <TabsContent value="plans" className="mt-6">
          <EntityCrud
            entity="plans"
            title="Formules d'abonnement"
            description="Modifiez les prix, limites et fonctionnalités affichées sur le site public."
            fields={[
              { name: "name", label: "Nom", type: "text" },
              { name: "slug", label: "Identifiant (slug)", type: "text", placeholder: "professionnel" },
              { name: "description", label: "Description", type: "textarea" },
              { name: "monthlyPrice", label: "Prix mensuel (FCFA)", type: "number" },
              { name: "annualPrice", label: "Prix annuel (FCFA)", type: "number" },
              { name: "maxUsers", label: "Utilisateurs max", type: "number" },
              { name: "maxSchools", label: "Établissements max", type: "number" },
              { name: "maxStudents", label: "Élèves max", type: "number" },
              { name: "features", label: "Fonctionnalités incluses", type: "list" },
              { name: "highlighted", label: "Mise en avant", type: "boolean" },
              { name: "active", label: "Visible publiquement", type: "boolean" },
              { name: "sortOrder", label: "Ordre d'affichage", type: "number" },
            ]}
          />
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <EntityCrud
            entity="versions"
            title="Versions du logiciel"
            description="Le lien de téléchargement pointe vers downloadUrl — remplacez-le à chaque nouvelle version."
            fields={[
              { name: "version", label: "Numéro de version", type: "text", placeholder: "3.2.1" },
              { name: "channel", label: "Canal", type: "select", options: ["stable", "beta"] },
              { name: "releaseDate", label: "Date de publication", type: "text" },
              { name: "fileSizeMb", label: "Taille (Mo)", type: "number" },
              { name: "minOs", label: "Configuration minimale", type: "text" },
              { name: "installerName", label: "Nom de l'installateur", type: "text" },
              { name: "downloadUrl", label: "URL de téléchargement", type: "text", placeholder: "https://downloads…/Setup.exe" },
              { name: "changelog", label: "Journal des modifications (Markdown)", type: "textarea" },
              { name: "active", label: "Version active", type: "boolean" },
            ]}
          />
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <EntityCrud
            entity="library"
            title="Bibliothèque — livres et documents"
            description="Ajoutez une ressource, indiquez son URL de couverture et son lien de téléchargement, puis publiez-la pour les utilisateurs."
            fields={[
              { name: "title", label: "Titre", type: "text", placeholder: "Manuel élèves des cours moyen" },
              { name: "description", label: "Description", type: "textarea", placeholder: "Présentation du livre ou du document" },
              { name: "author", label: "Auteur / organisme", type: "text" },
              { name: "category", label: "Catégorie", type: "text", placeholder: "Manuels, Cours, Guides…" },
              { name: "level", label: "Niveau", type: "text", placeholder: "CM1, CM2, Tous niveaux…" },
              { name: "fileType", label: "Type de fichier", type: "text", placeholder: "PDF" },
              { name: "fileSizeMb", label: "Taille (Mo)", type: "number" },
              { name: "coverUrl", label: "URL de la couverture", type: "text", placeholder: "https://…/couverture.jpg" },
              { name: "downloadUrl", label: "URL de téléchargement", type: "text", placeholder: "https://…/manuel.pdf" },
              { name: "featured", label: "Mettre en avant", type: "boolean" },
              { name: "published", label: "Publié dans la bibliothèque", type: "boolean" },
              { name: "sortOrder", label: "Ordre d'affichage", type: "number" },
            ]}
          />
        </TabsContent>

        <TabsContent value="articles" className="mt-6">
          <EntityCrud
            entity="articles"
            title="Articles — Actualités & nouveautés"
            description="Publiez les nouvelles fonctionnalités, versions, corrections, tutoriels et conseils."
            fields={[
              { name: "title", label: "Titre", type: "text" },
              { name: "slug", label: "Identifiant (slug)", type: "text", placeholder: "version-3-3-disponible" },
              { name: "excerpt", label: "Résumé", type: "textarea" },
              { name: "content", label: "Contenu (paragraphes séparés par une ligne vide)", type: "textarea" },
              { name: "category", label: "Catégorie", type: "select", options: ["version", "annonce", "correction", "tutoriel", "conseils"] },
              { name: "coverEmoji", label: "Émoji de couverture", type: "text", placeholder: "🎉" },
              { name: "publishedAt", label: "Date de publication", type: "text" },
              { name: "published", label: "Publié", type: "boolean" },
            ]}
          />
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <EntityCrud
            entity="faqs"
            title="Questions fréquentes"
            description="Le système d'accordéon de la page FAQ se met à jour automatiquement."
            fields={[
              { name: "question", label: "Question", type: "text" },
              { name: "answer", label: "Réponse", type: "textarea" },
              { name: "category", label: "Catégorie", type: "select", options: ["general", "compte", "abonnement", "logiciel", "support"] },
              { name: "sortOrder", label: "Ordre", type: "number" },
              { name: "published", label: "Publiée", type: "boolean" },
            ]}
          />
        </TabsContent>

        <TabsContent value="testimonials" className="mt-6">
          <EntityCrud
            entity="testimonials"
            title="Témoignages"
            description="Les témoignages affichés sur la page d'accueil."
            fields={[
              { name: "name", label: "Nom", type: "text" },
              { name: "role", label: "Fonction", type: "text" },
              { name: "establishment", label: "Établissement", type: "text" },
              { name: "content", label: "Témoignage", type: "textarea" },
              { name: "rating", label: "Note (1-5)", type: "number" },
              { name: "initials", label: "Initiales (avatar)", type: "text" },
              { name: "color", label: "Couleur de l'avatar", type: "select", options: ["emerald", "teal", "amber", "rose", "sky", "violet"] },
              { name: "sortOrder", label: "Ordre", type: "number" },
              { name: "published", label: "Publié", type: "boolean" },
            ]}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6"><AdminSettings /></TabsContent>
      </Tabs>
    </main>
  );
}
