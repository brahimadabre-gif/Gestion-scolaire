"use client";

// ── Administration → Messages aux logiciels (maquette B : assistant en 3 étapes) ──
// 1. Écrire  2. Choisir les destinataires  3. Vérifier et publier.
// Le logiciel affiche le message dans une fenêtre au centre (maquette C) et le
// rappel de paiement dans une fenêtre qui revient toutes les 15 min (maquette B).
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, Clock, CreditCard, Gift, Globe, Info, KeyRound, ListChecks, Loader2, Megaphone,
  Monitor, Pencil, Plus, Search, Send, ShieldAlert, Smartphone, Sparkles, Trash2, TriangleAlert, Undo2, X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type Kind = "INFO" | "NEW" | "IMPORTANT" | "OFFER" | "PAYMENT";
type Audience = "ALL" | "PC" | "ANDROID" | "SELECTION";
type ModeCible = "ALL" | "PC" | "ANDROID" | "COCHER" | "CLES";
type Minuteur = "AUCUN" | "2" | "24" | "48" | "DATE";

interface Message {
  id: string; title: string; body: string; kind: Kind; buttonLabel: string | null; buttonUrl: string | null;
  audience: Audience; targetUserIds: string[]; targetKeys: string[]; status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  startsAt: string | null; endsAt: string | null; deadlineAt: string | null; suspendAtDeadline: boolean;
  publishedAt: string | null; archivedAt: string | null; createdAt: string;
  stats?: { recus: number; lus: number; vises: number | null };
}
interface Destinataire {
  id: string; type: "COMPTE" | "CLE"; userId: string | null; key: string | null; ecole: string; personne: string;
  email: string | null; ville: string | null; platforms: string[]; statut: "ACTIVE" | "EXPIRED" | "AVAILABLE" | "REVOKED";
  fin: string | null; derniereConnexion: string | null; cles: string[];
}

const KINDS: { id: Kind; label: string; icon: typeof Info; couleur: string; fond: string }[] = [
  { id: "INFO", label: "Information", icon: Info, couleur: "text-blue-700 dark:text-blue-300", fond: "from-blue-600 to-blue-800" },
  { id: "NEW", label: "Nouveauté", icon: Sparkles, couleur: "text-violet-700 dark:text-violet-300", fond: "from-violet-600 to-violet-800" },
  { id: "IMPORTANT", label: "Important", icon: TriangleAlert, couleur: "text-amber-700 dark:text-amber-300", fond: "from-amber-500 to-amber-700" },
  { id: "OFFER", label: "Offre", icon: Gift, couleur: "text-emerald-700 dark:text-emerald-300", fond: "from-emerald-600 to-emerald-800" },
  { id: "PAYMENT", label: "Rappel de paiement", icon: CreditCard, couleur: "text-red-700 dark:text-red-300", fond: "from-red-600 to-red-800" },
];
const kindDe = (k: Kind) => KINDS.find((x) => x.id === k) ?? KINDS[0];
const STATUTS_LICENCE: Record<Destinataire["statut"], { label: string; cls: string }> = {
  ACTIVE: { label: "Activée", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  EXPIRED: { label: "Expirée", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  AVAILABLE: { label: "Non activée", cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  REVOKED: { label: "Révoquée", cls: "bg-destructive/10 text-destructive" },
};

const dateHeure = (v: string | null) => v ? new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const ilYa = (v: string | null) => {
  if (!v) return "jamais";
  const min = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (min < 60) return `il y a ${Math.max(1, min)} min`;
  if (min < 48 * 60) return `il y a ${Math.round(min / 60)} h`;
  return `il y a ${Math.round(min / 1440)} j`;
};
// <input type="datetime-local"> ⇄ ISO
const versLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const depuisLocal = (v: string) => (v ? new Date(v).toISOString() : null);

const Puce = ({ actif, onClick, children, danger, disabled, title }: { actif: boolean; onClick: () => void; children: React.ReactNode; danger?: boolean; disabled?: boolean; title?: string }) => (
  <button type="button" aria-pressed={actif} disabled={disabled} title={title} onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${actif ? (danger ? "border-red-600 bg-red-500/10 text-red-700 dark:text-red-300" : "border-orange-600 bg-orange-500/10 text-orange-700 dark:text-orange-300") : "border-input bg-background hover:bg-secondary"}`}>
    {children}
  </button>
);

// ── Aperçu : la fenêtre telle que le logiciel l'affichera ──
function Apercu({ kind, title, body, buttonLabel, deadline, suspend, telephone }: { kind: Kind; title: string; body: string; buttonLabel: string; deadline: Date | null; suspend: boolean; telephone?: boolean }) {
  const k = kindDe(kind);
  const restant = deadline ? Math.max(0, deadline.getTime() - Date.now()) : 0;
  const hh = String(Math.floor(restant / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((restant % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((restant % 60000) / 1000)).padStart(2, "0");
  const paiement = kind === "PAYMENT";
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-800/80 p-4 ${telephone ? "mx-auto w-[260px]" : ""}`}>
      <div className={`mx-auto overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl ${telephone ? "w-full" : "max-w-[380px]"}`}>
        {paiement && deadline ? (
          <div className="px-5 pt-5 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full" style={{ background: "conic-gradient(#dc2626 0 85%, #fee2e2 85% 100%)" }}>
              <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-white">
                <span className="text-[7.5px] font-bold tracking-wide text-slate-500">{suspend ? "SUSPENSION DANS" : "IL RESTE"}</span>
                <span className="font-mono text-sm font-bold text-red-700">{hh}:{mm}:{ss}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-3 bg-gradient-to-br ${k.fond} px-4 py-3.5 text-white`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20"><k.icon className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0"><p className="text-[9px] font-semibold tracking-wider opacity-85">MESSAGE DE GESTION SCOLAIRE PRO PLUS</p><p className="truncate text-sm font-bold">{title || "Titre du message"}</p></div>
          </div>
        )}
        <div className={`px-5 py-3 text-[12.5px] leading-relaxed text-slate-600 ${paiement && deadline ? "text-center" : ""}`}>
          {paiement && deadline && <p className="mb-1 text-[15px] font-bold text-slate-900">{title || "Titre du message"}</p>}
          <p className="whitespace-pre-line">{body || "Votre message apparaîtra ici."}</p>
          {paiement && suspend && <p className="mt-1.5 text-[11px] text-slate-500">Vos données ne seront pas effacées.</p>}
        </div>
        <div className={`flex gap-2 px-5 pb-4 ${paiement ? "flex-col" : "justify-end"}`}>
          {paiement ? <>
            <span className="rounded-lg bg-red-600 py-2 text-center text-xs font-bold text-white">{buttonLabel || "Payer maintenant"}</span>
            <span className="rounded-lg border py-2 text-center text-xs font-bold">J&apos;ai déjà payé — contacter le service</span>
            <span className="text-center text-[10px] text-slate-400">Me le rappeler dans 15 minutes</span>
          </> : <>
            <span className="rounded-lg border px-3 py-1.5 text-xs font-bold">Plus tard</span>
            {buttonLabel && <span className="rounded-lg border border-orange-600 px-3 py-1.5 text-xs font-bold text-orange-700">{buttonLabel}</span>}
            <span className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white">J&apos;ai compris</span>
          </>}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
export function AdminMessages() {
  const queryClient = useQueryClient();
  const [assistant, setAssistant] = useState(false);
  const [brouillonId, setBrouillonId] = useState<string | null>(null);
  const [prolonger, setProlonger] = useState<Message | null>(null);
  const [nouvelleEcheance, setNouvelleEcheance] = useState("");
  const [enCours, setEnCours] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{ items: Message[] }>({
    queryKey: ["admin", "messages"],
    queryFn: () => api.get<{ items: Message[] }>("/api/admin/messages"),
    enabled: !assistant,
  });
  const messages = data?.items ?? [];
  const recharger = () => queryClient.invalidateQueries({ queryKey: ["admin", "messages"] });

  const agir = async (m: Message, action: "publish" | "archive", confirmation: string, succes: string) => {
    if (!window.confirm(confirmation)) return;
    setEnCours(m.id);
    try { await api.patch(`/api/admin/messages/${m.id}`, { action }); toast.success(succes); await recharger(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Action impossible."); }
    finally { setEnCours(null); }
  };
  const supprimer = async (m: Message) => {
    if (!window.confirm(`Supprimer le brouillon « ${m.title} » ?`)) return;
    setEnCours(m.id);
    try { await api.delete(`/api/admin/messages/${m.id}`); toast.success("Brouillon supprimé."); await recharger(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Suppression impossible."); }
    finally { setEnCours(null); }
  };
  const repousser = async () => {
    if (!prolonger) return;
    try {
      await api.patch(`/api/admin/messages/${prolonger.id}`, { action: "deadline", deadlineAt: depuisLocal(nouvelleEcheance) });
      toast.success("Échéance repoussée.");
      setProlonger(null);
      await recharger();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Modification impossible."); }
  };

  if (assistant) {
    const brouillon = brouillonId ? messages.find((m) => m.id === brouillonId) ?? null : null;
    return <Assistant brouillon={brouillon} onFin={async () => { setAssistant(false); setBrouillonId(null); await recharger(); }} />;
  }

  const etat = (m: Message) => {
    const now = Date.now();
    if (m.status === "DRAFT") return { label: "Brouillon", cls: "bg-muted text-muted-foreground" };
    if (m.status === "ARCHIVED") return { label: "Retiré", cls: "bg-muted text-muted-foreground" };
    if (m.suspendAtDeadline && m.deadlineAt && new Date(m.deadlineAt).getTime() <= now) return { label: "Licence suspendue", cls: "bg-red-600 text-white" };
    if (m.startsAt && new Date(m.startsAt).getTime() > now) return { label: "Programmé", cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300" };
    if (m.endsAt && new Date(m.endsAt).getTime() <= now) return { label: "Terminé", cls: "bg-muted text-muted-foreground" };
    if (m.deadlineAt) return { label: "Minuteur en cours", cls: "bg-red-500/10 text-red-700 dark:text-red-300" };
    return { label: "En ligne", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
  };
  const cible = (m: Message) => m.audience === "ALL" ? "Tous les logiciels" : m.audience === "PC" ? "PC seulement" : m.audience === "ANDROID" ? "Android seulement"
    : `${m.targetUserIds.length ? `${m.targetUserIds.length} compte(s)` : ""}${m.targetUserIds.length && m.targetKeys.length ? " + " : ""}${m.targetKeys.length ? `${m.targetKeys.length} clé(s)` : ""}`;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-700 dark:text-orange-300"><Megaphone className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h2 className="text-lg font-bold">Messages aux logiciels</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Le message s&apos;affiche dans une fenêtre, dans les logiciels installés (PC et Android), dès qu&apos;ils se connectent à Internet. Un rappel de paiement peut suspendre la licence à l&apos;échéance ; « Paiement reçu » lève la suspension.</p>
          </div>
        </div>
        <Button className="rounded-full" onClick={() => { setBrouillonId(null); setAssistant(true); }}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Nouveau message</Button>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-600" aria-label="Chargement" /></div>
          : isError ? <div className="flex items-center justify-between gap-3 py-10 text-sm text-destructive"><span>Impossible de charger les messages.</span><Button variant="outline" onClick={() => void refetch()}>Réessayer</Button></div>
          : !messages.length ? <p className="py-12 text-center text-sm text-muted-foreground">Aucun message pour l&apos;instant. Cliquez sur « Nouveau message ».</p>
          : <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[900px] text-left text-sm">
            <thead><tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-3 py-3">Message</th><th className="px-3 py-3">Destinataires</th><th className="px-3 py-3">État</th><th className="px-3 py-3">Reçu · lu</th><th className="px-3 py-3">Échéance</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y">{messages.map((m) => {
              const k = kindDe(m.kind); const e = etat(m); const s = m.stats;
              const pct = s?.vises ? Math.min(100, Math.round((s.recus / s.vises) * 100)) : 0;
              return <tr key={m.id} className="align-top hover:bg-secondary/30">
                <td className="px-3 py-3"><div className="flex gap-2.5"><k.icon className={`mt-0.5 h-4 w-4 shrink-0 ${k.couleur}`} aria-hidden="true" /><div><p className="font-semibold">{m.title}</p><p className="line-clamp-1 max-w-[320px] text-xs text-muted-foreground">{m.body}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{k.label} · créé le {dateHeure(m.createdAt)}</p></div></div></td>
                <td className="px-3 py-3 text-[13px]">{cible(m)}</td>
                <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${e.cls}`}>{e.label}</span>{m.startsAt && m.status === "PUBLISHED" && <span className="mt-1 block text-[11px] text-muted-foreground">dès le {dateHeure(m.startsAt)}</span>}</td>
                <td className="px-3 py-3">{m.status === "DRAFT" ? <span className="text-muted-foreground">—</span> : <><span className="text-[13px] font-semibold">{s?.recus ?? 0}{s?.vises != null ? ` / ${s.vises}` : ""}</span><span className="ml-1 text-xs text-muted-foreground">· {s?.lus ?? 0} lu(s)</span>{s?.vises ? <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} /></div> : null}</>}</td>
                <td className="px-3 py-3 text-[13px]">{m.deadlineAt ? <>{dateHeure(m.deadlineAt)}{m.suspendAtDeadline && <span className="block text-[11px] font-semibold text-red-700 dark:text-red-300">suspension prévue</span>}</> : <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-3"><div className="flex flex-wrap justify-end gap-1.5">
                  {m.status === "DRAFT" && <>
                    <Button size="sm" variant="outline" disabled={enCours === m.id} onClick={() => { setBrouillonId(m.id); setAssistant(true); }}><Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Modifier</Button>
                    <Button size="sm" disabled={enCours === m.id} onClick={() => void agir(m, "publish", `Publier « ${m.title} » maintenant ?`, "Message publié.")}><Send className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Publier</Button>
                    <Button size="icon" variant="ghost" className="text-destructive" aria-label="Supprimer le brouillon" disabled={enCours === m.id} onClick={() => void supprimer(m)}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                  </>}
                  {m.status === "PUBLISHED" && m.deadlineAt && <Button size="sm" variant="outline" onClick={() => { setProlonger(m); setNouvelleEcheance(versLocal(new Date(Math.max(Date.now(), new Date(m.deadlineAt!).getTime()) + 24 * 3600000).toISOString())); }}><Clock className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Repousser</Button>}
                  {m.status === "PUBLISHED" && (m.suspendAtDeadline
                    ? <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={enCours === m.id} onClick={() => void agir(m, "archive", `Paiement reçu pour « ${m.title} » ? Le rappel est retiré et la licence redevient valable à la prochaine vérification du logiciel.`, "Rappel retiré : la licence n'est plus suspendue.")}><Check className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Paiement reçu</Button>
                    : <Button size="sm" variant="outline" disabled={enCours === m.id} onClick={() => void agir(m, "archive", `Retirer « ${m.title} » ? Il ne s'affichera plus dans les logiciels.`, "Message retiré.")}><Undo2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Retirer</Button>)}
                </div></td>
              </tr>;
            })}</tbody>
          </table></div>}
      </section>

      <Dialog open={!!prolonger} onOpenChange={(o) => { if (!o) setProlonger(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Repousser l&apos;échéance</DialogTitle><DialogDescription>Le compte à rebours du logiciel se met à jour à sa prochaine connexion.</DialogDescription></DialogHeader>
          <label className="space-y-1.5 text-sm font-medium">Nouvelle échéance<Input type="datetime-local" value={nouvelleEcheance} onChange={(e) => setNouvelleEcheance(e.target.value)} /></label>
          <DialogFooter><Button variant="outline" onClick={() => setProlonger(null)}>Annuler</Button><Button disabled={!nouvelleEcheance} onClick={() => void repousser()}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Assistant en 3 étapes
// ═════════════════════════════════════════════════════════════
const TEXTE_PAIEMENT = {
  title: "Paiement de votre licence non reçu",
  body: "Votre clé a été activée mais le paiement n'est pas arrivé. Sans règlement, le logiciel sera suspendu à la fin du compte à rebours.",
};

function Assistant({ brouillon, onFin }: { brouillon: Message | null; onFin: () => Promise<void> }) {
  const [etape, setEtape] = useState(1);
  const [kind, setKind] = useState<Kind>(brouillon?.kind ?? "INFO");
  const [title, setTitle] = useState(brouillon?.title ?? "");
  const [body, setBody] = useState(brouillon?.body ?? "");
  const [buttonLabel, setButtonLabel] = useState(brouillon?.buttonLabel ?? "");
  const [buttonUrl, setButtonUrl] = useState(brouillon?.buttonUrl ?? "");
  const [minuteur, setMinuteur] = useState<Minuteur>(brouillon?.deadlineAt ? "DATE" : "AUCUN");
  const [dateEcheance, setDateEcheance] = useState(versLocal(brouillon?.deadlineAt ?? null));
  const [suspendre, setSuspendre] = useState(brouillon?.suspendAtDeadline ?? false);
  const [mode, setMode] = useState<ModeCible>(() => {
    if (!brouillon) return "ALL";
    if (brouillon.audience !== "SELECTION") return brouillon.audience;
    return brouillon.targetUserIds.length || !brouillon.targetKeys.length ? "COCHER" : "CLES";
  });
  // Lignes cochées (gardées même si un filtre les cache) : id de ligne → ligne
  const [coches, setCoches] = useState<Map<string, Pick<Destinataire, "id" | "type" | "userId" | "key" | "ecole" | "platforms">>>(() => {
    const m = new Map();
    brouillon?.targetUserIds.forEach((u) => m.set(`u:${u}`, { id: `u:${u}`, type: "COMPTE", userId: u, key: null, ecole: "Compte choisi", platforms: [] }));
    if (brouillon && brouillon.targetUserIds.length) brouillon.targetKeys.forEach((k) => m.set(`k:${k}`, { id: `k:${k}`, type: "CLE", userId: null, key: k, ecole: k, platforms: [] }));
    return m;
  });
  const [clesCollees, setClesCollees] = useState(brouillon && !brouillon.targetUserIds.length ? brouillon.targetKeys.join("\n") : "");
  const [quand, setQuand] = useState<"MAINTENANT" | "PROGRAMMER">(brouillon?.startsAt ? "PROGRAMMER" : "MAINTENANT");
  const [debut, setDebut] = useState(versLocal(brouillon?.startsAt ?? null));
  const [fin, setFin] = useState(versLocal(brouillon?.endsAt ?? null));
  const [envoi, setEnvoi] = useState<"brouillon" | "publier" | null>(null);
  // Filtres de l'étape 2
  const [q, setQ] = useState("");
  const [fPlateforme, setFPlateforme] = useState("all");
  const [fLicence, setFLicence] = useState("all");
  const [fVille, setFVille] = useState("");

  const selection = mode === "COCHER" || mode === "CLES";
  const listeCles = useMemo(() => [...new Set(clesCollees.split(/[\s,;]+/).map((c) => c.trim().toUpperCase()).filter((c) => c.length >= 4))], [clesCollees]);
  const ciblesUsers = mode === "COCHER" ? [...coches.values()].filter((c) => c.userId).map((c) => c.userId!) : [];
  const ciblesCles = mode === "COCHER" ? [...coches.values()].filter((c) => c.key).map((c) => c.key!) : mode === "CLES" ? listeCles : [];
  const nbCibles = ciblesUsers.length + ciblesCles.length;

  const params = new URLSearchParams({ q, platform: fPlateforme, licence: fLicence, ville: fVille });
  const { data: dest, isLoading: chargeDest } = useQuery<{ total: number; villes: string[]; items: Destinataire[]; tronque: boolean }>({
    queryKey: ["admin", "messages", "destinataires", q, fPlateforme, fLicence, fVille],
    queryFn: () => api.get(`/api/admin/messages/destinataires?${params.toString()}`),
    enabled: etape === 2 && mode === "COCHER",
  });
  const lignes = dest?.items ?? [];

  const choisirType = (k: Kind) => {
    setKind(k);
    if (k === "PAYMENT") {
      if (!title.trim()) setTitle(TEXTE_PAIEMENT.title);
      if (!body.trim()) setBody(TEXTE_PAIEMENT.body);
      if (minuteur === "AUCUN") setMinuteur("2");
      setSuspendre(true);
      if (mode === "ALL" || mode === "PC" || mode === "ANDROID") setMode("CLES");
    }
  };
  const echeance = (): Date | null => {
    if (minuteur === "AUCUN") return null;
    if (minuteur === "DATE") return dateEcheance ? new Date(dateEcheance) : null;
    return new Date(Date.now() + Number(minuteur) * 3600000);
  };
  const cocher = (l: Destinataire) => setCoches((m) => { const n = new Map(m); if (n.has(l.id)) n.delete(l.id); else n.set(l.id, l); return n; });
  const toutCocher = () => setCoches((m) => { const n = new Map(m); const tous = lignes.every((l) => n.has(l.id)); lignes.forEach((l) => tous ? n.delete(l.id) : n.set(l.id, l)); return n; });

  const erreurEtape1 = title.trim().length < 3 ? "Écrivez un titre (3 caractères au moins)."
    : body.trim().length < 3 ? "Écrivez le message."
    : buttonUrl && !/^https:\/\//i.test(buttonUrl) ? "Le lien du bouton doit commencer par https://"
    : buttonUrl && !buttonLabel.trim() ? "Donnez un texte au bouton."
    : minuteur === "DATE" && (!dateEcheance || new Date(dateEcheance).getTime() <= Date.now()) ? "Choisissez une échéance dans le futur."
    : null;
  const erreurEtape2 = selection && !nbCibles ? (mode === "CLES" ? "Collez au moins une clé." : "Cochez au moins une école.")
    : suspendre && minuteur !== "AUCUN" && !selection ? "La suspension n'est possible que pour des écoles choisies : cochez-les ou collez leurs clés."
    : null;

  const envoyer = async (publier: boolean) => {
    const deadline = echeance();
    const payload = {
      title: title.trim(), body: body.trim(), kind,
      buttonLabel: buttonUrl ? buttonLabel.trim() : null, buttonUrl: buttonUrl.trim() || null,
      audience: (selection ? "SELECTION" : mode) as Audience,
      targetUserIds: ciblesUsers, targetKeys: ciblesCles,
      startsAt: quand === "PROGRAMMER" ? depuisLocal(debut) : null,
      endsAt: depuisLocal(fin),
      deadlineAt: deadline ? deadline.toISOString() : null,
      suspendAtDeadline: Boolean(deadline) && suspendre,
    };
    if (publier && !window.confirm(payload.suspendAtDeadline
      ? `Publier ce rappel ? À l'échéance (${deadline!.toLocaleString("fr-FR")}), la licence des ${nbCibles} destinataire(s) sera suspendue jusqu'à ce que vous cliquiez « Paiement reçu ».`
      : "Publier ce message ? Il s'affichera dans les logiciels visés dès leur prochaine connexion.")) return;
    setEnvoi(publier ? "publier" : "brouillon");
    try {
      if (brouillon) {
        await api.patch(`/api/admin/messages/${brouillon.id}`, { action: "update", message: payload });
        if (publier) await api.patch(`/api/admin/messages/${brouillon.id}`, { action: "publish" });
      } else {
        await api.post("/api/admin/messages", { ...payload, publish: publier });
      }
      toast.success(publier ? "Message publié." : "Brouillon enregistré.");
      await onFin();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Enregistrement impossible."); }
    finally { setEnvoi(null); }
  };

  const ETAPES = [
    { n: 1, titre: "Écrire", sous: title ? `« ${title.slice(0, 34)}${title.length > 34 ? "…" : ""} »` : "Type, titre, message, minuteur" },
    { n: 2, titre: "Choisir les destinataires", sous: "Tous, PC, Android ou des écoles précises" },
    { n: 3, titre: "Vérifier et publier", sous: "Aperçu PC et téléphone" },
  ];
  const resume = mode === "ALL" ? "Tous les logiciels" : mode === "PC" ? "Tous les PC" : mode === "ANDROID" ? "Tous les téléphones Android"
    : `${nbCibles} destinataire(s)`;
  const deadline = echeance();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-extrabold tracking-tight">{brouillon ? "Modifier le brouillon" : "Nouveau message"}</h2><p className="text-sm text-muted-foreground">Étape {etape} sur 3</p></div>
        <Button variant="ghost" onClick={() => void onFin()}><X className="mr-1.5 h-4 w-4" aria-hidden="true" />Fermer sans enregistrer</Button>
      </div>

      <ol className="grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-3">
        {ETAPES.map((e) => {
          const fait = etape > e.n; const actif = etape === e.n;
          return <li key={e.n} className={`flex items-center gap-3 border-b px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${actif ? "bg-orange-500/5" : ""}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${fait ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : actif ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"}`}>{fait ? <Check className="h-4 w-4" aria-hidden="true" /> : e.n}</span>
            <div className="min-w-0"><p className={`text-sm font-bold ${fait ? "text-emerald-700 dark:text-emerald-300" : actif ? "text-orange-700 dark:text-orange-300" : "text-muted-foreground"}`}>{e.titre}</p><p className="truncate text-xs text-muted-foreground">{e.sous}</p></div>
          </li>;
        })}
      </ol>

      {/* ── Étape 1 : écrire ── */}
      {etape === 1 && <section className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
          <div><p className="mb-2 text-sm font-semibold">Type de message</p><div className="flex flex-wrap gap-2">{KINDS.map((k) => <Puce key={k.id} actif={kind === k.id} danger={k.id === "PAYMENT"} onClick={() => choisirType(k.id)}><k.icon className="h-3.5 w-3.5" aria-hidden="true" />{k.label}</Puce>)}</div></div>
          <label className="block space-y-1.5 text-sm font-semibold">Titre<Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Nouvelle version disponible" /></label>
          <label className="block space-y-1.5 text-sm font-semibold">Message<Textarea value={body} maxLength={2000} rows={5} onChange={(e) => setBody(e.target.value)} placeholder="Bonjour ! …" /><span className="block text-right text-xs font-normal text-muted-foreground">{body.length} / 2000</span></label>
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <label className="space-y-1.5 text-sm font-semibold">Bouton (facultatif)<Input value={buttonLabel} maxLength={40} onChange={(e) => setButtonLabel(e.target.value)} placeholder={kind === "PAYMENT" ? "Payer maintenant" : "Voir les nouveautés"} /></label>
            <label className="space-y-1.5 text-sm font-semibold">Lien du bouton<Input value={buttonUrl} maxLength={300} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://gestionscolaire.pro/…" /></label>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><Clock className="h-4 w-4 text-red-600" aria-hidden="true" />Compte à rebours</p>
            <p className="mt-1 text-xs text-muted-foreground">Le logiciel affiche le temps restant ; l&apos;heure vient du site, pas de l&apos;ordinateur.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([["AUCUN", "Aucun"], ["2", "2 heures"], ["24", "24 heures"], ["48", "48 heures"], ["DATE", "Date précise"]] as [Minuteur, string][]).map(([v, l]) => <Puce key={v} actif={minuteur === v} onClick={() => setMinuteur(v)}>{l}</Puce>)}
            </div>
            {minuteur === "DATE" && <Input className="mt-3 max-w-xs" type="datetime-local" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />}
            {minuteur !== "AUCUN" && minuteur !== "DATE" && <p className="mt-2 text-xs text-muted-foreground">Le compte à rebours part au moment où vous publiez.</p>}
            {minuteur !== "AUCUN" && <label className="mt-3 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm">
              <input type="checkbox" className="mt-1" checked={suspendre} onChange={(e) => setSuspendre(e.target.checked)} />
              <span><strong className="text-red-700 dark:text-red-300">Suspendre la licence à l&apos;échéance</strong><span className="block text-xs text-muted-foreground">Seulement pour des écoles choisies. Les données de l&apos;école ne sont jamais effacées ; « Paiement reçu » lève la suspension.</span></span>
            </label>}
          </div>
        </div>
        <div className="space-y-3"><p className="text-sm font-semibold">Aperçu dans le logiciel</p><Apercu kind={kind} title={title} body={body} buttonLabel={buttonLabel} deadline={deadline} suspend={suspendre} /></div>
      </section>}

      {/* ── Étape 2 : destinataires ── */}
      {etape === 2 && <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Puce actif={mode === "ALL"} disabled={suspendre && minuteur !== "AUCUN"} title={suspendre ? "Impossible avec la suspension" : undefined} onClick={() => setMode("ALL")}><Globe className="h-3.5 w-3.5" aria-hidden="true" />Tout le monde</Puce>
          <Puce actif={mode === "PC"} disabled={suspendre && minuteur !== "AUCUN"} onClick={() => setMode("PC")}><Monitor className="h-3.5 w-3.5" aria-hidden="true" />PC seulement</Puce>
          <Puce actif={mode === "ANDROID"} disabled={suspendre && minuteur !== "AUCUN"} onClick={() => setMode("ANDROID")}><Smartphone className="h-3.5 w-3.5" aria-hidden="true" />Android seulement</Puce>
          <Puce actif={mode === "COCHER"} onClick={() => setMode("COCHER")}><ListChecks className="h-3.5 w-3.5" aria-hidden="true" />Je coche moi-même</Puce>
          <Puce actif={mode === "CLES"} onClick={() => setMode("CLES")}><KeyRound className="h-3.5 w-3.5" aria-hidden="true" />Coller des clés</Puce>
        </div>

        {(mode === "ALL" || mode === "PC" || mode === "ANDROID") && <p className="mt-5 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">Le message ira à {mode === "ALL" ? "tous les logiciels" : mode === "PC" ? "tous les logiciels PC" : "tous les logiciels Android"}, y compris ceux encore en essai sans clé.</p>}

        {mode === "CLES" && <div className="mt-5 space-y-2">
          <label className="block space-y-1.5 text-sm font-semibold">Clés de licence (une par ligne, ou séparées par des virgules)<Textarea rows={6} className="font-mono text-sm" value={clesCollees} onChange={(e) => setClesCollees(e.target.value)} placeholder={"GSPC-XXXX-XXXX-XXXX\nGSAN-XXXX-XXXX-XXXX"} /></label>
          <p className="text-xs text-muted-foreground">{listeCles.length} clé(s) reconnue(s). Le site vérifie qu&apos;elles existent avant l&apos;enregistrement.</p>
        </div>}

        {mode === "COCHER" && <div className="mt-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr]">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="École, nom, e-mail, ville ou clé…" /></div>
            <select aria-label="Plateforme" value={fPlateforme} onChange={(e) => setFPlateforme(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Plateforme : toutes</option><option value="PC">PC</option><option value="ANDROID">Android</option></select>
            <select aria-label="Licence" value={fLicence} onChange={(e) => setFLicence(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Licence : toutes</option>{Object.entries(STATUTS_LICENCE).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}</select>
            <select aria-label="Ville" value={fVille} onChange={(e) => setFVille(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Ville : toutes</option>{(dest?.villes ?? []).map((v) => <option key={v} value={v}>{v}</option>)}</select>
          </div>
          {chargeDest ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-600" aria-label="Chargement" /></div>
            : <div className="mt-4 max-h-[520px] overflow-auto rounded-xl border"><table className="w-full min-w-[860px] text-left text-sm">
              <thead className="sticky top-0 bg-card"><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="w-10 px-3 py-3"><input type="checkbox" aria-label="Tout cocher" checked={lignes.length > 0 && lignes.every((l) => coches.has(l.id))} onChange={toutCocher} /></th><th className="px-3 py-3">École</th><th className="px-3 py-3">Responsable</th><th className="px-3 py-3">Logiciel</th><th className="px-3 py-3">Licence</th><th className="px-3 py-3">Fin</th><th className="px-3 py-3">Dernière connexion</th></tr></thead>
              <tbody className="divide-y">{lignes.map((l) => {
                const on = coches.has(l.id); const st = STATUTS_LICENCE[l.statut];
                return <tr key={l.id} className={`cursor-pointer ${on ? "bg-orange-500/5" : "hover:bg-secondary/30"}`} onClick={() => cocher(l)}>
                  <td className="px-3 py-3"><input type="checkbox" aria-label={`Cocher ${l.ecole}`} checked={on} onChange={() => cocher(l)} onClick={(e) => e.stopPropagation()} /></td>
                  <td className="px-3 py-3"><p className="font-semibold">{l.ecole || "École non renseignée"}</p><p className="text-xs text-muted-foreground">{[l.ville, l.type === "CLE" ? l.key : null].filter(Boolean).join(" · ") || "—"}</p></td>
                  <td className="px-3 py-3">{l.personne || "—"}{l.email && <span className="block text-xs text-muted-foreground">{l.email}</span>}</td>
                  <td className="px-3 py-3">{l.platforms.map((p) => p === "PC" ? "PC" : "Android").join(" + ") || "—"}</td>
                  <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                  <td className="px-3 py-3">{l.fin ? new Date(l.fin).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{ilYa(l.derniereConnexion)}</td>
                </tr>;
              })}{!lignes.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Aucune école ne correspond à ces critères.</td></tr>}</tbody>
            </table></div>}
          <p className="mt-2 text-xs text-muted-foreground">{lignes.length} sur {dest?.total ?? 0} affichée(s){dest?.tronque ? " (500 au plus : précisez la recherche)" : ""}. Seules les écoles qui ont une clé de licence peuvent être choisies. Ajoutez nom, école et ville d&apos;une clé dans « Gestion des licences ».</p>
        </div>}
      </section>}

      {/* ── Étape 3 : vérifier ── */}
      {etape === 3 && <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
          <h3 className="font-bold">Récapitulatif</h3>
          <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted-foreground">Type</dt><dd className="font-semibold">{kindDe(kind).label}</dd>
            <dt className="text-muted-foreground">Destinataires</dt><dd className="font-semibold">{resume}</dd>
            <dt className="text-muted-foreground">Compte à rebours</dt><dd>{deadline ? `jusqu'au ${deadline.toLocaleString("fr-FR")}${minuteur !== "DATE" ? " (calculé à la publication)" : ""}` : "aucun"}</dd>
            <dt className="text-muted-foreground">À l&apos;échéance</dt><dd className={suspendre && deadline ? "font-semibold text-red-700 dark:text-red-300" : ""}>{deadline ? (suspendre ? "licence suspendue jusqu'à « Paiement reçu »" : "rien ne change") : "—"}</dd>
          </dl>
          {suspendre && deadline && <p className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs"><ShieldAlert className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />Même les anciennes versions du logiciel se bloqueront à leur prochaine vérification de licence. Seules les nouvelles versions montrent le compte à rebours.</p>}
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold">Publication</p>
            <div className="flex flex-wrap gap-2"><Puce actif={quand === "MAINTENANT"} onClick={() => setQuand("MAINTENANT")}>Tout de suite</Puce><Puce actif={quand === "PROGRAMMER"} onClick={() => setQuand("PROGRAMMER")}>Programmer…</Puce></div>
            {quand === "PROGRAMMER" && <Input className="max-w-xs" type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} />}
            <label className="block space-y-1.5 pt-2 text-sm font-semibold">Retirer automatiquement le (facultatif)<Input className="max-w-xs" type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} /></label>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2"><p className="text-sm font-semibold"><Monitor className="mr-1 inline h-4 w-4" aria-hidden="true" />Sur PC</p><Apercu kind={kind} title={title} body={body} buttonLabel={buttonLabel} deadline={deadline} suspend={suspendre} /></div>
          <div className="space-y-2"><p className="text-sm font-semibold"><Smartphone className="mr-1 inline h-4 w-4" aria-hidden="true" />Sur téléphone</p><Apercu telephone kind={kind} title={title} body={body} buttonLabel={buttonLabel} deadline={deadline} suspend={suspendre} /></div>
        </div>
      </section>}

      {/* ── Barre du bas ── */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-stone-900 px-5 py-4 text-white shadow-xl">
        <div className="min-w-0"><p className="text-lg font-extrabold">{etape === 2 && selection ? `${nbCibles} destinataire(s) choisi(s)` : resume}</p><p className="text-xs text-white/70">{(etape === 1 ? erreurEtape1 : etape === 2 ? erreurEtape2 : null) ?? (deadline ? `Compte à rebours jusqu'au ${deadline.toLocaleString("fr-FR")}` : "Sans compte à rebours")}</p></div>
        <span className="flex-1" />
        {etape > 1 && <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => setEtape(etape - 1)}><ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />Retour</Button>}
        {etape < 3 && <Button disabled={etape === 1 ? Boolean(erreurEtape1) : Boolean(erreurEtape2)} onClick={() => setEtape(etape + 1)}>Suivant : {etape === 1 ? "destinataires" : "vérifier"}<ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" /></Button>}
        {etape === 3 && <>
          <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" disabled={!!envoi} onClick={() => void envoyer(false)}>{envoi === "brouillon" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}Enregistrer le brouillon</Button>
          <Button disabled={!!envoi || Boolean(erreurEtape1 || erreurEtape2) || (quand === "PROGRAMMER" && !debut)} onClick={() => void envoyer(true)}>{envoi === "publier" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Megaphone className="mr-1.5 h-4 w-4" aria-hidden="true" />}{quand === "PROGRAMMER" ? "Programmer" : "Publier"}</Button>
        </>}
      </div>
    </div>
  );
}
