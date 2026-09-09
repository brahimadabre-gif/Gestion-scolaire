"use client";

// ── Tutoriel : Comment créer votre compte Gestion Scolaire Pro Plus ? ──
import { navigate } from "../router";
import { PageHero } from "../page-hero";
import { AppMockup } from "../app-mockup";
import { Section } from "../ui-bits";
import { Button } from "@/components/ui/button";
import {
  MousePointerClick, ClipboardList, MailCheck, LogIn, CreditCard, Download, CheckCircle2,
} from "lucide-react";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Étape 1 — Cliquer sur « Créer un compte »",
    text: "En haut du site, cliquez sur le bouton « Créer un compte ». Il est visible sur toutes les pages, sur ordinateur comme sur téléphone. Vous arrivez sur le formulaire d'inscription sécurisé.",
    mock: "form" as const,
  },
  {
    icon: ClipboardList,
    title: "Étape 2 — Renseigner les informations demandées",
    text: "Saisissez votre nom, prénom, adresse e-mail, numéro de téléphone, le nom de votre établissement et votre pays. Choisissez un mot de passe solide : au moins 8 caractères, avec une majuscule, une minuscule et un chiffre. Un indicateur de robustesse vous guide en temps réel.",
    mock: "form" as const,
  },
  {
    icon: MailCheck,
    title: "Étape 3 — Valider l'adresse e-mail si nécessaire",
    text: "Selon la configuration du site, un e-mail de vérification peut vous être envoyé. Ouvrez-le et cliquez sur le lien de validation. Pensez à vérifier vos courriers indésirables si l'e-mail n'arrive pas sous quelques minutes.",
    mock: "email" as const,
  },
  {
    icon: LogIn,
    title: "Étape 4 — Se connecter",
    text: "Votre compte est prêt : connectez-vous avec votre e-mail et votre mot de passe. Vous accédez à votre tableau de bord personnel, qui centralise abonnement, licence, téléchargements et support.",
    mock: "dashboard" as const,
  },
  {
    icon: CreditCard,
    title: "Étape 5 — Choisir une formule d'abonnement",
    text: "Depuis votre tableau de bord, cliquez sur « Souscrire un abonnement » et choisissez la formule Professionnel. Réglez 15 000 FCFA pour 12 mois par Wave (QR ou dépôt) ou Orange Money sur le +225 07 09 93 33 64, puis envoyez votre nom, prénom et la preuve du dépôt par WhatsApp.",
    mock: "dashboard" as const,
  },
  {
    icon: Download,
    title: "Étape 6 — Télécharger et activer le logiciel",
    text: "Téléchargez l'installateur depuis la page « Télécharger », installez-le sur votre ordinateur Windows, puis copiez votre clé de licence depuis le tableau de bord pour activer le logiciel. Vous êtes prêt à gérer votre établissement !",
    mock: "dashboard" as const,
  },
];

function VisualMock({ kind }: { kind: "form" | "email" | "dashboard" }) {
  if (kind === "dashboard") return <AppMockup variant="dashboard" />;
  if (kind === "email") {
    return (
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
        <div className="border-b bg-muted/70 px-4 py-2.5 text-[11px] font-medium text-muted-foreground">
          ✉ Boîte de réception — Gestion Scolaire Pro Plus
        </div>
        <div className="p-6 text-sm">
          <p className="text-xs text-muted-foreground">De : noreply@gestionscolaireproplus.com</p>
          <p className="mt-3 font-bold">Confirmez votre adresse e-mail</p>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Bienvenue ! Cliquez sur le bouton ci-dessous pour valider votre adresse e-mail et activer votre compte.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Valider mon adresse e-mail
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border bg-card shadow-xl">
      <div className="border-b bg-muted/70 px-4 py-2.5 text-[11px] font-semibold">
        Créer un compte — Gestion Scolaire Pro Plus
      </div>
      <div className="space-y-2.5 p-5 text-[12px]">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border bg-background px-3 py-2 text-muted-foreground">Prénom</div>
          <div className="rounded-lg border bg-background px-3 py-2 text-muted-foreground">Nom</div>
        </div>
        <div className="rounded-lg border bg-background px-3 py-2 text-muted-foreground">Adresse e-mail</div>
        <div className="rounded-lg border bg-background px-3 py-2 text-muted-foreground">Téléphone</div>
        <div className="rounded-lg border bg-background px-3 py-2 text-muted-foreground">Établissement</div>
        <div className="flex items-center justify-between rounded-lg border border-emerald-600/40 bg-emerald-600/5 px-3 py-2">
          <span className="font-medium">••••••••••</span>
          <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            Mot de passe : fort
          </span>
        </div>
        <div className="rounded-full bg-emerald-600 py-2.5 text-center font-bold text-white">Créer mon compte</div>
      </div>
    </div>
  );
}

export function TutorialPage() {
  return (
    <main id="contenu">
      <PageHero
        eyebrow="Tutoriel"
        title="Comment créer votre compte Gestion Scolaire Pro Plus ?"
        description="Le parcours complet, étape par étape, du clic sur « Créer un compte » à l'activation du logiciel. Moins de 10 minutes en tout."
      >
        <Button size="lg" className="rounded-full" onClick={() => navigate("/inscription")}>
          Commencer maintenant
        </Button>
      </PageHero>

      <Section>
        <div className="space-y-16">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                    <s.icon className="h-5.5 w-5.5" aria-hidden="true" />
                  </span>
                  <h2 className="text-xl font-bold tracking-tight">{s.title}</h2>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{s.text}</p>
                {i === 5 && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button className="rounded-full" onClick={() => navigate("/inscription")}>Créer mon compte</Button>
                    <Button variant="outline" className="rounded-full" onClick={() => navigate("/telecharger")}>Télécharger</Button>
                  </div>
                )}
              </div>
              <VisualMock kind={s.mock} />
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-secondary/40">
        <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold">Besoin d&apos;aide pendant l&apos;inscription ?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            La notice d&apos;utilisation détaille chaque étape avec des captures d&apos;écran,
            et le support répond sous 24 h ouvrées si vous bloquez.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/notice?section=creation-compte")}>
              Voir la section correspondante de la notice
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={() => navigate("/support")}>
              Contacter le support
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
