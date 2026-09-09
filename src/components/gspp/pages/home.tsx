"use client";

// ── Page d'accueil — Gestion Scolaire Pro Plus ───────────────
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Article, FaqItem, Plan, Testimonial } from "../api";
import { Link, navigate } from "../router";
import { AppMockup, MockupVariant } from "../app-mockup";
import { Section, SectionHeading, Stars, InitialsAvatar, Spinner } from "../ui-bits";
import { formatDate, formatFcfa } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, BookOpen, GraduationCap, Calculator, Trophy, FileText, Printer,
  BarChart3, Building2, Import, ArrowUpCircle, PenLine, CalendarDays,
  ShieldCheck, Sparkles, Download, CheckCircle2, ArrowRight, Monitor,
  Smartphone, Cloud, UserPlus, CreditCard, KeyRound, LifeBuoy, Zap,
  ClipboardList, FolderDown, Signature, Layers,
} from "lucide-react";

// ── Hero ─────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="gspp-hero-glow absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="text-center lg:text-left">
            <Badge variant="outline" className="animate-fade-up mb-5 gap-1.5 rounded-full border-emerald-600/30 bg-emerald-600/5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Version 3.2 disponible — bulletins personnalisables
            </Badge>
            <h1 className="animate-fade-up-delay-1 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              La solution complète pour <span className="gspp-gradient-text">simplifier la gestion scolaire</span>
            </h1>
            <p className="animate-fade-up-delay-2 mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Gagnez du temps, réduisez les erreurs et simplifiez la gestion quotidienne de votre
              école primaire grâce à une solution pensée pour les directeurs et enseignants du
              primaire : CP1, CP2, CE1, CE2, CM1, CM2, notes, bulletins, certificats et administration.
            </p>
            <div className="animate-fade-up-delay-3 mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" className="w-full rounded-full text-base shadow-lg shadow-emerald-600/20 sm:w-auto" onClick={() => navigate("/fonctionnalites")}>
                Découvrir le logiciel
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" className="w-full rounded-full text-base sm:w-auto" onClick={() => navigate("/telecharger")}>
                <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Télécharger
              </Button>
              <Button size="lg" variant="secondary" className="w-full rounded-full text-base sm:w-auto" onClick={() => navigate("/inscription")}>
                <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Créer un compte
              </Button>
            </div>
            <ul className="animate-fade-up-delay-3 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground lg:justify-start">
              <li className="flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Windows 10/11 et Android
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Vos données restent chez vous
              </li>
              <li className="flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Fonctionne hors connexion
              </li>
            </ul>
          </div>
          <div className="animate-float relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-600/15 via-transparent to-amber-500/15 blur-2xl" aria-hidden="true" />
            <AppMockup variant="dashboard" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Statistiques ─────────────────────────────────────────────
function StatsBand() {
  const stats = [
    { value: "0", label: "écoles primaires équipées" },
    { value: "0", label: "élèves gérés chaque année" },
    { value: "0", label: "enseignants utilisateurs" },
    { value: "0 %", label: "de clients satisfaits" },
  ];
  return (
    <section className="border-y bg-secondary/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Présentation : avantages principaux ──────────────────────
const ADVANTAGES = [
  { icon: Users, title: "Gestion des élèves", text: "Fiches complètes, photos, tuteurs, historique : chaque élève est centralisé et consultable en deux clics." },
  { icon: Layers, title: "Gestion des classes", text: "Créez vos classes de CP1 à CM2, organisez les groupes parallèles et suivez les effectifs." },
  { icon: BookOpen, title: "Gestion des notes", text: "Saisie ultra-rapide au clavier, barèmes /10 pour CP/CE et /20 pour CM, moyennes en temps réel." },
  { icon: Calculator, title: "Calcul automatique des moyennes", text: "Moyennes pondérées par coefficients, recalcul instantané en cas de modification, transparence totale." },
  { icon: Trophy, title: "Classement des élèves", text: "Rangs, ex æquo gérés, mentions et distinctions automatiques selon vos propres seuils." },
  { icon: FileText, title: "Bulletins scolaires", text: "Bulletins professionnels à votre logo, appréciations automatiques, prêts à imprimer ou à exporter en PDF." },
  { icon: GraduationCap, title: "Fiches scolaires", text: "Fiche complète par élève : scolarité, notes, absences et documents émis, pour toute l'année." },
  { icon: Printer, title: "Impressions professionnelles", text: "Listes de classes, relevés, certificats et émargements : des documents nets, formatés et fiables." },
  { icon: BarChart3, title: "Rapports de résultats", text: "Synthèses par classe et par école, taux de réussite et statistiques pour le suivi pédagogique." },
  { icon: ClipboardList, title: "Gestion administrative", text: "Inscriptions, documents officiels, correspondances types : le bureau du directeur, simplifié." },
  { icon: Import, title: "Import intelligent de documents", text: "Importez vos listes Excel en glisser-déposer : détection des colonnes et contrôle des doublons." },
  { icon: ArrowUpCircle, title: "Promotion des élèves", text: "Le passage en classe supérieure, les redoublements et les départs gérés en une opération." },
  { icon: PenLine, title: "Signatures électroniques", text: "Signature du directeur et cachet de l'établissement appliqués automatiquement sur vos documents." },
  { icon: CalendarDays, title: "Années scolaires", text: "Archivez chaque année et retrouvez à tout moment les bulletins et résultats des années passées." },
  { icon: Zap, title: "Rapide et hors connexion", text: "Aucune latence, aucune dépendance Internet pour le travail quotidien : tout est sur votre poste." },
];

function Advantages() {
  return (
    <Section id="presentation">
      <SectionHeading
        eyebrow="Présentation du logiciel"
        title="Tout ce dont votre école primaire a besoin, réuni dans un seul logiciel"
        description="Gestion Scolaire Pro Plus accompagne les enseignants, directeurs et responsables administratifs du primaire tout au long de l'année scolaire — de l'inscription des élèves à l'impression des bulletins."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ADVANTAGES.map((a) => (
          <article key={a.title} className="card-hover rounded-2xl border bg-card p-6">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
              <a.icon className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold">{a.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

// ── Catégories de fonctionnalités ────────────────────────────
const CATEGORIES = [
  {
    icon: GraduationCap,
    title: "Gestion pédagogique",
    items: ["Élèves et classes CP1-CM2", "Matières et coefficients", "Barèmes /10 et /20", "Classements et compositions", "Bulletins scolaires"],
  },
  {
    icon: Building2,
    title: "Gestion administrative",
    items: ["Inscriptions et admissions", "Promotions automatiques", "Documents administratifs", "Signatures électroniques", "Rapports et statistiques"],
  },
  {
    icon: Zap,
    title: "Automatisation",
    items: ["Calcul automatique des moyennes", "Génération de documents", "Import intelligent", "Classement automatique", "Rapports en un clic"],
  },
  {
    icon: FolderDown,
    title: "Documents & impressions",
    items: ["Bulletins et fiches scolaires", "Listes de classes", "Relevés de notes", "Certificats de scolarité", "Documents officiels"],
  },
];

function Categories() {
  return (
    <Section className="bg-secondary/40">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Fonctionnalités"
            title="Une organisation claire en 4 familles"
            description="Chaque module est pensé pour un métier : enseigner, administrer, automatiser, imprimer. Vous n'apprenez qu'une seule interface."
          />
          <Button size="lg" className="mt-7 rounded-full" onClick={() => navigate("/fonctionnalites")}>
            Voir toutes les fonctionnalités
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <article key={c.title} className="card-hover rounded-2xl border bg-card p-5">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-[15px] font-semibold">{c.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {c.items.map((i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[13px] text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    {i}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── Captures d'écran (onglets) ───────────────────────────────
function Screenshots() {
  const [variant, setVariant] = useState<MockupVariant>("notes");
  return (
    <Section>
      <SectionHeading
        eyebrow="Le logiciel en images"
        title="Une interface claire, rapide et agréable"
        description="Conçue avec des enseignants et des directeurs d'école primaire : chaque écran est optimisé pour les tâches du quotidien."
      />
      <Tabs value={variant} onValueChange={(v) => setVariant(v as MockupVariant)} className="mt-10">
        <TabsList className="mx-auto flex flex-wrap justify-center gap-1 rounded-full p-1.5 h-auto">
          <TabsTrigger value="notes" className="rounded-full px-4 py-2">Saisie des notes</TabsTrigger>
          <TabsTrigger value="bulletin" className="rounded-full px-4 py-2">Bulletins</TabsTrigger>
          <TabsTrigger value="classement" className="rounded-full px-4 py-2">Classement</TabsTrigger>
          <TabsTrigger value="dashboard" className="rounded-full px-4 py-2">Tableau de bord</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mx-auto mt-8 max-w-4xl">
        <AppMockup key={variant} variant={variant} />
      </div>
    </Section>
  );
}

// ── Comment ça marche ────────────────────────────────────────
const STEPS = [
  { icon: UserPlus, title: "Créez votre compte", text: "Inscription gratuite en 2 minutes : nom, e-mail, établissement. Aucun engagement." },
  { icon: CreditCard, title: "Abonnement simple", text: "15 000 FCFA pour 12 mois. Payez par Wave ou Orange Money." },
  { icon: Download, title: "Téléchargez le logiciel", text: "Installez en quelques clics sur Windows et activez avec votre clé de licence." },
  { icon: KeyRound, title: "Gérez votre école primaire", text: "Notes, bulletins, certificats, classements, rapports : toute la gestion scolaire, sans stress." },
];

function HowItWorks() {
  return (
    <Section className="bg-secondary/40">
      <SectionHeading
        eyebrow="Parcours"
        title="De la création du compte au premier bulletin, en moins d'une heure"
        description="Un parcours simple, pensé pour que vous ne soyez jamais perdu."
      />
      <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl border bg-card p-6">
            <span className="absolute -top-3.5 left-6 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
              Étape {i + 1}
            </span>
            <span className="mb-4 mt-2 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <s.icon className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ── Aperçu des tarifs ────────────────────────────────────────
function PricingPreview() {
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => api.get<Plan[]>("/api/plans"),
    staleTime: 5 * 60_000,
  });

  return (
    <Section>
      <SectionHeading
        eyebrow="Tarifs"
        title="Des formules pour chaque structure"
        description="15 000 FCFA pour 12 mois. Payez par Wave ou Orange Money, puis envoyez la preuve du dépôt."
      />
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="mt-12 flex justify-center gap-6">
          {(plans ?? []).map((plan) => (
            <article
              key={plan.slug}
              className={`relative flex w-full max-w-xl flex-col rounded-2xl border bg-card p-7 ${
                plan.highlighted ? "border-emerald-600 shadow-xl shadow-emerald-600/10 ring-1 ring-emerald-600" : "card-hover"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white shadow">
                  Le plus choisi
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1.5 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-5">
                <span className="text-3xl font-extrabold tracking-tight">{formatFcfa(plan.annualPrice)}</span>
                <span className="text-sm text-muted-foreground"> / 12 mois</span>
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Accès complet pendant 12 mois
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    {f}
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-xs font-medium text-muted-foreground">+ {plan.features.length - 5} autres avantages</li>
                )}
              </ul>
              <Button
                className="mt-6 w-full rounded-full"
                variant={plan.highlighted ? "default" : "outline"}
                onClick={() => navigate("/tarifs")}
              >
                Choisir cette offre
              </Button>
            </article>
          ))}
        </div>
      )}
      <p className="mt-8 text-center">
        <Link to="/tarifs" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Comparer toutes les formules en détail →
        </Link>
      </p>
    </Section>
  );
}

// ── Témoignages ──────────────────────────────────────────────
function Testimonials() {
  const { data: items, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["testimonials"],
    queryFn: () => api.get<Testimonial[]>("/api/testimonials"),
    staleTime: 5 * 60_000,
  });

  return (
    <Section className="bg-secondary/40">
      <SectionHeading
        eyebrow="Témoignages"
        title="Ils utilisent Gestion Scolaire Pro Plus"
        description="Enseignants, directeurs et établissements qui ont simplifié leur quotidien."
      />
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((t) => (
            <figure key={t.id} className="card-hover flex flex-col rounded-2xl border bg-card p-6">
              <Stars rating={t.rating} />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed">
                « {t.content} »
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                <InitialsAvatar initials={t.initials} color={t.color} />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                  <p className="text-xs text-muted-foreground">{t.establishment}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Actualités ───────────────────────────────────────────────
function NewsPreview() {
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["articles", "limit3"],
    queryFn: () => api.get<Article[]>("/api/articles?limit=3"),
    staleTime: 5 * 60_000,
  });

  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          align="left"
          eyebrow="Actualités & nouveautés"
          title="Le logiciel évolue sans cesse"
        />
        <Link to="/actualites" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Toutes les actualités →
        </Link>
      </div>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {(articles ?? []).map((a) => (
            <article key={a.id} className="card-hover flex flex-col rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">{a.coverEmoji}</span>
                <p className="text-xs font-medium text-muted-foreground">{formatDate(a.publishedAt)}</p>
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug">
                <Link to={`/actualites?article=${a.slug}`} className="hover:text-primary transition-colors">
                  {a.title}
                </Link>
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
              <p className="mt-4">
                <Link to={`/actualites?article=${a.slug}`} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                  Lire l&apos;article →
                </Link>
              </p>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── FAQ (aperçu) ─────────────────────────────────────────────
function FaqPreview() {
  const { data: faqs, isLoading } = useQuery<FaqItem[]>({
    queryKey: ["faqs", "limit5"],
    queryFn: () => api.get<FaqItem[]>("/api/faqs?limit=5"),
    staleTime: 5 * 60_000,
  });

  return (
    <Section className="bg-secondary/40">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Questions fréquentes"
          title="Vous vous demandez peut-être…"
        />
        {isLoading ? (
          <Spinner />
        ) : (
          <Accordion type="single" collapsible className="mt-10">
            {(faqs ?? []).map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="text-left text-[15px] font-semibold">{f.question}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        <p className="mt-8 text-center">
          <Link to="/faq" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Consulter la FAQ complète →
          </Link>
        </p>
      </div>
    </Section>
  );
}

// ── CTA final ────────────────────────────────────────────────
function FinalCta() {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 px-6 py-16 text-center text-white sm:px-12">
        <div className="gspp-dots absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Simplifiez votre travail avec Gestion Scolaire Pro Plus !
          </h2>
          <p className="mt-4 text-base leading-relaxed text-emerald-50/90">
            Rejoignez les centaines d&apos;établissements qui gagnent du temps chaque jour.
            Créez votre compte gratuitement, choisissez votre formule quand vous voulez.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="rounded-full bg-white text-emerald-900 hover:bg-emerald-50" onClick={() => navigate("/inscription")}>
              Créer mon compte gratuitement
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/telecharger")}>
              Télécharger maintenant
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/support")}>
              Besoin d&apos;aide ?
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ── Page ─────────────────────────────────────────────────────
export function HomePage() {
  return (
    <main id="contenu">
      <Hero />
      <StatsBand />
      <Advantages />
      <Categories />
      <Screenshots />
      <HowItWorks />
      <PricingPreview />
      <Testimonials />
      <NewsPreview />
      <FaqPreview />
      <FinalCta />
    </main>
  );
}
