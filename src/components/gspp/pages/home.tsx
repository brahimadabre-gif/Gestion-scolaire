"use client";

// ── Page d'accueil — Gestion Scolaire Pro Plus ───────────────
import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api, Article, FaqItem, Plan, Testimonial } from "../api";
import { Link, navigate } from "../router";
import { Section, SectionHeading, Stars, InitialsAvatar, Spinner } from "../ui-bits";
import { formatDate, formatFcfa } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, BookOpen, GraduationCap, FileText, Building2,
  ShieldCheck, Sparkles, Download, CheckCircle2, Monitor,
  Cloud, UserPlus, KeyRound, Zap, ClipboardList, Layers,
} from "lucide-react";

// ── Hero ─────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="gspp-hero-glow absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <Badge variant="outline" className="animate-fade-up mb-5 gap-1.5 rounded-full border-orange-600/30 bg-orange-600/5 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-400">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Pour les écoles primaires · CP1 à CM2
            </Badge>
            <h1 className="animate-fade-up-delay-1 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Toute la gestion de l’école, <span className="gspp-gradient-text">plus simplement.</span>
            </h1>
            <p className="animate-fade-up-delay-2 mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Élèves, classes, appels, notes et bulletins : rassemblez les tâches scolaires dans une
              seule application, sur ordinateur Windows ou Android.
            </p>
            <div className="animate-fade-up-delay-3 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="w-full rounded-full text-base shadow-lg shadow-orange-600/20 sm:w-auto" onClick={() => navigate("/inscription")}>
                Créer un compte
                <UserPlus className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" className="w-full rounded-full text-base sm:w-auto" onClick={() => navigate("/telecharger")}>
                <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Télécharger le logiciel
              </Button>
            </div>
            <ul className="animate-fade-up-delay-3 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" aria-hidden="true" /> Windows 10/11 et Android
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" aria-hidden="true" /> Vos données restent chez vous
              </li>
              <li className="flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" aria-hidden="true" /> Fonctionne hors connexion
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Statistiques ─────────────────────────────────────────────
function StatsBand() {
  const stats = [
      // Chiffres vérifiables (caractéristiques du logiciel), pas d'estimations.
      { value: "CP1 → CM2", label: "les 6 niveaux du primaire" },
      { value: "100 %", label: "utilisable hors connexion" },
      { value: "2", label: "plateformes : Windows et Android" },
      { value: "24 h", label: "réponse du support (jours ouvrés)" },
  ];
  return (
    <section className="border-y bg-secondary/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold tracking-tight text-orange-700 dark:text-orange-400 sm:text-4xl">{s.value}</p>
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
  { icon: ClipboardList, title: "Appel et assiduité", text: "Suivez les présences et absences de vos élèves, classe par classe." },
  { icon: BookOpen, title: "Notes et moyennes", text: "Saisissez les notes et laissez le logiciel calculer les moyennes et les classements." },
  { icon: FileText, title: "Bulletins et documents", text: "Préparez des bulletins, certificats et listes prêts à imprimer ou à exporter." },
  { icon: Zap, title: "Travail hors connexion", text: "Continuez à gérer votre école même lorsque la connexion Internet est indisponible." },
];

function Advantages() {
  return (
    <Section id="presentation">
      <SectionHeading
        eyebrow="Présentation du logiciel"
        title="Les outils essentiels de votre école, réunis au même endroit"
        description="De la gestion des élèves à l’impression des bulletins, retrouvez les fonctions du quotidien dans une interface claire."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ADVANTAGES.map((a) => (
          <article key={a.title} className="card-hover rounded-2xl border bg-card p-6">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600/10 text-orange-700 dark:text-orange-400">
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

// ── Les personnes qui utilisent le logiciel ─────────────────
function SchoolRoles() {
  return (
    <Section className="bg-secondary/40">
      <SectionHeading
        eyebrow="Pour toute l’équipe éducative"
        title="Un outil adapté à chaque rôle dans l’école"
        description="Enseignants et responsables partagent les informations utiles, avec des outils conçus pour leurs tâches quotidiennes."
      />
      <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
        <article className="rounded-3xl border bg-card p-7 sm:p-8">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600/10 text-orange-700 dark:text-orange-400"><GraduationCap className="h-6 w-6" aria-hidden="true" /></span>
          <h3 className="text-xl font-bold">Pour les enseignants</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />Faire l’appel et suivre l’assiduité.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />Saisir les notes et consulter les moyennes.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />Consulter les fiches pédagogiques hors connexion.</li>
          </ul>
        </article>
        <article className="rounded-3xl border bg-card p-7 sm:p-8">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600/10 text-orange-700 dark:text-orange-400"><Building2 className="h-6 w-6" aria-hidden="true" /></span>
          <h3 className="text-xl font-bold">Pour les directeurs et l’administration</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />Suivre les effectifs et l’organisation des classes.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />Préparer bulletins, certificats et documents administratifs.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />Consulter les résultats et rapports de l’établissement.</li>
          </ul>
        </article>
      </div>
    </Section>
  );
}

// ── Captures d'écran (onglets) ───────────────────────────────
const PRESENTATION_IMAGES = [
  { label: "Accueil", src: "/presentation/presentation-pc-1.png", alt: "Écran d'accueil de Gestion Scolaire Pro Plus" },
  { label: "Tableau de bord", src: "/presentation/presentation-pc-2.png", alt: "Tableau de bord de Gestion Scolaire Pro Plus" },
  { label: "Registre d'appel", src: "/presentation/presentation-pc-3.png", alt: "Registre d'appel de Gestion Scolaire Pro Plus" },
  { label: "Gestion des matières", src: "/presentation/presentation-pc-4.png", alt: "Gestion des matières de Gestion Scolaire Pro Plus" },
  { label: "Bulletin scolaire", src: "/presentation/presentation-pc-5.png", alt: "Bulletin scolaire de Gestion Scolaire Pro Plus" },
] as const;

function Screenshots() {
  const [selectedImage, setSelectedImage] = useState(0);
  const image = PRESENTATION_IMAGES[selectedImage];
  return (
    <Section>
      <SectionHeading
        eyebrow="Le logiciel en images"
        title="Une interface claire, rapide et agréable"
        description="Découvrez les écrans réels de Gestion Scolaire Pro Plus, conçus pour les tâches quotidiennes des écoles primaires."
      />
      <Tabs value={String(selectedImage)} onValueChange={(v) => setSelectedImage(Number(v))} className="mt-10">
        <TabsList className="mx-auto flex flex-wrap justify-center gap-1 rounded-full p-1.5 h-auto">
          {PRESENTATION_IMAGES.map((item, index) => (
            <TabsTrigger key={item.src} value={String(index)} className="rounded-full px-4 py-2">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-xl">
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          width={1536}
          height={1024}
          className="h-auto w-full object-contain"
          priority={selectedImage === 0}
        />
      </div>
    </Section>
  );
}

const ANDROID_PRESENTATION_IMAGES = [
  { label: "Accueil Android", src: "/presentation/presentation-android-1.png", alt: "Écran d'accueil de Gestion Scolaire Pro Plus sur Android" },
  { label: "Tableau de bord", src: "/presentation/presentation-android-2.png", alt: "Tableau de bord de Gestion Scolaire Pro Plus sur Android" },
  { label: "Menu principal", src: "/presentation/presentation-android-3.png", alt: "Menu principal de Gestion Scolaire Pro Plus sur Android" },
  { label: "Bulletin scolaire", src: "/presentation/presentation-android-4.png", alt: "Bulletin scolaire de Gestion Scolaire Pro Plus sur Android" },
] as const;

function AndroidScreenshots() {
  const [selectedImage, setSelectedImage] = useState(0);
  const image = ANDROID_PRESENTATION_IMAGES[selectedImage];

  return (
    <Section className="bg-secondary/40">
      <SectionHeading
        eyebrow="Présentation Android"
        title="Gestion Scolaire Pro Plus dans votre poche"
        description="Retrouvez vos élèves, vos résultats et vos documents essentiels depuis votre téléphone Android."
      />
      <Tabs value={String(selectedImage)} onValueChange={(v) => setSelectedImage(Number(v))} className="mt-10">
        <TabsList className="mx-auto flex h-auto flex-wrap justify-center gap-1 rounded-full p-1.5">
          {ANDROID_PRESENTATION_IMAGES.map((item, index) => (
            <TabsTrigger key={item.src} value={String(index)} className="rounded-full px-4 py-2">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border bg-card p-3 shadow-xl sm:p-5">
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          width={1080}
          height={1536}
          className="mx-auto h-auto max-h-[780px] w-auto max-w-full object-contain"
          priority={selectedImage === 0}
        />
      </div>
    </Section>
  );
}

// ── Comment ça marche ────────────────────────────────────────
const STEPS = [
  { icon: UserPlus, title: "Créez votre compte", text: "Renseignez les informations de votre établissement pour accéder à votre espace client." },
  { icon: KeyRound, title: "Obtenez votre clé", text: "Contactez le développeur pour connaître les étapes d’obtention de votre clé d’activation." },
  { icon: Download, title: "Installez le logiciel", text: "Téléchargez l’application sur Windows ou Android, puis activez-la avec votre clé." },
];

function HowItWorks() {
  return (
    <Section className="bg-secondary/40">
      <SectionHeading
        eyebrow="Parcours"
        title="Votre logiciel prêt en trois étapes"
        description="Créez votre compte, obtenez votre clé et installez Gestion Scolaire Pro Plus."
      />
      <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl border bg-card p-6">
            <span className="absolute -top-3.5 left-6 rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow">
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
        description="Consultez les formules disponibles et contactez le développeur pour obtenir une clé d’activation."
      />
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="mt-12 flex justify-center gap-6">
          {(plans ?? []).map((plan) => (
            <article
              key={plan.slug}
              className={`relative flex w-full max-w-xl flex-col rounded-2xl border bg-card p-7 ${
                plan.highlighted ? "border-orange-600 shadow-xl shadow-orange-600/10 ring-1 ring-orange-600" : "card-hover"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 px-4 py-1 text-xs font-bold text-white shadow">
                  Le plus choisi
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1.5 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-5">
                <span className="text-3xl font-extrabold tracking-tight">{formatFcfa(plan.annualPrice)}</span>
                <span className="text-sm text-muted-foreground"> / 12 mois</span>
              </p>
              <p className="mt-1 text-xs font-medium text-orange-700 dark:text-orange-400">
                Accès complet pendant 12 mois
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
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

  // Aucun témoignage publié : la section n'est pas affichée (pas de titre seul).
  if (!isLoading && (!items || items.length === 0)) return null;

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-700 via-orange-800 to-amber-900 px-6 py-16 text-center text-white sm:px-12">
        <div className="gspp-dots absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Simplifiez votre travail avec Gestion Scolaire Pro Plus !
          </h2>
          <p className="mt-4 text-base leading-relaxed text-orange-50/90">
            Créez votre compte, téléchargez le logiciel et contactez le développeur pour obtenir votre clé d’activation.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="rounded-full bg-white text-orange-900 hover:bg-orange-50" onClick={() => navigate("/inscription")}>
              Créer mon compte gratuitement
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/telecharger")}>
              Télécharger maintenant
            </Button>
            <Button size="lg" variant="outline" className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/tarifs")}>
              Voir les formules
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
      <Screenshots />
      <AndroidScreenshots />
      <StatsBand />
      <Advantages />
      <SchoolRoles />
      <HowItWorks />
      <PricingPreview />
      <Testimonials />
      <NewsPreview />
      <FaqPreview />
      <FinalCta />
    </main>
  );
}
