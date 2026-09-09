"use client";

// ── Page Fonctionnalités — organisées par catégories ─────────
import { Link, navigate } from "../router";
import { PageHero } from "../page-hero";
import { AppMockup } from "../app-mockup";
import { Section, SectionHeading } from "../ui-bits";
import { Button } from "@/components/ui/button";
import { navigate as nav } from "../router";
import {
  Users, BookOpen, Calculator, Trophy, FileText, Printer, BarChart3,
  ClipboardList, Import, ArrowUpCircle, PenLine, Zap, FolderDown,
  Layers, GraduationCap, Building2, CheckCircle2, Download, UserPlus,
} from "lucide-react";

const GROUPS = [
  {
    id: "pedagogique",
    icon: GraduationCap,
    title: "Gestion pédagogique",
    intro: "Le cœur du métier d'enseignant : la vie de la classe, du premier élève inscrit au bulletin final.",
    features: [
      { icon: Users, name: "Élèves", text: "Fiches complètes, matricules, photos, tuteurs et historique scolaire de chaque élève." },
      { icon: Layers, name: "Classes", text: "Création des niveaux CP1, CP2, CE1, CE2, CM1 et CM2, effectifs et classes parallèles." },
      { icon: BookOpen, name: "Matières", text: "Coefficients, barèmes adaptés au primaire, sous-matières et enseignants affectés." },
      { icon: PenLine, name: "Notes", text: "Saisie rapide au clavier avec contrôles automatiques et navigation sans souris." },
      { icon: Calculator, name: "Moyennes", text: "Calcul pondéré automatique, transparence du détail matière par matière." },
      { icon: Trophy, name: "Classements", text: "Rangs automatiques, ex æquo, mentions, distinctions et progression des élèves." },
      { icon: ClipboardList, name: "Compositions", text: "Organisation des compositions et examens internes, avec reconstitution instantanée des résultats." },
      { icon: FileText, name: "Bulletins", text: "Génération complète à votre logo, appréciations automatiques et modèles personnalisables." },
    ],
  },
  {
    id: "administrative",
    icon: Building2,
    title: "Gestion administrative",
    intro: "Les outils du directeur et de la scolarité : inscriptions, documents officiels et rapports.",
    features: [
      { icon: UserPlus, name: "Inscriptions et admissions", text: "Dossiers élèves, réinscriptions et nouveaux arrivants gérés en quelques minutes." },
      { icon: ArrowUpCircle, name: "Promotions", text: "Passage automatique en classe supérieure, redoublements et départs maîtrisés." },
      { icon: ClipboardList, name: "Documents administratifs", text: "Certificats de scolarité, correspondances types et documents officiels pré-remplis." },
      { icon: PenLine, name: "Signatures", text: "Signature du directeur et cachet appliqués automatiquement sur les documents émis." },
      { icon: BarChart3, name: "Rapports", text: "Statistiques d'école primaire, comparaisons entre classes et suivi des résultats." },
    ],
  },
  {
    id: "automatisation",
    icon: Zap,
    title: "Automatisation",
    intro: "Ce qui se calcule seul doit se calculer seul : le logiciel fait le travail répétitif à votre place.",
    features: [
      { icon: Calculator, name: "Calcul automatique", text: "Moyennes, coefficients, rangs : tout est recalculé instantanément après chaque saisie." },
      { icon: FileText, name: "Génération de documents", text: "Bulletins, listes et relevés générés pour une classe entière en un clic." },
      { icon: Import, name: "Import intelligent", text: "Glissez vos fichiers Excel : colonnes détectées, doublons signalés, import contrôlé." },
      { icon: Trophy, name: "Classement automatique", text: "Classements et mentions mis à jour en continu selon vos seuils personnalisés." },
      { icon: BarChart3, name: "Génération des rapports", text: "Rapports de résultats prêts à imprimer pour le directeur et les enseignants." },
    ],
  },
  {
    id: "documents",
    icon: FolderDown,
    title: "Documents",
    intro: "Des impressions professionnelles qui valorisent votre établissement auprès des familles.",
    features: [
      { icon: FileText, name: "Bulletins", text: "Une page par élève, en-tête à votre logo, appréciations et décisions adaptées au primaire." },
      { icon: Users, name: "Listes de classes", text: "Alphabétique, par mérite, émargement ou vierge : la liste qu'il faut, quand il faut." },
      { icon: Layers, name: "Fiches scolaires", text: "Fiche complète d'un élève imprimable en un clic pour les dossiers administratifs." },
      { icon: ClipboardList, name: "Relevés", text: "Relevés de notes par période, pour les délibérations et les familles." },
      { icon: Printer, name: "Impressions", text: "Aperçu fidèle, mise en page A4 optimisée, export PDF archivable automatiquement." },
      { icon: FolderDown, name: "Documents administratifs", text: "Tous les modèles officiels de l'établissement, pré-remplis et personnalisables." },
    ],
  },
];

export function FeaturesPage() {
  return (
    <main id="contenu">
      <PageHero
        eyebrow="Fonctionnalités"
        title="Toutes les fonctionnalités de Gestion Scolaire Pro Plus"
        description="Une solution complète qui couvre la vie d'une école primaire de A à Z : pédagogie, administration, automatisation et documents professionnels."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" className="rounded-full" onClick={() => nav("/telecharger")}>
            <Download className="mr-1.5 h-4 w-4" aria-hidden="true" /> Télécharger le logiciel
          </Button>
          <Button size="lg" variant="outline" className="rounded-full" onClick={() => nav("/inscription")}>
            Créer un compte
          </Button>
        </div>
      </PageHero>

      {/* Sommaire des catégories */}
      <Section className="pb-0">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4">
          {GROUPS.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(g.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="card-hover flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 text-sm font-semibold"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                <g.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              {g.title}
            </a>
          ))}
        </div>
      </Section>

      {GROUPS.map((g, gi) => (
        <Section key={g.id} id={g.id} className={gi % 2 === 1 ? "bg-secondary/40" : ""}>
          <SectionHeading
            align="left"
            eyebrow={`${String(gi + 1).padStart(2, "0")} — Catégorie`}
            title={g.title}
            description={g.intro}
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {g.features.map((f) => (
              <article key={f.name} className="card-hover rounded-2xl border bg-card p-5">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-[15px] font-semibold">{f.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </Section>
      ))}

      {/* Capture + conclusion */}
      <Section className="bg-secondary/40">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="En pratique"
              title="Du fichier Excel au bulletin imprimé, sans ressaisie"
              description="Importez vos listes d'élèves, saisissez les notes au clavier, générez les bulletins et imprimez. Chaque étape est pensée pour vous faire gagner du temps."
            />
            <ul className="mt-6 space-y-2.5">
              {[
                "Import intelligent avec détection des colonnes et contrôle des doublons",
                "Saisie des notes optimisée clavier, sans jamais quitter le pavé numérique",
                "Bulletins et rapports générés pour toute une classe en un clic",
                "Export PDF archivé automatiquement avec un nom de fichier clair",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <AppMockup variant="bulletin" />
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Prêt à essayer ?</h2>
          <p className="mt-3 text-muted-foreground">
            Créez votre compte, installez le logiciel et constatez le gain de temps dès la première heure.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="rounded-full" onClick={() => nav("/inscription")}>Créer mon compte</Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => nav("/tarifs")}>Voir les tarifs</Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Une question ? <Link to="/support" className="font-semibold text-primary hover:underline">Contactez le support</Link>.
          </p>
        </div>
      </Section>
    </main>
  );
}
