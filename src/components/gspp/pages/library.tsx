"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { PageHero } from "../page-hero";
import { Section, Spinner } from "../ui-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, CalendarDays, Download, FileText, Search } from "lucide-react";

interface LibraryDocument {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  level: string;
  fileType: string;
  fileSizeMb: number;
  coverUrl: string;
  downloads: number;
  createdAt: string;
}

function formatFileSize(size: number) {
  return size > 0 ? `${size.toLocaleString("fr-FR")} Mo` : "Document numérique";
}

export function LibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [level, setLevel] = useState("Tous niveaux");
  const query = new URLSearchParams({
    ...(search.trim() ? { q: search.trim() } : {}),
    ...(category !== "Toutes" ? { category } : {}),
    ...(level !== "Tous niveaux" ? { level } : {}),
  }).toString();
  const { data: documents, isLoading } = useQuery<LibraryDocument[]>({
    queryKey: ["library", query],
    queryFn: () => api.get<LibraryDocument[]>(`/api/library${query ? `?${query}` : ""}`),
    staleTime: 60_000,
  });

  const categories = useMemo(() => ["Toutes", ...new Set((documents ?? []).map((item) => item.category))], [documents]);
  const levels = useMemo(() => ["Tous niveaux", ...new Set((documents ?? []).map((item) => item.level))], [documents]);

  return (
    <main id="contenu">
      <PageHero
        eyebrow="Bibliothèque"
        title="Les ressources de votre école, réunies au même endroit"
        description="Manuels, cours, guides et documents pédagogiques sélectionnés pour accompagner les enseignants et les établissements."
      />

      <Section className="pt-8">
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un livre, un cours ou un auteur…" className="h-11 rounded-xl pl-9" aria-label="Rechercher dans la bibliothèque" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-44" aria-label="Filtrer par catégorie"><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-44" aria-label="Filtrer par niveau"><SelectValue /></SelectTrigger>
            <SelectContent>{levels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {isLoading ? <Spinner /> : !documents?.length ? (
          <div className="mt-12 rounded-3xl border border-dashed p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">Aucun document disponible</h2>
            <p className="mt-2 text-sm text-muted-foreground">Les prochaines ressources seront publiées ici par l&apos;administrateur.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((item) => (
              <article key={item.id} className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-500 p-5">
                  {item.coverUrl ? (
                    <img src={item.coverUrl} alt={`Couverture de ${item.title}`} className="h-full w-full object-contain drop-shadow-xl" />
                  ) : (
                    <div className="flex h-32 w-24 flex-col items-center justify-center rounded-md bg-white/95 p-2 text-center text-emerald-900 shadow-xl">
                      <BookOpen className="h-8 w-8" aria-hidden="true" />
                      <span className="mt-2 line-clamp-3 text-[10px] font-bold uppercase">{item.title}</span>
                    </div>
                  )}
                  <Badge className="absolute left-3 top-3 rounded-full bg-white/90 text-emerald-800 hover:bg-white/90">{item.level}</Badge>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.category}</span><span aria-hidden="true">•</span><span>{item.fileType}</span>
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-base font-bold leading-snug">{item.title}</h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{item.description || "Ressource pédagogique disponible au téléchargement."}</p>
                  {item.author && <p className="mt-3 text-xs font-medium text-foreground/70">Par {item.author}</p>}
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" aria-hidden="true" />{formatFileSize(item.fileSizeMb)}</span>
                    <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" aria-hidden="true" />{item.downloads}</span>
                  </div>
                  <Button asChild className="mt-4 w-full rounded-xl">
                    <a href={`/api/library/${item.id}`} target="_blank" rel="noreferrer">
                      <Download className="mr-1.5 h-4 w-4" aria-hidden="true" /> Télécharger
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section className="bg-secondary/40">
        <div className="mx-auto flex max-w-3xl items-start gap-4 rounded-2xl border bg-card p-5">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-muted-foreground">La bibliothèque est enrichie progressivement avec des ressources adaptées aux niveaux du primaire. Les documents sont publiés et retirés par l&apos;administrateur du site.</p>
        </div>
      </Section>
    </main>
  );
}
