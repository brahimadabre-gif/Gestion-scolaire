"use client";

// ── Galerie des documents produits par le logiciel ───────────
// Chaque image est un vrai document imprimé par Gestion Scolaire Pro Plus,
// avec une école, des élèves et des photos entièrement fictifs.
import { useMemo, useState } from "react";
import Image from "next/image";
import { Link, navigate } from "../router";
import { PageHero } from "../page-hero";
import { Section } from "../ui-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, BookOpenCheck, ShieldCheck, ZoomIn } from "lucide-react";

type Cat = "resultats" | "eleves" | "administration" | "statistiques" | "caisse";

interface Doc {
  file: string;
  w: number;
  h: number;
  title: string;
  text: string;
  cat: Cat;
  feature: string;
  tuto: string;
}

const CATS: { id: Cat | "tous"; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "resultats", label: "Résultats" },
  { id: "eleves", label: "Élèves et classes" },
  { id: "administration", label: "Administration" },
  { id: "statistiques", label: "Statistiques" },
  { id: "caisse", label: "Caisse" },
];

const DOCS: Doc[] = [
  { file: "bulletin", w: 1608, h: 2202, cat: "resultats", title: "Bulletin scolaire", feature: "pedagogique", tuto: "notes",
    text: "Une page par élève et par composition : notes, barèmes, moyenne, rang, appréciation, décision et photo de l'élève. En-tête officiel de l'école et visas du maître, du parent et du directeur." },
  { file: "classement", w: 1588, h: 2246, cat: "resultats", title: "Rangement de la composition", feature: "pedagogique", tuto: "notes",
    text: "Toute la classe sur une page : notes par matière, total, moyenne, rang et décision, avec les statistiques de réussite des filles et des garçons." },
  { file: "liste-classe", w: 1588, h: 2246, cat: "eleves", title: "Liste de classe", feature: "documents", tuto: "eleves",
    text: "Matricule, nom et prénoms, genre, date et lieu de naissance, âge et statut de chaque élève, avec l'en-tête de l'école." },
  { file: "contacts-parents", w: 1588, h: 2246, cat: "eleves", title: "Contacts des parents d'élèves", feature: "administrative", tuto: "eleves",
    text: "Le parent ou tuteur de chaque élève et son numéro, classe par classe, avec une colonne de signature." },
  { file: "groupe-eps", w: 1588, h: 2246, cat: "eleves", title: "Groupes d'EPS", feature: "pedagogique", tuto: "eleves",
    text: "Répartition équilibrée des élèves de la classe en groupes de couleur, prête à afficher sur le terrain." },
  { file: "registre-appel", w: 1588, h: 2246, cat: "eleves", title: "Registre d'appel", feature: "administrative", tuto: "assiduite",
    text: "Présences et absences du matin et de l'après-midi pour une journée, avec le titulaire et la direction." },
  { file: "assiduite", w: 1588, h: 2246, cat: "eleves", title: "Récapitulatif de fréquentation", feature: "administrative", tuto: "assiduite",
    text: "Présences possibles, absences, présences effectives, taux de fréquentation et d'absence de chaque élève, sur la période choisie." },
  { file: "certificat-scolarite", w: 1588, h: 2246, cat: "administration", title: "Certificat de scolarité", feature: "documents", tuto: "documents",
    text: "Pré-rempli depuis la fiche de l'élève : identité, classe, année scolaire, moyenne annuelle, classement et appréciation." },
  { file: "certificat-frequentation", w: 1588, h: 2246, cat: "administration", title: "Certificat de fréquentation", feature: "documents", tuto: "documents",
    text: "Certificat de fréquentation scolaire à usage administratif, signé par la direction." },
  { file: "fiche-scolaire", w: 1588, h: 2246, cat: "administration", title: "Fiche scolaire", feature: "documents", tuto: "documents",
    text: "Le parcours de l'élève année par année, les informations sur les parents et les volets de départ de l'école." },
  { file: "tableau-ages", w: 1588, h: 2246, cat: "statistiques", title: "Tableau des âges", feature: "administrative", tuto: "assiduite",
    text: "Répartition des filles et des garçons par âge et par classe, avec les totaux de l'école." },
  { file: "effectifs-redoublements", w: 1588, h: 2246, cat: "statistiques", title: "Effectifs et redoublements", feature: "administrative", tuto: "assiduite",
    text: "Inscrits, redoublants et non-redoublants par classe, filles et garçons séparés." },
  { file: "recap-effectifs", w: 1588, h: 2246, cat: "statistiques", title: "Récapitulatif des effectifs", feature: "administrative", tuto: "assiduite",
    text: "La classe détaillée élève par élève, avec le décompte des filles, des garçons, des doublants et des non-doublants." },
  { file: "effectifs-nationalites", w: 1588, h: 2246, cat: "statistiques", title: "Effectifs et nationalités", feature: "administrative", tuto: "assiduite",
    text: "Élèves ivoiriens et non ivoiriens par classe, filles et garçons séparés." },
  { file: "caisse-recu", w: 1588, h: 820, cat: "caisse", title: "Reçu de paiement", feature: "administrative", tuto: "caisse",
    text: "Reçu numéroté : montant à payer, montant versé, reste à payer, mode de paiement, somme en lettres et code QR de vérification." },
  { file: "caisse-double", w: 1588, h: 1930, cat: "caisse", title: "Reçus des cours de renforcement", feature: "administrative", tuto: "caisse",
    text: "Deux reçus de cours de renforcement sur une seule feuille A4, à découper, avec les mois payés." },
  { file: "caisse-bon", w: 1588, h: 686, cat: "caisse", title: "Bon de sortie de caisse", feature: "administrative", tuto: "caisse",
    text: "Chaque dépense laisse une trace : motif, bénéficiaire, montant et signatures du caissier, du bénéficiaire et du directeur." },
  { file: "caisse-bulletin", w: 1404, h: 1841, cat: "caisse", title: "Bulletin de salaire", feature: "administrative", tuto: "caisse",
    text: "Bulletin complet pour chaque membre du personnel : employeur et salarié, salaire de base, avances retenues, net à payer en chiffres et en lettres, cumuls de l'année scolaire et signatures." },
];

export function DocumentsPage() {
  const [cat, setCat] = useState<Cat | "tous">("tous");
  const [zoom, setZoom] = useState<Doc | null>(null);
  const shown = useMemo(() => (cat === "tous" ? DOCS : DOCS.filter((d) => d.cat === cat)), [cat]);

  return (
    <main id="contenu">
      <PageHero
        eyebrow="Documents du logiciel"
        title="Les documents que Gestion Scolaire Pro Plus imprime pour vous"
        description="Bulletins, listes, certificats, statistiques et reçus de caisse, tels que le logiciel les produit : aucune retouche, seulement une école et des élèves fictifs."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" className="rounded-full" onClick={() => navigate("/tutoriel")}>
            <BookOpenCheck className="mr-1.5 h-4 w-4" aria-hidden="true" /> Voir le tutoriel illustré
          </Button>
          <Button size="lg" variant="outline" className="rounded-full" onClick={() => navigate("/fonctionnalites")}>
            Toutes les fonctionnalités
          </Button>
        </div>
      </PageHero>

      <Section className="pb-0 sm:pb-0 lg:pb-0">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 rounded-3xl border bg-card p-6 md:flex-row">
          <Image
            src="/documents/photos-fictives.webp"
            alt="Photos d'identité fictives : enfants illustrés en uniforme portant un cache-nez"
            width={1936}
            height={284}
            sizes="(min-width: 768px) 480px, 100vw"
            className="h-auto w-full max-w-md rounded-xl"
          />
          <p className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            <span>
              L&apos;école « EPP Les Palmiers », ses enseignants et ses 144 élèves sont inventés. Les photos sont des
              illustrations d&apos;enfants portant un cache-nez : aucune vraie personne n&apos;apparaît.
            </span>
          </p>
        </div>
      </Section>

      <Section>
        <div role="tablist" aria-label="Catégories de documents" className="flex flex-wrap justify-center gap-2">
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={cat === c.id}
              onClick={() => setCat(c.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                cat === c.id ? "border-orange-600 bg-orange-600 text-white" : "bg-card hover:bg-secondary"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((d) => (
            <article key={d.file} className="card-hover flex flex-col overflow-hidden rounded-2xl border bg-card">
              <button
                type="button"
                onClick={() => setZoom(d)}
                className="group relative block aspect-[3/4] overflow-hidden border-b bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600"
                aria-label={`Agrandir : ${d.title}`}
              >
                <Image
                  src={`/documents/${d.file}.webp`}
                  alt={`${d.title} produit par Gestion Scolaire Pro Plus (données fictives)`}
                  width={d.w}
                  height={d.h}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  className="mx-auto h-full w-auto max-w-full object-contain object-top p-3 drop-shadow-md transition group-hover:scale-[1.02]"
                />
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" /> Agrandir
                </span>
              </button>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-[15px] font-semibold">{d.title}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{d.text}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold">
                  <Link to={`/tutoriel#${d.tuto}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                    Comment l&apos;obtenir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <Link to={`/fonctionnalites#${d.feature}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary hover:underline">
                    Fonctionnalité
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section className="bg-secondary/40">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Les mêmes documents, à l&apos;en-tête de votre école</h2>
          <p className="mt-3 text-muted-foreground">
            Renseignez une fois votre école, vos classes et vos élèves : chaque document se remplit et s&apos;imprime en un clic, ou s&apos;exporte en PDF.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="rounded-full" onClick={() => navigate("/telecharger")}>Télécharger le logiciel</Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => navigate("/tarifs")}>Voir les tarifs</Button>
          </div>
        </div>
      </Section>

      <Dialog open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-h-[94vh] max-w-[min(96vw,900px)] overflow-y-auto p-2 sm:max-w-[min(96vw,900px)]">
          <DialogTitle className="px-2 pt-1 text-base">{zoom?.title}</DialogTitle>
          <DialogDescription className="sr-only">{zoom?.text}</DialogDescription>
          {zoom && (
            <Image
              src={`/documents/${zoom.file}.webp`}
              alt={`${zoom.title} produit par Gestion Scolaire Pro Plus (données fictives)`}
              width={zoom.w}
              height={zoom.h}
              sizes="(min-width: 900px) 900px, 96vw"
              className="h-auto w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
