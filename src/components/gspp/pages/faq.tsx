"use client";

// ── Page FAQ — accordéon par catégories, recherche simple ──
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, FaqItem } from "../api";
import { Link } from "../router";
import { PageHero } from "../page-hero";
import { Section, Spinner } from "../ui-bits";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  general: "Général",
  compte: "Compte",
  abonnement: "Abonnement",
  logiciel: "Logiciel",
  support: "Support",
};

export function FaqPage() {
  const [search, setSearch] = useState("");
  const { data: faqs, isLoading } = useQuery<FaqItem[]>({
    queryKey: ["faqs", "all"],
    queryFn: () => api.get<FaqItem[]>("/api/faqs"),
    staleTime: 5 * 60_000,
  });

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = (faqs ?? []).filter(
      (f) => !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
    const groups: Record<string, FaqItem[]> = {};
    for (const f of items) {
      (groups[f.category] ??= []).push(f);
    }
    return groups;
  }, [faqs, search]);

  return (
    <main id="contenu">
      <PageHero
        eyebrow="FAQ"
        title="Questions fréquentes"
        description="Les réponses aux questions les plus posées sur le logiciel, les comptes et les abonnements."
      />

      <Section>
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une question…"
              className="h-12 rounded-2xl pl-11 text-base"
              aria-label="Rechercher dans la FAQ"
            />
          </div>

          {isLoading ? (
            <Spinner />
          ) : (
            <div className="mt-10 space-y-10">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
                    {CATEGORY_LABELS[category] ?? category}
                  </h2>
                  <Accordion type="single" collapsible>
                    {items.map((f) => (
                      <AccordionItem key={f.id} value={f.id}>
                        <AccordionTrigger className="text-left text-[15px] font-semibold">
                          {f.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                          {f.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
              {!isLoading && Object.keys(grouped).length === 0 && (
                <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
                  Aucune question ne correspond à « {search} ». Essayez un autre mot-clé ou
                  <Link to="/support" className="font-semibold text-primary hover:underline"> contactez le support</Link>.
                </p>
              )}
            </div>
          )}

          <div className="mt-12 rounded-3xl bg-secondary/60 p-6 text-center sm:p-8">
            <h2 className="text-lg font-bold">Vous ne trouvez pas votre réponse ?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Le Centre d&apos;aide vous permet d&apos;envoyer une demande au support en deux minutes.
            </p>
            <Link
              to="/support"
              className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Contacter le support
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}
