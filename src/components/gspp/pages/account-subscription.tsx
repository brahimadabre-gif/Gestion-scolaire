"use client";

// ── Gestion de l'abonnement — souscription et paiement ──────
// Parcours : choisir une formule → confirmer → moyen de paiement
// → paiement → confirmation → activation (clé de licence)
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Plan, SubscriptionRecord } from "../api";
import { navigate, useRoute } from "../router";
import { useAuth } from "../auth-context";
import { Section, Spinner, StatusBadge, ErrorNote } from "../ui-bits";
import { formatFcfa } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Check, ChevronLeft, CircleAlert, Copy, Loader2,
  Smartphone, ArrowRight, KeyRound, PartyPopper, ShieldCheck,
} from "lucide-react";

type Step = 1 | 2 | 3;

// ── Moyens de paiement (architecture ouverte : le PSP réel se branche ici) ──
const PAYMENT_METHODS = [
  { id: "wave", label: "Wave", desc: "QR code ou dépôt sur le +225 07 09 93 33 64", icon: Smartphone },
  { id: "orange_money", label: "Orange Money", desc: "Dépôt sur le +225 07 09 93 33 64", icon: Smartphone },
] as const;

export function AccountSubscriptionPage() {
  const route = useRoute();
  const { user, subscription, licenseKey, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => api.get<Plan[]>("/api/plans"),
    staleTime: 5 * 60_000,
  });

  const { data: mySubs } = useQuery<SubscriptionRecord[]>({
    queryKey: ["subscriptions"],
    queryFn: () => api.get<SubscriptionRecord[]>("/api/subscriptions"),
    enabled: !!user,
  });

  const pendingSub = mySubs?.find((s) => s.status === "AWAITING_PAYMENT" || s.status === "PENDING");
  const activeSub = mySubs?.find((s) => s.status === "ACTIVE");

  // État du parcours
  const [step, setStep] = useState<Step>(1);
  const [planSlug, setPlanSlug] = useState<string>(route.query.formule ?? "professionnel");
  const billingCycle = "annual" as const;
  const [method, setMethod] = useState<string>("wave");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activated, setActivated] = useState<{ license?: string | null } | null>(null);

  const selectedPlan = plans?.find((p) => p.slug === planSlug);
  const amount = selectedPlan?.annualPrice ?? 0;

  if (authLoading || plansLoading || !user) {
    return (
      <main id="contenu" className="py-24">
        <Spinner />
      </main>
    );
  }

  // ── Créer la demande d'abonnement ──────────────────────────
  const createSubscription = async () => {
    setError(null);
    setCreating(true);
    try {
      await api.post("/api/subscriptions", { planSlug, billingCycle, method, phoneMsisdn: "" });
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setStep(3);
      toast.success("Demande créée — suivez les instructions de paiement.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  // Le paiement est vérifié manuellement après réception de la preuve.
  const contactAfterPayment = () => {
    window.open("https://wa.me/2250709933364", "_blank", "noopener,noreferrer");
  };

  // ── Écran de félicitations après activation ────────────────
  if (activated) {
    return (
      <main id="contenu" className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600/15">
          <PartyPopper className="h-10 w-10 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Félicitations {user.firstName} !</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Votre abonnement <strong className="text-foreground">{selectedPlan?.name}</strong> est maintenant
          <strong className="text-emerald-700 dark:text-emerald-400"> actif</strong>. Votre clé de licence est prête.
        </p>
        {activated.license && (
          <div className="mt-6 w-full rounded-2xl border border-dashed border-emerald-600/50 bg-emerald-600/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Votre clé de licence</p>
            <p className="mt-2 font-mono text-lg font-bold tracking-wider select-all">{activated.license}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 rounded-full"
              onClick={() => {
                navigator.clipboard.writeText(activated.license ?? "");
                toast.success("Clé copiée !");
              }}
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Copier
            </Button>
          </div>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="rounded-full" onClick={() => navigate("/telecharger")}>
            Télécharger le logiciel <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </Button>
          <Button size="lg" variant="outline" className="rounded-full" onClick={() => navigate("/compte")}>
            Aller à mon tableau de bord
          </Button>
        </div>
      </main>
    );
  }

  // ── Demande en attente : écran de paiement ─────────────────
  if (pendingSub) {
    const payment = pendingSub.payments?.find((p) => p.status === "PENDING");
    const pendingPlan = pendingSub.plan;
    const pendingAmount = payment?.amount ?? 0;
    return (
      <main id="contenu" className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Button variant="ghost" size="sm" className="mb-5 -ml-2 rounded-full" onClick={() => navigate("/compte/abonnement")}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Retour
        </Button>

        {/* Fil d'étapes */}
        <ol className="mb-8 flex items-center gap-2 text-xs font-semibold" aria-label="Étapes du paiement">
          {["Formule", "Confirmation", "Paiement", "Activation"].map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                i < 3 ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
              )}>{i < 3 ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : 4}</span>
              <span className={i < 3 ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              {i < 3 && <span className="mx-1 h-px w-4 bg-border sm:w-8" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <div className="rounded-3xl border bg-card p-7 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">Finalisez votre paiement</h1>
            <StatusBadge status="AWAITING_PAYMENT" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Formule <strong>{pendingPlan.name}</strong> ({pendingSub.billingCycle === "annual" ? "annuelle" : "mensuelle"}) ·
            Référence <span className="font-mono font-semibold">{pendingSub.reference}</span>
          </p>
          <p className="mt-4 rounded-2xl bg-secondary/60 p-4 text-center">
            <span className="text-3xl font-extrabold">{formatFcfa(pendingAmount)}</span>
          </p>

          <Separator className="my-6" />

          {/* Instructions selon le moyen de paiement choisi */}
          {payment?.method === "wave" ? (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Smartphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Paiement par Wave
              </h2>
              <ol className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">1</span>
                  Scannez le QR code Wave ci-dessous ou ouvrez l&apos;application Wave.
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">2</span>
                  Vous pouvez aussi effectuer un dépôt sur le numéro indiqué.
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">3</span>
                  Envoyez ensuite votre nom, prénom et la preuve du dépôt par WhatsApp ou appelez le développeur.
                </li>
              </ol>
              <img src="/wave-qr.png" alt="QR code Wave pour payer l'abonnement" className="mx-auto max-h-72 w-auto rounded-2xl border bg-white p-2" />
              <div className="grid gap-3 rounded-2xl border bg-background p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dépôt Wave</p>
                  <p className="mt-1 font-mono text-lg font-bold">+225 07 09 93 33 64</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Montant</p>
                  <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatFcfa(pendingAmount)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
                  <a className="mt-1 block font-semibold text-emerald-700 hover:underline" href="https://wa.me/2250709933364">WhatsApp / appel</a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Smartphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                Paiement par Orange Money
              </h2>
              <ol className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">1</span>Effectuez un dépôt Orange Money de {formatFcfa(pendingAmount)} sur le numéro indiqué.</li>
                <li className="flex gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">2</span>Envoyez votre nom, prénom et la preuve du dépôt par WhatsApp ou appelez le développeur.</li>
              </ol>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Numéro Orange Money</p>
                <p className="mt-1 font-mono text-xl font-bold">+225 07 09 93 33 64</p>
                <p className="mt-3 text-sm"><strong>Montant :</strong> {formatFcfa(pendingAmount)}</p>
                <a className="mt-3 inline-block font-semibold text-emerald-700 hover:underline" href="https://wa.me/2250709933364">Envoyer la preuve par WhatsApp / appeler</a>
              </div>
            </div>
          )}

          <ErrorNote message={error} />

          <Button
            size="lg"
            className="mt-6 w-full rounded-full text-base"
            onClick={contactAfterPayment}
            disabled={payment?.status !== "PENDING"}
          >
            <Smartphone className="mr-2 h-4 w-4" aria-hidden="true" /> J&apos;ai payé — envoyer la preuve par WhatsApp
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Activation après vérification · Référence : {payment?.reference}
          </p>
        </div>
      </main>
    );
  }

  // ── Parcours normal : choix formule → cycle/moyen → récap ──
  return (
    <main id="contenu" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Gérer mon abonnement</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {activeSub
          ? `Votre abonnement ${activeSub.plan.name} est actif. Vous pouvez souscrire un changement de formule : le paiement prolongera simplement votre période.`
          : "Choisissez la formule adaptée à votre établissement. Activation immédiate après le paiement."}
      </p>

      {activeSub && licenseKey && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-5">
          <StatusBadge status="ACTIVE" />
          <p className="text-sm">
            <strong>{activeSub.plan.name}</strong> · expire le {activeSub.endDate && new Date(activeSub.endDate).toLocaleDateString("fr-FR")} ·
            <span className="text-emerald-700 dark:text-emerald-400"> {activeSub.daysRemaining ?? Math.ceil(((new Date(activeSub.endDate ?? "").getTime()) - Date.now()) / 86_400_000)} jours restants</span>
          </p>
        </div>
      )}

      <ErrorNote message={error} />

      {/* Fil d'étapes */}
      <ol className="mb-8 mt-8 flex items-center gap-2 text-xs font-semibold" aria-label="Étapes">
        {["Formule", "Options", "Paiement", "Activation"].map((label, i) => {
          const state = i + 1 < step ? "done" : i + 1 === step ? "current" : "todo";
          return (
            <li key={label} className="flex items-center gap-2">
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                state === "done" && "bg-emerald-600 text-white",
                state === "current" && "bg-emerald-600/15 text-emerald-700 ring-2 ring-emerald-600 dark:text-emerald-400",
                state === "todo" && "bg-muted text-muted-foreground"
              )}>
                {state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className={state === "todo" ? "text-muted-foreground" : "text-foreground"}>{label}</span>
              {i < 3 && <span className="mx-1 h-px w-4 bg-border sm:w-8" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="grid gap-5 lg:grid-cols-3">
          {(plans ?? []).map((plan) => (
            <button
              key={plan.slug}
              type="button"
              onClick={() => { setPlanSlug(plan.slug); setStep(2); }}
              aria-pressed={planSlug === plan.slug}
              className={cn(
                "card-hover rounded-3xl border bg-card p-6 text-left",
                plan.highlighted && "border-emerald-600 ring-1 ring-emerald-600"
              )}
            >
              {plan.highlighted && (
                <span className="mb-3 inline-block rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white">
                  Recommandée
                </span>
              )}
              <h2 className="text-lg font-bold">{plan.name}</h2>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-4 text-2xl font-extrabold">
                {formatFcfa(plan.annualPrice)}<span className="text-sm font-normal text-muted-foreground"> / 12 mois</span>
              </p>
              <ul className="mt-4 space-y-1.5">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[13px] text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold">
                Choisir {plan.name} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && selectedPlan && (
        <div className="mx-auto max-w-xl rounded-3xl border bg-card p-7 sm:p-8">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 rounded-full" onClick={() => setStep(1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Changer de formule
          </Button>
          <h2 className="text-xl font-bold">Options de souscription</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Formule choisie : <strong className="text-foreground">{selectedPlan.name}</strong>
          </p>

          {/* Abonnement annuel unique */}
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">Période de facturation</legend>
            <div className="mt-3 rounded-2xl border border-emerald-600 bg-emerald-600/5 p-4 ring-1 ring-emerald-600">
              <p className="text-sm font-semibold">12 mois</p>
              <p className="text-xs text-muted-foreground">{formatFcfa(selectedPlan.annualPrice)} pour 12 mois d&apos;accès</p>
            </div>
          </fieldset>

          {/* Moyen de paiement */}
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">Moyen de paiement</legend>
            <RadioGroup value={method} onValueChange={setMethod} className="mt-3 space-y-3">
              {PAYMENT_METHODS.map((m) => (
                <Label
                  key={m.id}
                  htmlFor={`pay-${m.id}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition",
                    method === m.id && "border-emerald-600 bg-emerald-600/5 ring-1 ring-emerald-600"
                  )}
                >
                  <RadioGroupItem id={`pay-${m.id}`} value={m.id} />
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                    <m.icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.desc}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          {/* Récapitulatif */}
          <div className="mt-6 rounded-2xl bg-secondary/60 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Formule {selectedPlan.name}</span>
              <span className="font-semibold">{formatFcfa(amount)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Période</span>
              <span className="font-semibold">12 mois</span>
            </div>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full rounded-full text-base"
            onClick={createSubscription}
            disabled={creating}
          >
            {creating ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> Création…</>
            ) : (
              <><KeyRound className="mr-2 h-4 w-4" aria-hidden="true" /> Confirmer et procéder au paiement</>
            )}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Aucune donnée bancaire n&apos;est stockée sur ce site.
          </p>
          {pendingSub && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Vous avez une demande en attente : l&apos;écran de paiement va s&apos;afficher après confirmation.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="mx-auto max-w-xl rounded-3xl border bg-card p-8 text-center">
          <Spinner className="py-6" />
          <p className="text-sm text-muted-foreground">
            Redirection vers l&apos;écran de paiement…
          </p>
        </div>
      )}
    </main>
  );
}
