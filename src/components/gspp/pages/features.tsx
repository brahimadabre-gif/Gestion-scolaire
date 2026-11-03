"use client";

// ── Page Fonctionnalités — organisées par catégories ─────────
import { useEffect } from "react";
import { Link, navigate } from "../router";
import { PageHero } from "../page-hero";
import { Section, SectionHeading } from "../ui-bits";
import { Button } from "@/components/ui/button";
import { navigate as nav } from "../router";
import {
  Users, BookOpen, Calculator, Trophy, FileText, Printer, BarChart3,
  ClipboardList, Import, ArrowUpCircle, PenLine, Zap, FolderDown,
  Layers, GraduationCap, Building2, CheckCircle2, Download, UserPlus,
  Wallet, Phone, RefreshCw, Bot, Repeat, Smartphone, Camera, Fingerprint, WifiOff, Images,
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
      { icon: PenLine, name: "Notes", text: "Saisie rapide au clavier, notes à virgule (12,50), contrôle du barème et navigation sans souris." },
      { icon: Calculator, name: "Moyennes", text: "Calcul pondéré automatique, transparence du détail matière par matière." },
      { icon: Trophy, name: "Classements", text: "Rangs automatiques, ex æquo, mentions, distinctions et progression des élèves." },
      { icon: ClipboardList, name: "Compositions", text: "Organisation des compositions et examens internes, avec reconstitution instantanée des résultats." },
      { icon: Users, name: "Groupes d'EPS", text: "Répartition équilibrée des élèves par classe, selon l'effectif et l'ordre prévu, avec groupes colorés et impression prête à l'emploi." },
      { icon: FileText, name: "Bulletins", text: "Génération complète à votre logo, appréciations automatiques et modèles personnalisables." },
      { icon: BookOpen, name: "Fiches pédagogiques", text: "Progressions et fiches de préparation pré-remplies d'après les programmes officiels, consultables hors connexion." },
      { icon: GraduationCap, name: "Cours de renforcement", text: "Inscription des élèves, catalogue des cours avec tarif mensuel, mois dispensés et suivi des paiements par mois avec la Caisse." },
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
      { icon: Users, name: "Enseignants", text: "Comptes enseignants, classes affectées et accès adaptés aux responsabilités de chaque utilisateur." },
      { icon: ClipboardList, name: "Registre d'appel et assiduité", text: "Suivi quotidien des présences et absences, consultation par classe et édition des informations de fréquentation." },
      { icon: ClipboardList, name: "Documents administratifs", text: "Certificats de scolarité, correspondances types et documents officiels pré-remplis." },
      { icon: PenLine, name: "Signatures", text: "Signature du directeur et cachet appliqués automatiquement sur les documents émis." },
      { icon: BarChart3, name: "Rapports", text: "Statistiques d'école primaire, comparaisons entre classes et suivi des résultats." },
      { icon: Wallet, name: "Caisse", text: "Encaissements, reçus imprimables, suivi des impayés, relances, dépenses et clôture de caisse." },
      { icon: Phone, name: "Contacts parents", text: "Coordonnées des parents et tuteurs regroupées par classe, prêtes à consulter ou à imprimer." },
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
      { icon: Import, name: "Import intelligent", text: "Importez vos listes d'élèves depuis Excel, CSV, Word, PDF ou une photo : noms et prénoms reconnus, doublons signalés, relecture avant import." },
      { icon: FolderDown, name: "Sauvegarde et restauration", text: "Exportez, importez et restaurez les données de l'établissement pour sécuriser votre travail." },
      { icon: RefreshCw, name: "Synchronisation", text: "La direction et les enseignants échangent leurs données par Wi-Fi local ou par fichier .gspp chiffré." },
      { icon: Bot, name: "Assistant Brahima", text: "Un assistant intégré qui répond à vos questions sur le logiciel et vous guide pas à pas." },
      { icon: Repeat, name: "Convertisseur de fichiers", text: "PDF vers Word et extraction de texte sans connexion, avec reconnaissance des pages scannées (OCR). Aucun fichier n'est envoyé sur Internet." },
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
      { icon: ClipboardList, name: "Groupes d'EPS imprimables", text: "Mise en page des groupes par classe avec couleurs, numérotation et noms des élèves adaptés à l'impression." },
      { icon: Layers, name: "Fiches scolaires", text: "Fiche complète d'un élève imprimable en un clic pour les dossiers administratifs." },
      { icon: ClipboardList, name: "Relevés", text: "Relevés de notes par période, pour les délibérations et les familles." },
      { icon: FileText, name: "Certificats", text: "Certificats de scolarité et de fréquentation générés avec une mise en page prête à imprimer." },
      { icon: Printer, name: "Impressions", text: "Aperçu fidèle, mise en page A4 optimisée, export PDF archivable automatiquement." },
      { icon: FolderDown, name: "Documents administratifs", text: "Tous les modèles officiels de l'établissement, pré-remplis et personnalisables." },
    ],
  },
  {
    id: "android",
    icon: Smartphone,
    title: "Sur Android",
    intro: "L'application complète sur téléphone et tablette, pensée pour le terrain.",
    features: [
      { icon: Camera, name: "Photo de l'élève", text: "La photo se prend directement dans l'application, qui reste ouverte, même sur les téléphones à mémoire limitée." },
      { icon: Fingerprint, name: "Empreinte digitale", text: "Connexion rapide et sécurisée par empreinte, sans retaper le mot de passe." },
      { icon: WifiOff, name: "Hors connexion", text: "Notes, appel, bulletins et documents restent disponibles sans Internet." },
      { icon: RefreshCw, name: "Synchronisation", text: "Échangez les données avec l'ordinateur de l'école par Wi-Fi local ou par fichier .gspp." },
    ],
  },
];

export function FeaturesPage() {
  // Lien direct vers une catégorie (ex. /fonctionnalites#documents depuis la galerie)
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

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
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-600/10 text-orange-700 dark:text-orange-400">
                <g.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              {g.title}
            </a>
          ))}
        </div>
        <div className="mx-auto mt-6 grid max-w-5xl gap-3 sm:grid-cols-2">
          <Link to="/documents" className="card-hover flex items-center gap-4 rounded-2xl border border-orange-600/30 bg-orange-600/5 p-5">
            <Images className="h-8 w-8 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            <span>
              <span className="block font-semibold">Voir les documents imprimés</span>
              <span className="text-sm text-muted-foreground">Bulletins, listes, certificats, statistiques et reçus, avec des données fictives.</span>
            </span>
          </Link>
          <Link to="/tutoriel" className="card-hover flex items-center gap-4 rounded-2xl border border-orange-600/30 bg-orange-600/5 p-5">
            <BookOpen className="h-8 w-8 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            <span>
              <span className="block font-semibold">Suivre le tutoriel illustré</span>
              <span className="text-sm text-muted-foreground">Du compte principal à la fin d&apos;année, chaque étape en images.</span>
            </span>
          </Link>
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
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600/10 text-orange-700 dark:text-orange-400">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-[15px] font-semibold">{f.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </Section>
      ))}

      {/* Synthèse pratique */}
      <Section className="bg-secondary/40">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            eyebrow="En pratique"
            title="Du fichier Excel au bulletin imprimé, sans ressaisie"
            description="Importez vos listes d'élèves, saisissez les notes au clavier, générez les bulletins et imprimez. Chaque étape est pensée pour vous faire gagner du temps."
          />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Import intelligent avec détection des colonnes et contrôle des doublons",
              "Saisie des notes optimisée clavier, sans jamais quitter le pavé numérique",
              "Bulletins et rapports générés pour toute une classe en un clic",
              "Export PDF archivé automatiquement avec un nom de fichier clair",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 rounded-2xl border bg-card p-4 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
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
