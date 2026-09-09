"use client";

// ── Espace client — tableau de bord + paiements/factures ────
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, PaymentRecord, SubscriptionRecord } from "../api";
import { Link, navigate } from "../router";
import { useAuth } from "../auth-context";
import { Section, StatusBadge, Spinner, ErrorNote } from "../ui-bits";
import { formatDate, formatFcfa } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Download, CreditCard, Receipt, BookOpen, LifeBuoy, Building2, Mail, Phone,
  Globe2, ShieldCheck, Copy, KeyRound, CalendarDays, Clock3, MonitorSmartphone,
  ArrowRight, CircleAlert, UserCircle2, Loader2, CheckCircle2,
} from "lucide-react";

// ── Tableau de bord ──────────────────────────────────────────
export function AccountDashboard() {
  const { user, subscription, licenseKey, isLoading } = useAuth();
  const { data: subs } = useQuery<SubscriptionRecord[]>({
    queryKey: ["subscriptions"],
    queryFn: () => api.get<SubscriptionRecord[]>("/api/subscriptions"),
    enabled: !!user,
  });

  if (isLoading || !user) {
    return (
      <main id="contenu" className="py-24">
        <Spinner />
      </main>
    );
  }

  const totalDurationDays = subscription?.startDate && subscription?.endDate
    ? Math.max(1, Math.ceil((new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime()) / 86_400_000))
    : 0;
  const progress = subscription?.status === "ACTIVE" && totalDurationDays > 0
    ? Math.round((subscription.daysRemaining / totalDurationDays) * 100)
    : 0;

  return (
    <main id="contenu" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Salutation */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
            Espace client
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Bonjour, {user.firstName} 👋
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bienvenue dans votre espace personnel. Tout votre abonnement est réuni ici.
          </p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => navigate("/compte/abonnement")}>
          Gérer mon abonnement <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Bandeau abonnement */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border bg-card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Mon abonnement
            </h2>
            {subscription ? <StatusBadge status={subscription.status} /> : null}
          </div>

          {subscription?.status === "ACTIVE" ? (
            <>
              <div className="mt-4 flex flex-wrap items-baseline gap-2">
                <p className="text-2xl font-extrabold">{subscription.plan.name}</p>
                <span className="text-sm text-muted-foreground">
                  ({subscription.billingCycle === "annual" ? "annuel" : "mensuel"}) · réf. {subscription.reference}
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Début
                  </p>
                  <p className="mt-1 text-sm font-semibold">{formatDate(subscription.startDate)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Expiration
                  </p>
                  <p className="mt-1 text-sm font-semibold">{formatDate(subscription.endDate)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Jours restants
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {subscription.daysRemaining} jour{subscription.daysRemaining > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={progress} aria-label={`Durée d'abonnement restante : ${progress}%`} />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {progress}% de la période restante
                </p>
              </div>
            </>
          ) : subscription ? (
            <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                <CircleAlert className="h-4 w-4" aria-hidden="true" />
                {subscription.status === "AWAITING_PAYMENT"
                  ? "Votre demande d'abonnement attend son paiement."
                  : "Votre abonnement n'est pas encore actif."}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Référence : <span className="font-mono font-semibold">{subscription.reference}</span>
              </p>
              <Button size="sm" className="mt-3 rounded-full" onClick={() => navigate("/compte/abonnement")}>
                Finaliser maintenant
              </Button>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-secondary/60 p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Vous n&apos;avez pas encore d&apos;abonnement actif. Choisissez une formule pour
                activer le logiciel et toute sa puissance.
              </p>
              <Button className="mt-4 rounded-full" onClick={() => navigate("/compte/abonnement")}>
                Choisir mon abonnement
              </Button>
            </div>
          )}
        </div>

        {/* Licence */}
        <div className="rounded-3xl border bg-card p-6 sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <KeyRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Licence logicielle
          </h2>
          {licenseKey ? (
            <>
              <div className="mt-4 rounded-2xl border border-dashed border-emerald-600/50 bg-emerald-600/5 p-4">
                <p className="font-mono text-sm font-bold tracking-wider select-all">{licenseKey.key}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MonitorSmartphone className="h-3.5 w-3.5" aria-hidden="true" />
                  Statut : {licenseKey.status === "ACTIVE" ? "activée sur votre poste" : "prête à être activée"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full rounded-full"
                onClick={() => {
                  navigator.clipboard.writeText(licenseKey.key);
                  toast.success("Clé de licence copiée !");
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Copier la clé
              </Button>
            </>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Votre clé de licence apparaîtra ici dès l&apos;activation de votre abonnement.
            </p>
          )}
          <Button className="mt-4 w-full rounded-full" onClick={() => navigate("/telecharger")}>
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" /> Télécharger le logiciel
          </Button>
        </div>
      </div>

      {/* Actions rapides */}
      <h2 className="mt-10 text-lg font-bold">Actions rapides</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Download, title: "Télécharger le logiciel", text: "Dernière version installable", onClick: () => navigate("/telecharger") },
          { icon: CreditCard, title: "Gérer mon abonnement", text: "Formule, renouvellement", onClick: () => navigate("/compte/abonnement") },
          { icon: Receipt, title: "Voir mes paiements", text: "Historique et factures", onClick: () => navigate("/compte/paiements") },
          { icon: BookOpen, title: "Notice d'utilisation", text: "Documentation complète", onClick: () => navigate("/notice") },
          { icon: LifeBuoy, title: "Contacter le support", text: "Réponse sous 24 h ouvrées", onClick: () => navigate("/support") },
        ].map((a) => (
          <button
            key={a.title}
            onClick={a.onClick}
            className="card-hover rounded-2xl border bg-card p-5 text-left"
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
              <a.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-[15px] font-semibold">{a.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{a.text}</p>
          </button>
        ))}
      </div>

      {/* Informations du compte */}
      <h2 className="mt-10 text-lg font-bold">Mon compte</h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <UserCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Informations personnelles
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nom complet</dt>
              <dd className="font-semibold">{user.firstName} {user.lastName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="flex items-center gap-1.5 font-semibold"><Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />{user.email}</dd>
            </div>
            {user.phone && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd className="flex items-center gap-1.5 font-semibold"><Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />{user.phone}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Rôle</dt>
              <dd className="font-semibold">{user.role === "ADMIN" ? "Administrateur" : user.role === "SUPPORT" ? "Support" : "Utilisateur"}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <Building2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Établissement
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="font-semibold">{user.establishment ?? "Non renseigné"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Pays</dt>
              <dd className="flex items-center gap-1.5 font-semibold"><Globe2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />{user.country ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Appareils autorisés</dt>
              <dd className="font-semibold">
                Formule {subs?.find((s) => s.status === "ACTIVE")?.plan.name ?? "sans abonnement"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}

// ── Paiements & factures ─────────────────────────────────────
const METHOD_LABELS: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
};

export function AccountPaymentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: payments, isLoading } = useQuery<PaymentRecord[]>({
    queryKey: ["payments"],
    queryFn: () => api.get<PaymentRecord[]>("/api/payments"),
    enabled: !!user,
  });

  const pending = (payments ?? []).filter((p) => p.status === "PENDING");

  const confirm = async (paymentId: string) => {
    setError(null);
    try {
      await api.post("/api/payments", { paymentId });
      toast.success("Paiement confirmé — votre abonnement est activé !");
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/compte");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation impossible.");
    }
  };

  if (!user) {
    return (
      <main id="contenu" className="py-24">
        <Spinner />
      </main>
    );
  }

  return (
    <main id="contenu" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Mes paiements & factures</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Historique complet de vos transactions et de vos factures téléchargeables.
      </p>

      <ErrorNote message={error} />

      {pending.length > 0 && (
        <div className="mt-6 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-amber-800 dark:text-amber-300">
            <CircleAlert className="h-5 w-5" aria-hidden="true" /> Paiement(s) en attente de confirmation
          </h2>
          {pending.map((p) => (
            <div key={p.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background/70 p-4">
              <div>
                <p className="text-sm font-semibold">
                  {formatFcfa(p.amount)} — {p.subscription?.plan?.name ?? "Abonnement"}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{p.reference}</p>
              </div>
              <Button size="sm" className="rounded-full" onClick={() => confirm(p.id)} disabled={p.status !== "PENDING"}>
                {p.status === "PENDING" ? (
                  <>J&apos;ai payé — confirmer</>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : (payments ?? []).length === 0 ? (
        <div className="mt-10 rounded-3xl border bg-card p-10 text-center">
          <Receipt className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Aucun paiement pour le moment.</p>
          <Button className="mt-5 rounded-full" onClick={() => navigate("/compte/abonnement")}>
            Souscrire un abonnement
          </Button>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto gspp-scrollbar rounded-2xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Référence</th>
                <th className="px-4 py-3 font-semibold">Formule</th>
                <th className="px-4 py-3 font-semibold">Montant</th>
                <th className="px-4 py-3 font-semibold">Moyen</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-5 py-3 font-semibold">Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(payments ?? []).map((p) => (
                <tr key={p.id} className="transition hover:bg-secondary/40">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold">{p.reference}</td>
                  <td className="px-4 py-3.5">{p.subscription?.plan?.name ?? "—"}</td>
                  <td className="px-4 py-3.5 font-semibold">{formatFcfa(p.amount)}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{METHOD_LABELS[p.method] ?? p.method}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3.5">
                    {p.invoiceNumber ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-primary">
                        <Receipt className="h-3.5 w-3.5" aria-hidden="true" /> {p.invoiceNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        Les factures sont générées automatiquement au format PDF dès la confirmation du paiement.
      </p>
    </main>
  );
}
