"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { formatDate } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, Clipboard, Download, Eye, KeyRound, Loader2, Search, ShieldAlert, X } from "lucide-react";

type LicenseStatus = "AVAILABLE" | "ACTIVE" | "EXPIRED" | "REVOKED";
interface LicenseRow {
  id: string;
  key: string;
  status: LicenseStatus;
  createdAt: string;
  validityMonths: number | null;
  activatedAt: string | null;
  expiresAt: string | null;
  deviceFingerprint: string | null;
  maxDevices: number;
  user: { firstName: string; lastName: string; email: string; establishment: string | null } | null;
  subscription: { status: string; plan: { name: string } } | null;
}
interface LicenseResponse { items: LicenseRow[]; truncated: boolean }

const statusLabels: Record<LicenseStatus, string> = {
  AVAILABLE: "Disponible", ACTIVE: "Activée", EXPIRED: "Expirée", REVOKED: "Révoquée",
};
const durationPresets = [
  { value: "1", label: "1 mois" }, { value: "3", label: "3 mois" },
  { value: "6", label: "6 mois" }, { value: "12", label: "1 an" },
  { value: "24", label: "2 ans" }, { value: "36", label: "3 ans" },
  { value: "60", label: "5 ans" },
];
const durationLabel = (months: number | null) => {
  if (!months) return "Abonnement";
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return [years ? `${years} an${years > 1 ? "s" : ""}` : "", remainder ? `${remainder} mois` : ""].filter(Boolean).join(" ");
};
const dateLabel = (value: string | null) => value ? formatDate(value) : "—";
const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function AdminLicenses() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("createdAt");
  const [direction, setDirection] = useState("desc");
  const [count, setCount] = useState("1");
  const [duration, setDuration] = useState("12");
  const [customMonths, setCustomMonths] = useState("1");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [details, setDetails] = useState<LicenseRow | null>(null);

  const durationMonths = duration === "custom" ? Number(customMonths) : Number(duration);
  const query = new URLSearchParams({ q: search, status, sort, direction });
  const { data, isLoading, isError, refetch } = useQuery<LicenseResponse>({
    queryKey: ["admin", "licenses", search, status, sort, direction],
    queryFn: () => api.get<LicenseResponse>(`/api/admin/licenses?${query.toString()}`),
  });
  const rows = data?.items ?? [];
  const selectableRows = useMemo(() => rows.map((row) => row.id), [rows]);
  const allSelected = selectableRows.length > 0 && selectableRows.every((id) => selected.includes(id));

  const copy = async (value: string, success = "Code copié.") => {
    try { await navigator.clipboard.writeText(value); toast.success(success); }
    catch { toast.error("Copie impossible dans ce navigateur."); }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const result = await api.post<{ codes: string[] }>("/api/admin/licenses", { count: Number(count), durationMonths });
      setGeneratedCodes(result.codes);
      setSelected([]);
      await queryClient.invalidateQueries({ queryKey: ["admin", "licenses"] });
      toast.success(`${result.codes.length} code(s) généré(s).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Génération impossible.");
    } finally { setGenerating(false); }
  };

  const revoke = async (license: LicenseRow) => {
    if (!window.confirm(`Révoquer ${license.key} ? Cette action désactivera immédiatement la licence et ne peut pas être annulée.`)) return;
    try {
      await api.patch(`/api/admin/licenses/${license.id}`, { action: "revoke" });
      toast.success("Licence révoquée.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "licenses"] });
      setDetails(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Révocation impossible."); }
  };

  const exportCsv = (items: LicenseRow[]) => {
    const header = ["Code d'activation", "Création", "Durée", "Client", "E-mail", "Activation", "Expiration", "Statut", "Installation"];
    const lines = items.map((item) => [item.key, item.createdAt, durationLabel(item.validityMonths), item.user ? `${item.user.firstName} ${item.user.lastName}` : "", item.user?.email ?? "", item.activatedAt ?? "", item.expiresAt ?? "", statusLabels[item.status], item.deviceFingerprint ?? ""].map(csvCell).join(","));
    const blob = new Blob(["\uFEFF", [header.map(csvCell).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `licences-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleRow = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const exportRows = selected.length ? rows.filter((item) => selected.includes(item.id)) : rows;

  return <div className="space-y-6">
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><KeyRound className="h-5 w-5" aria-hidden="true" /></span>
        <div><h2 className="text-lg font-bold">Générer des codes d’activation</h2><p className="mt-1 text-sm text-muted-foreground">Les codes commencent leur durée à la première activation dans le logiciel. Chaque code est limité à une installation.</p></div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="space-y-1.5 text-sm font-medium">Durée de validité
          <select value={duration} onChange={(event) => setDuration(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {durationPresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
            <option value="custom">Personnalisée</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Nombre de codes
          <Input type="number" min={1} max={100} step={1} value={count} onChange={(event) => setCount(event.target.value)} />
        </label>
        {duration === "custom" ? <label className="space-y-1.5 text-sm font-medium">Durée personnalisée (mois)
          <Input type="number" min={1} max={600} step={1} value={customMonths} onChange={(event) => setCustomMonths(event.target.value)} />
        </label> : <div className="flex items-end"><Button className="w-full rounded-full" disabled={!Number.isInteger(Number(count)) || Number(count) < 1 || Number(count) > 100} onClick={() => { setGeneratedCodes([]); setConfirmOpen(true); }}><KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />GÉNÉRER LES CODES</Button></div>}
      </div>
      {duration === "custom" && <Button className="mt-4 rounded-full" disabled={!Number.isInteger(Number(count)) || Number(count) < 1 || Number(count) > 100 || !Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 600} onClick={() => { setGeneratedCodes([]); setConfirmOpen(true); }}><KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />GÉNÉRER LES CODES</Button>}
    </section>

    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold">Codes d’activation</h2><p className="text-sm text-muted-foreground">Recherche, suivi, révocation et export des licences.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" disabled={!rows.length} onClick={() => copy(exportRows.map((item) => item.key).join("\n"), `${exportRows.length} code(s) copié(s).`)}><Clipboard className="mr-2 h-4 w-4" aria-hidden="true" />Copier {selected.length ? `(${selected.length})` : "les codes"}</Button>
          <Button variant="outline" className="rounded-full" disabled={!rows.length} onClick={() => exportCsv(exportRows)}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Exporter CSV {selected.length ? `(${selected.length})` : ""}</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="pl-9" value={search} onChange={(event) => { setSelected([]); setSearch(event.target.value); }} placeholder="Rechercher un code ou un client" /></div>
        <select aria-label="Filtrer par statut" value={status} onChange={(event) => { setSelected([]); setStatus(event.target.value); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Tous les statuts</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="Trier les codes" value={sort} onChange={(event) => { setSelected([]); setSort(event.target.value); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="createdAt">Date de création</option><option value="activatedAt">Date d’activation</option><option value="expiresAt">Date d’expiration</option><option value="status">Statut</option><option value="key">Code</option></select>
        <Button variant="outline" className="rounded-full" onClick={() => { setSelected([]); setDirection((value) => value === "asc" ? "desc" : "asc"); }}>{direction === "asc" ? "Croissant" : "Décroissant"}</Button>
      </div>
      {data?.truncated && <p className="mt-3 text-xs text-amber-700">La liste affiche les 2 000 codes les plus récents; précisez votre recherche pour affiner.</p>}
      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Chargement" /></div>
        : isError ? <div className="flex items-center justify-between gap-3 py-10 text-sm text-destructive"><span>Impossible de charger les licences.</span><Button variant="outline" onClick={() => void refetch()}>Réessayer</Button></div>
        : <div className="mt-4 overflow-x-auto rounded-xl border"><table className="w-full min-w-[980px] text-left text-sm">
          <thead><tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><th className="w-10 px-3 py-3"><input aria-label="Tout sélectionner" type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? selected.filter((id) => !selectableRows.includes(id)) : [...new Set([...selected, ...selectableRows])])} /></th><th className="px-3 py-3">Code d’activation</th><th className="px-3 py-3">Création · durée</th><th className="px-3 py-3">Client</th><th className="px-3 py-3">Activation · expiration</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y">{rows.map((item) => <tr key={item.id} className="hover:bg-secondary/30">
            <td className="px-3 py-3"><input aria-label={`Sélectionner ${item.key}`} type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleRow(item.id)} /></td>
            <td className="px-3 py-3 font-mono text-xs font-semibold">{item.key}</td>
            <td className="px-3 py-3">{dateLabel(item.createdAt)}<span className="block text-xs text-muted-foreground">{durationLabel(item.validityMonths)}</span></td>
            <td className="px-3 py-3">{item.user ? <><span>{item.user.firstName} {item.user.lastName}</span><span className="block text-xs text-muted-foreground">{item.user.email}</span></> : <span className="text-muted-foreground">Non associé</span>}</td>
            <td className="px-3 py-3">{dateLabel(item.activatedAt)}<span className="block text-xs text-muted-foreground">{dateLabel(item.expiresAt)}</span></td>
            <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "AVAILABLE" ? "bg-sky-500/10 text-sky-700 dark:text-sky-300" : item.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : item.status === "EXPIRED" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-destructive/10 text-destructive"}`}>{statusLabels[item.status]}</span></td>
            <td className="px-3 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label={`Copier ${item.key}`} onClick={() => void copy(item.key)}><Clipboard className="h-4 w-4" aria-hidden="true" /></Button><Button variant="ghost" size="icon" aria-label={`Détails ${item.key}`} onClick={() => setDetails(item)}><Eye className="h-4 w-4" aria-hidden="true" /></Button>{(item.status === "AVAILABLE" || item.status === "ACTIVE") && <Button variant="ghost" size="icon" aria-label={`Révoquer ${item.key}`} className="text-destructive" onClick={() => void revoke(item)}><ShieldAlert className="h-4 w-4" aria-hidden="true" /></Button>}</div></td>
          </tr>)}{!rows.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Aucun code ne correspond à ces critères.</td></tr>}</tbody>
        </table></div>}
    </section>

    <Dialog open={confirmOpen} onOpenChange={(open) => { if (!generating) setConfirmOpen(open); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{generatedCodes.length ? "Codes générés" : "Confirmer la génération"}</DialogTitle><DialogDescription>{generatedCodes.length ? "Copiez ou exportez les codes; ils sont aussi consultables dans la liste des licences." : `Vous allez générer ${count} code(s) à usage unique, valable(s) ${durationLabel(durationMonths)} à partir de la première activation.`}</DialogDescription></DialogHeader>
        {generatedCodes.length ? <div className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-sm">{generatedCodes.map((code) => <div key={code} className="py-1">{code}</div>)}</div> : <div className="rounded-xl bg-emerald-500/5 p-4 text-sm"><strong>{count} code(s)</strong><span className="block text-muted-foreground">Durée de validité : {durationLabel(durationMonths)}. L’expiration sera calculée par le serveur au premier démarrage autorisé.</span></div>}
        <DialogFooter>{generatedCodes.length ? <><Button variant="outline" onClick={() => { const generatedRows: LicenseRow[] = generatedCodes.map((key) => ({ id: key, key, status: "AVAILABLE", createdAt: new Date().toISOString(), validityMonths: durationMonths, activatedAt: null, expiresAt: null, deviceFingerprint: null, maxDevices: 1, user: null, subscription: null })); exportCsv(generatedRows); }}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Télécharger CSV</Button><Button onClick={() => void copy(generatedCodes.join("\n"), `${generatedCodes.length} codes copiés.`)}><Clipboard className="mr-2 h-4 w-4" aria-hidden="true" />Copier les codes</Button></> : <><Button variant="outline" onClick={() => setConfirmOpen(false)}>Annuler</Button><Button onClick={() => void generate()} disabled={generating}>{generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Confirmer et générer</Button></>}</DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!details} onOpenChange={(open) => { if (!open) setDetails(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Détails de la licence</DialogTitle><DialogDescription>Informations de création, d’activation et d’installation.</DialogDescription></DialogHeader>
        {details && <dl className="grid grid-cols-[minmax(120px,0.7fr)_1fr] gap-x-4 gap-y-3 text-sm"><dt className="text-muted-foreground">Code</dt><dd className="break-all font-mono">{details.key}</dd><dt className="text-muted-foreground">Statut</dt><dd>{statusLabels[details.status]}</dd><dt className="text-muted-foreground">Durée</dt><dd>{durationLabel(details.validityMonths)}</dd><dt className="text-muted-foreground">Création</dt><dd>{dateLabel(details.createdAt)}</dd><dt className="text-muted-foreground">Première activation</dt><dd>{dateLabel(details.activatedAt)}</dd><dt className="text-muted-foreground">Expiration</dt><dd>{dateLabel(details.expiresAt)}</dd><dt className="text-muted-foreground">Client</dt><dd>{details.user ? `${details.user.firstName} ${details.user.lastName} · ${details.user.email}` : "Non associé"}</dd><dt className="text-muted-foreground">Installation</dt><dd className="break-all font-mono text-xs">{details.deviceFingerprint ?? "Non activée"}</dd></dl>}
        <DialogFooter>{details && (details.status === "AVAILABLE" || details.status === "ACTIVE") && <Button variant="destructive" onClick={() => void revoke(details)}><X className="mr-2 h-4 w-4" aria-hidden="true" />Révoquer</Button>}<Button variant="outline" onClick={() => setDetails(null)}><Check className="mr-2 h-4 w-4" aria-hidden="true" />Fermer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
