"use client";

import { useQuery } from "@tanstack/react-query";
import { api, Plan, SubscriptionRecord } from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth-context";
import { Spinner, StatusBadge } from "../ui-bits";
import { formatFcfa } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { DeveloperContact } from "../developer-contact";
import { ArrowRight, Check, Clock3, KeyRound } from "lucide-react";

export function AccountSubscriptionPage() {
  const { user, subscription, licenseKey, isLoading: authLoading } = useAuth();
  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["plans"], queryFn: () => api.get<Plan[]>("/api/plans"), staleTime: 5 * 60_000,
  });
  const { data: mySubs } = useQuery<SubscriptionRecord[]>({
    queryKey: ["subscriptions"], queryFn: () => api.get<SubscriptionRecord[]>("/api/subscriptions"), enabled: !!user,
  });

  if (authLoading || plansLoading || !user) return <main id="contenu" className="py-24"><Spinner /></main>;

  const pendingSub = mySubs?.find((item) => item.status === "AWAITING_PAYMENT" || item.status === "PENDING");
  const activeSub = mySubs?.find((item) => item.status === "ACTIVE") ?? subscription;

  return (
    <main id="contenu" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Espace client</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Mon abonnement</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Consultez votre formule et contactez le développeur pour obtenir une clé d’activation.</p>
      </header>

      {activeSub && (
        <section className="mb-6 rounded-2xl border border-orange-600/30 bg-orange-600/5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status="ACTIVE" />
            <h2 className="font-semibold">{activeSub.plan.name}</h2>
          </div>
          {activeSub.endDate && <p className="mt-2 text-sm text-muted-foreground">Expire le {new Date(activeSub.endDate).toLocaleDateString("fr-FR")}</p>}
          {licenseKey?.key && <p className="mt-3 flex items-center gap-2 text-sm"><KeyRound className="h-4 w-4 text-orange-700" aria-hidden="true" /> Clé disponible dans votre tableau de bord.</p>}
          <Button className="mt-4 rounded-full" variant="outline" onClick={() => navigate("/compte")}>Voir mon tableau de bord <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
        </section>
      )}

      {pendingSub && (
        <section className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Demande existante</h2>
              <p className="mt-1 text-sm text-muted-foreground">Formule {pendingSub.plan.name} · référence <span className="font-mono">{pendingSub.reference}</span>. Mentionnez cette référence lorsque vous contactez le développeur.</p>
            </div>
          </div>
        </section>
      )}

      <div className="mb-8 grid gap-5 md:grid-cols-2">
        {(plans ?? []).map((plan) => (
          <article key={plan.slug} className={`rounded-3xl border bg-card p-6 ${plan.highlighted ? "border-orange-600 ring-1 ring-orange-600" : ""}`}>
            {plan.highlighted && <span className="mb-3 inline-block rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">Recommandée</span>}
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <p className="mt-4 text-2xl font-extrabold">{formatFcfa(plan.annualPrice)}<span className="text-sm font-normal text-muted-foreground"> / 12 mois</span></p>
            <ul className="mt-4 space-y-2">
              {plan.features.slice(0, 4).map((feature) => <li key={feature} className="flex gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />{feature}</li>)}
            </ul>
          </article>
        ))}
      </div>

      <DeveloperContact />
    </main>
  );
}
