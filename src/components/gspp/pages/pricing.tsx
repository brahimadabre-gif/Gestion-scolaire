"use client";

// ── Page Tarifs — comparaison des offres + FAQ abonnements ──
import { useQuery } from "@tanstack/react-query";
import { api, FaqItem, Plan } from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth-context";
import { PageHero } from "../page-hero";
import { Section, SectionHeading, Spinner } from "../ui-bits";
import { formatFcfa } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Minus, ShieldCheck, RefreshCcw, Smartphone } from "lucide-react";

export function PricingPage() {
  const { user } = useAuth();
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => api.get<Plan[]>("/api/plans"),
    staleTime: 5 * 60_000,
  });
  const { data: faqs } = useQuery<FaqItem[]>({
    queryKey: ["faqs", "all"],
    queryFn: () => api.get<FaqItem[]>("/api/faqs"),
    staleTime: 5 * 60_000,
  });

  const abonnementFaqs = (faqs ?? []).filter((f) => ["abonnement", "general"].includes(f.category));

  return (
    <main id="contenu">
      <PageHero
        eyebrow="Nos abonnements"
        title="Des tarifs simples, sans surprise"
        description="L'abonnement coûte 15 000 FCFA pour 12 mois. Payez par Wave ou Orange Money, puis envoyez la preuve du dépôt."
      >
        <p className="text-center text-sm font-semibold text-emerald-700 dark:text-emerald-400">15 000 FCFA pour 12 mois</p>
      </PageHero>

      {/* Cartes de formules */}
      <Section>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="flex justify-center gap-6">
            {(plans ?? []).map((plan) => {
              const price = plan.annualPrice;
              const period = " / 12 mois";
              return (
                <article
                  key={plan.slug}
                  className={`relative flex w-full max-w-xl flex-col rounded-2xl border bg-card p-7 ${
                    plan.highlighted
                      ? "border-emerald-600 shadow-xl shadow-emerald-600/10 ring-1 ring-emerald-600"
                      : "card-hover"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white shadow">
                      Recommandée
                    </span>
                  )}
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  <p className="mt-1.5 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-5">
                    <span className="text-4xl font-extrabold tracking-tight">{formatFcfa(price)}</span>
                    <span className="text-sm text-muted-foreground"> {period}</span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Accès pendant 12 mois
                  </p>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-7 w-full rounded-full"
                    size="lg"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => {
                      if (user) navigate(`/compte/abonnement?formule=${plan.slug}&cycle=annual`);
                      else navigate(`/inscription?formule=${plan.slug}`);
                    }}
                  >
                    Choisir cette offre
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </Section>

      {/* Réassurance */}
      <Section className="bg-secondary/40 py-14">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: Smartphone, title: "Paiement Wave ou Orange Money", text: "Payez 15 000 FCFA par QR Wave ou dépôt sur le +225 07 09 93 33 64, puis envoyez la preuve." },
            { icon: RefreshCcw, title: "Renouvellement simple", text: "Chaque renouvellement ajoute 12 mois à la durée restante : aucun jour perdu." },
            { icon: ShieldCheck, title: "Garantie satisfait", text: "Une question ? Le support répond sous 24 h ouvrées. Vos données restent sur votre poste." },
          ].map((r) => (
            <div key={r.title} className="flex items-start gap-4 rounded-2xl border bg-card p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                <r.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Tableau comparatif */}
      <Section>
        <SectionHeading
          eyebrow="Comparaison"
          title="Comparez les formules en détail"
        />
        <div className="mx-auto mt-10 max-w-5xl overflow-x-auto gspp-scrollbar rounded-2xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-5 py-3.5 font-semibold">Fonctionnalité</th>
                {(plans ?? []).map((p) => (
                  <th key={p.slug} className="px-4 py-3.5 text-center font-semibold">
                    {p.name}
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
              {formatFcfa(p.annualPrice)} / 12 mois
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-5 py-3 font-medium">Établissements</td>
                {(plans ?? []).map((p) => (
                  <td key={p.slug} className="px-4 py-3 text-center">{p.maxSchools}</td>
                ))}
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium">Limite d&apos;élèves</td>
                {(plans ?? []).map((p) => (
                  <td key={p.slug} className="px-4 py-3 text-center">{p.maxStudents.toLocaleString("fr-FR")}</td>
                ))}
              </tr>
              {[
                "Gestion des élèves et classes",
                "Notes et moyennes automatiques",
                "Bulletins scolaires",
                "Classements et compositions",
                "Import intelligent de documents",
                "Signatures électroniques",
                "Rapports et statistiques",
                "Multi-établissements",
                "Support prioritaire",
              ].map((feature) => (
                <tr key={feature}>
                  <td className="px-5 py-3 font-medium">{feature}</td>
                  {(plans ?? []).map((p) => {
                    const included =
                      p.features.some((f) => f.toLowerCase().includes(feature.toLowerCase().split(" ")[0])) ||
                      (feature === "Multi-établissements" && p.maxSchools > 1);
                    return (
                      <td key={p.slug} className="px-4 py-3 text-center">
                        {included ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-label="Inclus" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="Non inclus" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* FAQ abonnements */}
      <Section className="bg-secondary/40">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Vos questions sur les abonnements" />
          <Accordion type="single" collapsible className="mt-10">
            {abonnementFaqs.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="text-left text-[15px] font-semibold">{f.question}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>
    </main>
  );
}
