"use client";

// ── Notice d'utilisation — documentation en ligne complète ──
// Menu latéral + recherche + sommaire + navigation précédent/suivant
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, DocSection, DocSectionSummary } from "../api";
import { Link, navigate, useRoute } from "../router";
import { Spinner } from "../ui-bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import {
  Search, ChevronLeft, ChevronRight, BookOpen, ListTree, X,
  FileQuestion, ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function DocIcon({ icon, className }: { icon: string; className?: string }) {
  const map: Record<string, React.ElementType> = {
    "book-open": BookOpen, download: FileQuestion, "user-plus": BookOpen,
    "log-in": ArrowUpCircle, calculator: FileQuestion,
  };
  const Icon = map[icon] ?? BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}

// Sommaire extrait des titres "##" du markdown
function useToc(content: string) {
  return useMemo(() => {
    const lines = content.split("\n");
    const toc: { title: string; id: string }[] = [];
    for (const line of lines) {
      if (line.startsWith("## ")) {
        const title = line.replace(/^##\s+/, "").trim();
        toc.push({ title, id: title.toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüç]+/gi, "-") });
      }
    }
    return toc;
  }, [content]);
}

export function DocsPage() {
  const route = useRoute();
  const currentSlug = route.query.section ?? "introduction";
  const [search, setSearch] = useState("");

  const { data: sections, isLoading: listLoading } = useQuery<DocSectionSummary[]>({
    queryKey: ["docs"],
    queryFn: () => api.get<DocSectionSummary[]>("/api/docs"),
    staleTime: 10 * 60_000,
  });

  const { data: section, isLoading: sectionLoading } = useQuery<DocSection>({
    queryKey: ["docs", currentSlug],
    queryFn: () => api.get<DocSection>(`/api/docs?slug=${currentSlug}`),
    staleTime: 10 * 60_000,
  });

  const filtered = useMemo(() => {
    if (!sections) return [];
    const q = search.trim().toLowerCase();
    return q
      ? sections.filter((s) => s.title.toLowerCase().includes(q) || String(s.number).includes(q))
      : sections;
  }, [sections, search]);

  const toc = useToc(section?.content ?? "");
  const index = sections?.findIndex((s) => s.slug === currentSlug) ?? -1;
  const prev = index > 0 ? sections?.[index - 1] : undefined;
  const next = sections && index >= 0 && index < sections.length - 1 ? sections[index + 1] : undefined;

  // Touche ← → pour naviguer entre les sections
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/)) return;
      if (e.key === "ArrowLeft" && prev) navigate(`/notice?section=${prev.slug}`);
      if (e.key === "ArrowRight" && next) navigate(`/notice?section=${next.slug}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  return (
    <main id="contenu" className="mx-auto min-h-[calc(100vh-7rem)] max-w-7xl px-4 py-10 pb-16 sm:px-6 lg:px-8">
      {/* En-tête de la documentation */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
            Documentation
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Notice d&apos;utilisation</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Le guide complet de Gestion Scolaire Pro Plus, de l&apos;installation aux fonctionnalités
            avancées. Astuce : utilisez les touches ← et → pour naviguer entre les sections.
          </p>
        </div>
        <Link to="/support" className="text-sm font-semibold text-primary hover:underline">
          Un problème ? Contactez le support →
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_220px]">
        {/* Menu latéral */}
        <aside className="lg:self-start">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher dans la documentation…"
              className="rounded-xl pl-9"
              aria-label="Rechercher dans la documentation"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <ScrollArea className="mt-4 max-h-[60vh] lg:max-h-[calc(100vh-220px)] pr-2">
            <nav aria-label="Sommaire de la documentation" className="space-y-0.5">
              {listLoading && <Spinner className="py-8" />}
              {filtered.map((s) => (
                <Link
                  key={s.slug}
                  to={`/notice?section=${s.slug}`}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors",
                    s.slug === currentSlug
                      ? "bg-emerald-600/10 font-semibold text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  <span className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                    s.slug === currentSlug ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {s.number}
                  </span>
                  {s.title}
                </Link>
              ))}
              {!listLoading && filtered.length === 0 && (
                <p className="px-3 py-6 text-sm text-muted-foreground">Aucune section ne correspond à « {search} ».</p>
              )}
            </nav>
          </ScrollArea>
        </aside>

        {/* Contenu de la section */}
        <article className="min-w-0">
          {sectionLoading || !section ? (
            <Spinner />
          ) : (
            <div className="rounded-3xl border bg-card px-6 py-8 sm:px-10 sm:py-10">
              <div className="mb-6 flex items-center gap-3 border-b pb-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                  <DocIcon icon={section.icon} className="h-5.5 w-5.5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Section {section.number} sur 19
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
                </div>
              </div>
              <div className="gspp-doc-content">
                <ReactMarkdown
                  components={{
                    h2: (p) => (
                      <h3
                        id={String(p.children[0] ?? "").toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüç]+/gi, "-")}
                        className="mb-3 mt-8 scroll-mt-28 text-lg font-bold first:mt-0"
                        {...p}
                      />
                    ),
                    p: (p) => <p className="mb-4 text-[15px] leading-relaxed text-foreground/90" {...p} />,
                    strong: (p) => <strong className="font-semibold" {...p} />,
                    ul: (p) => <ul className="mb-4 space-y-2" {...p} />,
                    li: (p) => (
                      <li className="ml-1 flex items-start gap-2 text-[15px] leading-relaxed text-foreground/90" {...p} />
                    ),
                    blockquote: (p) => (
                      <blockquote className="my-5 rounded-r-xl border-l-4 border-amber-500 bg-amber-500/10 px-5 py-3.5 text-[15px] leading-relaxed" {...p} />
                    ),
                    code: (p) => <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]" {...p} />,
                    a: (p) => <a className="font-semibold text-primary underline underline-offset-4" {...p} />,
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>

              {/* Navigation précédent / suivant */}
              <div className="mt-10 grid gap-3 border-t pt-8 sm:grid-cols-2">
                {prev ? (
                  <Link
                    to={`/notice?section=${prev.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border bg-background p-4 transition hover:border-ring/50"
                  >
                    <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
                    <span>
                      <span className="block text-xs text-muted-foreground">Précédent</span>
                      <span className="block text-sm font-semibold">{prev.title}</span>
                    </span>
                  </Link>
                ) : <span />}
                {next && (
                  <Link
                    to={`/notice?section=${next.slug}`}
                    className="group flex items-center justify-end gap-3 rounded-2xl border bg-background p-4 text-right transition hover:border-ring/50"
                  >
                    <span>
                      <span className="block text-xs text-muted-foreground">Suivant</span>
                      <span className="block text-sm font-semibold">{next.title}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </article>

        {/* Sommaire de la section (bureau large) */}
        {toc.length > 0 && (
          <aside className="hidden xl:block xl:self-start">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <ListTree className="h-3.5 w-3.5" aria-hidden="true" /> Sur cette page
            </p>
            <nav aria-label="Sommaire de la section" className="mt-3 space-y-1.5 border-l pl-4">
              {toc.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="block text-[13px] leading-snug text-muted-foreground transition hover:text-primary"
                >
                  {t.title}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>

      {/* Appel à l'action */}
      <div className="mt-12 rounded-3xl bg-secondary/60 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Documentation au format PDF</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous préférez imprimer la notice complète ? Le manuel PDF est disponible dans le logiciel,
              menu « Aide → Notice ».
            </p>
          </div>
          <Link to="/telecharger">
            <Button className="rounded-full">Télécharger le logiciel</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
