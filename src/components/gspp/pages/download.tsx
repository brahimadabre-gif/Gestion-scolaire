"use client";

// ── Page Télécharger — détection OS, version, installation ──
import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, SoftwareVersion } from "../api";
import { navigate } from "../router";
import { useAuth } from "../auth-context";
import { PageHero } from "../page-hero";
import { Section, SectionHeading, Spinner } from "../ui-bits";
import { formatDate } from "@/lib/site";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import {
  LogIn, Monitor, Smartphone, Download as DownloadIcon,
  HardDrive, Cpu, MemoryStick, ShieldCheck, PackageCheck, LifeBuoy, Info,
} from "lucide-react";

type OS = "windows" | "android" | "other";

function detectOS(): OS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("android")) return "android";
  if (ua.includes("mobile")) return "other";
  return "other";
}

// Snapshot stable pour useSyncExternalStore (client) — évite les écarts d'hydratation
let cachedOs: OS | null = null;
function getClientOs(): OS {
  if (cachedOs === null) cachedOs = detectOS();
  return cachedOs;
}
const subscribeNoop = () => () => {};
const getServerOs = () => "other" as OS;

const ANDROID_INSTALLER_URL =
  "https://github.com/brahimadabre-gif/Gestion-scolaire/raw/refs/heads/main/public/downloads/gestion%20scolaire%20pro%20plus%20v%201-5.apk";
const ANDROID_INSTALLER_NAME = "gestion scolaire pro plus v 1-5.apk";

export function DownloadPage() {
  const { user, subscription } = useAuth();
  // OS détecté automatiquement (client uniquement) — l'utilisateur peut le changer via les onglets
  const detectedOs = useSyncExternalStore(subscribeNoop, getClientOs, getServerOs);
  const [selectedOs, setSelectedOs] = useState<OS | null>(null);
  const os: OS = selectedOs ?? detectedOs;
  const { data: version, isLoading } = useQuery<SoftwareVersion>({
    queryKey: ["version"],
    queryFn: () => api.get<SoftwareVersion>("/api/versions"),
    staleTime: 60_000,
  });
  const hasInstaller = Boolean(version?.downloadUrl?.trim());

  const osLabel: Record<OS, string> = {
    windows: "Windows",
    android: "Android",
    other: "votre système",
  };

  return (
    <main id="contenu">
      <PageHero
        eyebrow="Téléchargement"
        title="Télécharger Gestion Scolaire Pro Plus"
        description="Gestion Scolaire Pro Plus est disponible sur Windows et Android. L'accès complet coûte 15 000 FCFA pour 12 mois après activation de l'abonnement."
      />

      {/* Bloc de téléchargement principal */}
      <Section>
        {isLoading || !version ? (
          <Spinner />
        ) : (
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border bg-card p-8 shadow-lg sm:p-10">
              <div className="flex flex-col items-center gap-6 text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xl shadow-emerald-600/25"
                  aria-hidden="true"
                >
                  <PackageCheck className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    Gestion Scolaire Pro Plus {version.version}
                  </h2>
                </div>

                {/* Détection de l'OS */}
                <div className="w-full max-w-md">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Système détecté : {osLabel[os]}
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-2" role="group" aria-label="Choix de la plateforme">
                    {(
                      [
                        { id: "windows", icon: Monitor, label: "Windows" },
                        { id: "android", icon: Smartphone, label: "Android" },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setSelectedOs(o.id)}
                        aria-pressed={os === o.id}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3.5 text-xs font-semibold transition ${
                          os === o.id
                            ? "border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-background text-muted-foreground hover:border-ring/50"
                        }`}
                      >
                        <o.icon className="h-5 w-5" aria-hidden="true" />
                        {o.label}
                      </button>
                    ))}
                  </div>

                  {/* Lien de téléchargement configurable (SoftwareVersion.downloadUrl en base) */}
                  {os === "windows" && hasInstaller ? (
                    <Button
                      size="lg"
                      className="w-full rounded-full text-base"
                      onClick={() => {
                        if (version.downloadUrl) {
                          window.open(version.downloadUrl, "_blank", "noopener");
                        }
                      }}
                    >
                      <DownloadIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      Télécharger pour Windows ({version.fileSizeMb} Mo)
                    </Button>
                  ) : os === "android" ? (
                    <Button
                      size="lg"
                      className="w-full rounded-full text-base"
                      onClick={() => window.open(ANDROID_INSTALLER_URL, "_blank", "noopener")}
                    >
                      <DownloadIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      Télécharger pour Android (8,9 Mo)
                    </Button>
                  ) : (
                    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
                      <p className="flex items-center justify-center gap-2 font-semibold">
                        <Info className="h-4 w-4" aria-hidden="true" />
                        Aucun installateur ajouté
                      </p>
                      <p className="mt-1.5 leading-relaxed">
                        Le téléchargement apparaîtra ici dès qu&apos;un fichier réel aura été ajouté par l&apos;administrateur.
                      </p>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {os === "android"
                      ? `Fichier : ${ANDROID_INSTALLER_NAME} · Installer pour Android`
                      : hasInstaller
                        ? `Fichier : ${version.installerName} · Installer pour Windows`
                        : "Aucun installateur ajouté pour le moment"}
                  </p>
                </div>
              </div>

              {/* Configuration minimale */}
              <div className="mt-8 grid gap-4 border-t pt-8 sm:grid-cols-3">
                {[
                  { icon: Monitor, label: "Système", value: version.minOs },
                  { icon: MemoryStick, label: "Mémoire", value: "4 Go de RAM (8 Go recommandés)" },
                  { icon: HardDrive, label: "Espace disque", value: "500 Mo disponibles" },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-emerald-700 dark:text-emerald-400">
                      <c.icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
                      <p className="mt-0.5 text-sm">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raccourcis compte */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border bg-card p-5">
                <div>
                  <h3 className="text-[15px] font-semibold">Vous avez déjà un compte ?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Connectez-vous pour activer votre licence.</p>
                </div>
                <Button variant="outline" className="shrink-0 rounded-full" onClick={() => navigate(user ? "/compte" : "/connexion")}>
                  <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {user ? "Mon compte" : "Se connecter"}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-2xl border bg-card p-5">
                <div>
                  <h3 className="text-[15px] font-semibold">Besoin d&apos;aide pour installer ?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Suivez le tutoriel pas à pas de la notice.</p>
                </div>
                <Button variant="outline" className="shrink-0 rounded-full" onClick={() => navigate("/notice?section=installation")}>
                  <LifeBuoy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Tutoriel d&apos;installation
                </Button>
              </div>
            </div>

            {subscription?.status === "ACTIVE" && (
              <div className="mt-6 rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-5 text-sm">
                <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Votre abonnement « {subscription.plan.name} » est actif
                </p>
                <p className="mt-1.5 text-muted-foreground">
                  Installez le logiciel puis activez-le avec la clé de licence affichée dans votre tableau de bord.
                </p>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Journal des modifications */}
      {version && (
        <Section className="bg-secondary/40">
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              eyebrow="Historique"
              title={`Nouveautés de la version ${version.version}`}
            />
            <div className="prose-neutral mt-10 rounded-2xl border bg-card p-7">
              <ReactMarkdown
                components={{
                  h2: (p) => <h3 className="mb-2 mt-5 text-base font-bold first:mt-0" {...p} />,
                  li: (p) => <li className="mb-1.5 ml-5 list-disc text-sm leading-relaxed text-muted-foreground" {...p} />,
                  strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
                }}
              >
                {version.changelog}
              </ReactMarkdown>
            </div>
          </div>
        </Section>
      )}

      {/* Instructions d'installation */}
      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="Installation"
            title="Installer le logiciel en 4 étapes"
          />
          <ol className="mt-10 space-y-5">
            {[
              { t: "Lancez l'installateur", d: "Ouvrez le fichier téléchargé. Si Windows affiche un avertissement de sécurité, cliquez sur « Informations complémentaires » puis « Exécuter quand même »." },
              { t: "Suivez l'assistant", d: "Acceptez la licence d'utilisation et conservez le dossier d'installation par défaut, puis cliquez sur « Installer »." },
              { t: "Ouvrez le logiciel", d: "Au premier lancement, Gestion Scolaire Pro Plus prépare sa base de données locale sur votre ordinateur." },
              { t: "Activez votre licence", d: "Copiez la clé de licence depuis votre tableau de bord et collez-la dans l'écran d'activation du logiciel." },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-2xl bg-secondary/70 p-5 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Sur tablette ou téléphone ?
            </p>
            <p className="mt-1.5 text-muted-foreground">
              Gestion Scolaire Pro Plus est disponible sur ordinateur Windows et sur Android.
              Le même compte et la même licence permettent de retrouver votre accès sur vos appareils compatibles.
            </p>
          </div>
        </div>
      </Section>
    </main>
  );
}
