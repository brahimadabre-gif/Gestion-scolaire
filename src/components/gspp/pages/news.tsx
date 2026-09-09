"use client";

// ── Actualités & nouveautés — liste et article ───────────────
import { useQuery } from "@tanstack/react-query";
import { api, Article } from "../api";
import { Link, navigate, useRoute } from "../router";
import { PageHero } from "../page-hero";
import { Section, Spinner, ErrorNote } from "../ui-bits";
import { formatDate } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, CalendarDays } from "lucide-react";

const CATEGORY_STYLES: Record<string, { label: string; cls: string }> = {
  version: { label: "Nouvelle version", cls: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" },
  annonce: { label: "Annonce", cls: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  correction: { label: "Correction", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-500" },
  tutoriel: { label: "Tutoriel", cls: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  conseils: { label: "Conseils", cls: "bg-rose-500/10 text-rose-700 dark:text-rose-400" },
};

export function NewsListPage() {
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["articles", "all"],
    queryFn: () => api.get<Article[]>("/api/articles"),
    staleTime: 2 * 60_000,
  });

  const [featured, ...rest] = articles ?? [];

  return (
    <main id="contenu">
      <PageHero
        eyebrow="Actualités & nouveautés"
        title="Le logiciel évolue avec vous"
        description="Nouvelles fonctionnalités, nouvelles versions, corrections, tutoriels et conseils : suivez la vie de Gestion Scolaire Pro Plus."
      />

      <Section>
        {isLoading ? (
          <Spinner />
        ) : !featured ? (
          <p className="text-center text-muted-foreground">Aucun article publié pour le moment.</p>
        ) : (
          <div className="space-y-10">
            {/* Article à la une */}
            <article className="card-hover grid cursor-pointer gap-6 rounded-3xl border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]" onClick={() => navigate(`/actualites?article=${featured.slug}`)}>
              <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600/10 to-amber-500/10 py-14">
                <span className="text-7xl" aria-hidden="true">{featured.coverEmoji}</span>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/10">
                    {CATEGORY_STYLES[featured.category]?.label ?? featured.category}
                  </Badge>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDate(featured.publishedAt)}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{featured.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{featured.excerpt}</p>
                <span className="mt-5 text-sm font-semibold text-primary">Lire l&apos;article →</span>
              </div>
            </article>

            {/* Autres articles */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <article key={a.id} className="card-hover flex flex-col rounded-2xl border bg-card p-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xl" aria-hidden="true">{a.coverEmoji}</span>
                    <Badge className={`rounded-full hover:opacity-90 ${CATEGORY_STYLES[a.category]?.cls ?? ""}`}>
                      {CATEGORY_STYLES[a.category]?.label ?? a.category}
                    </Badge>
                  </div>
                  <h2 className="mt-4 text-[17px] font-semibold leading-snug">
                    <Link to={`/actualites?article=${a.slug}`} className="transition-colors hover:text-primary">
                      {a.title}
                    </Link>
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
                  <p className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                    {formatDate(a.publishedAt)}
                    <Link to={`/actualites?article=${a.slug}`} className="font-semibold text-primary hover:underline">
                      Lire →
                    </Link>
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </Section>
    </main>
  );
}

// ── Page article ─────────────────────────────────────────────
export function NewsArticlePage({ slug }: { slug: string }) {
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: ["article", slug],
    queryFn: () => api.get<Article>(`/api/articles/${slug}`),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <main id="contenu" className="py-24">
        <Spinner />
      </main>
    );
  }
  if (error || !article) {
    return (
      <main id="contenu" className="mx-auto max-w-2xl px-4 py-24">
        <ErrorNote message="Article introuvable ou non publié." />
        <div className="mt-6 text-center">
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/actualites")}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Retour aux actualités
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main id="contenu">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/actualites" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Toutes les actualités
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Badge className={`rounded-full ${CATEGORY_STYLES[article.category]?.cls ?? ""}`}>
            {CATEGORY_STYLES[article.category]?.label ?? article.category}
          </Badge>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Publié le {formatDate(article.publishedAt)}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 border-l-4 border-emerald-600 pl-4 text-lg leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        <div className="my-8 flex items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600/10 to-amber-500/10 py-16">
          <span className="text-8xl" aria-hidden="true">{article.coverEmoji}</span>
        </div>

        <div className="gspp-article">
          <ReactMarkdown
            components={{
              p: (p) => <p className="mb-5 text-[16px] leading-relaxed" {...p} />,
              strong: (p) => <strong className="font-semibold" {...p} />,
              a: (p) => <a className="font-semibold text-primary underline underline-offset-4" {...p} />,
              ul: (p) => <ul className="mb-5 space-y-2" {...p} />,
              li: (p) => <li className="ml-5 list-disc text-[16px] leading-relaxed" {...p} />,
              h2: (p) => <h2 className="mb-3 mt-8 text-xl font-bold" {...p} />,
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        <div className="mt-12 rounded-3xl bg-secondary/60 p-6 text-center sm:p-8">
          <h2 className="text-lg font-bold">Envie d&apos;essayer ces nouveautés ?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Téléchargez la dernière version du logiciel depuis la page Télécharger.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button className="rounded-full" onClick={() => navigate("/telecharger")}>Télécharger</Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/tarifs")}>Voir les formules</Button>
          </div>
        </div>
      </article>
    </main>
  );
}
