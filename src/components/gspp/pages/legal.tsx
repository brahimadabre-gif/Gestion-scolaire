"use client";

// ── Pages légales — CGU, confidentialité, cookies, mentions ──
import { PageHero } from "../page-hero";
import { Section } from "../ui-bits";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/site";

const LAST_UPDATE = "1er septembre 2026";

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export function LegalPage({ kind }: { kind: "cgu" | "confidentialite" | "cookies" | "mentions" }) {
  const titles: Record<string, string> = {
    cgu: "Conditions générales d'utilisation",
    confidentialite: "Politique de confidentialité",
    cookies: "Politique de cookies",
    mentions: "Mentions légales",
  };
  const intros: Record<string, string> = {
    cgu: `Les présentes conditions régissent l'utilisation du site officiel ${SITE.name} et du logiciel associé. Toute souscription d'abonnement implique leur acceptation sans réserve.`,
    confidentialite: `Votre confiance est notre priorité. Cette politique explique quelles données nous collectons, pourquoi, et comment nous les protégeons. Elle est conforme à la loi ivoirienne n°2013-450 relative à la protection des données à caractère personnel.`,
    cookies: "Cette page explique quels cookies et technologies similaires sont utilisés sur ce site, et comment les maîtriser.",
    mentions: "Informations légales relatives à l'éditeur du site et du logiciel.",
  };

  return (
    <main id="contenu">
      <PageHero eyebrow="Légal" title={titles[kind]} description={intros[kind]} />
      <Section>
        <div className="mx-auto max-w-3xl space-y-8 rounded-3xl border bg-card p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dernière mise à jour : {LAST_UPDATE}
          </p>

          {kind === "cgu" && (
            <>
              <LegalSection title="1. Objet">
                <p>
                  {SITE.name} est un logiciel de gestion d&apos;établissement scolaire distribué par
                  abonnement. Les présentes CGU encadrent l&apos;accès au site, la création de compte,
                  la souscription d&apos;abonnement, le téléchargement et l&apos;utilisation du logiciel.
                </p>
              </LegalSection>
              <LegalSection title="2. Compte utilisateur">
                <p>
                  La création d&apos;un compte nécessite des informations exactes et à jour. Le titulaire
                  est responsable de la confidentialité de son mot de passe et de l&apos;activité réalisée
                  sous son compte. Tout compte dont l&apos;utilisation serait jugée abusive pourra être
                  suspendu après notification.
                </p>
              </LegalSection>
              <LegalSection title="3. Abonnement et paiement">
                <p>
                  Les formules, tarifs et périodes sont détaillés sur la page Tarifs. L&apos;abonnement
                  prend effet à la confirmation du paiement et court pour la période choisie. Les prix
                  sont indiqués en francs CFA (XOF), toutes taxes comprises. Le renouvellement ajoute la
                  durée souscrite à la fin de la période en cours : aucun jour n&apos;est perdu.
                </p>
              </LegalSection>
              <LegalSection title="4. Licence d'utilisation du logiciel">
                <p>
                  L&apos;abonnement concède une licence d&apos;utilisation non exclusive et non
                  transférable du logiciel, pour le nombre d&apos;appareils prévu par la formule. La
                  licence est active tant que l&apos;abonnement est en cours de validité. Toute
                  reproduction, revente ou ingénierie inverse du logiciel est interdite.
                </p>
              </LegalSection>
              <LegalSection title="5. Responsabilité des données scolaires">
                <p>
                  Les données saisies dans le logiciel (élèves, notes, bulletins) restent stockées sur
                  l&apos;ordinateur de l&apos;établissement : {SITE.name} n&apos;en conserve aucune copie.
                  L&apos;établissement reste responsable de ses sauvegardes — le logiciel intègre un
                  module de sauvegarde à cet effet.
                </p>
              </LegalSection>
              <LegalSection title="6. Support et disponibilité">
                <p>
                  Le support répond sous 24 heures ouvrées (prioritaire pour les formules Professionnel
                  et Établissement). L&apos;équipe s&apos;efforce d&apos;assurer la continuité du site et
                  des services, dans la limite des maintenances techniques nécessaires.
                </p>
              </LegalSection>
              <LegalSection title="7. Résiliation">
                <p>
                  L&apos;abonnement est proposé pour une durée de 12 mois au tarif de 15 000 FCFA.
                  L&apos;utilisateur peut supprimer son compte à tout moment en contactant le support.
                </p>
              </LegalSection>
            </>
          )}

          {kind === "confidentialite" && (
            <>
              <LegalSection title="1. Données collectées">
                <p>
                  Nous collectons uniquement les données nécessaires : identité (nom, prénom),
                  coordonnées (e-mail, téléphone), établissement et pays, ainsi que l&apos;historique de
                  vos abonnements et paiements. Aucune donnée d&apos;élève (notes, bulletins, dossiers)
                  ne transite par nos serveurs : le logiciel les conserve sur votre ordinateur.
                </p>
              </LegalSection>
              <LegalSection title="2. Finalités">
                <p>
                  Ces données servent à : gérer votre compte et votre abonnement, générer vos factures,
                  activer votre licence, vous fournir le support et vous informer des nouveautés si vous
                  y avez consenti. Le journal de sécurité enregistre les actions sensibles (connexions,
                  paiements) pour protéger votre compte.
                </p>
              </LegalSection>
              <LegalSection title="3. Sécurité">
                <p>
                  Les mots de passe sont chiffrés (hachage bcrypt — jamais stockés en clair), les
                  communications sont protégées par HTTPS, les sessions reposent sur des cookies
                  sécurisés et les tentatives de connexion abusives sont bloquées automatiquement.
                  Aucune donnée de carte bancaire n&apos;est stockée : le paiement est délégué à des
                  prestataires certifiés.
                </p>
              </LegalSection>
              <LegalSection title="4. Conservation et droits">
                <p>
                  Les données de compte sont conservées pendant la durée de la relation puis archivées
                  conformément aux obligations comptables. Vous disposez d&apos;un droit d&apos;accès, de
                  rectification et de suppression : écrivez à {SITE.email}. Vous pouvez également
                  demander l&apos;export de vos données à tout moment.
                </p>
              </LegalSection>
            </>
          )}

          {kind === "cookies" && (
            <>
              <LegalSection title="Cookies essentiels">
                <p>
                  Le site utilise un cookie de session strictement nécessaire (gspp_session) pour vous
                  maintenir connecté. Il est chiffré, limité à votre navigateur et expire au bout de 7
                  jours. Sans ce cookie, la connexion à l&apos;espace client ne peut pas fonctionner.
                </p>
              </LegalSection>
              <LegalSection title="Préférences">
                <p>
                  Votre choix de thème (clair ou sombre) est mémorisé localement dans votre navigateur
                  (stockage local). Cette information ne quitte jamais votre appareil.
                </p>
              </LegalSection>
              <LegalSection title="Mesure d'audience et cookies tiers">
                <p>
                  Aucun cookie publicitaire ni traceur tiers n&apos;est déposé par ce site. Si un outil
                  de mesure d&apos;audience est ajouté ultérieurement, cette page sera mise à jour et
                  votre consentement sera recueilli préalablement.
                </p>
              </LegalSection>
              <LegalSection title="Gérer les cookies">
                <p>
                  Vous pouvez à tout moment supprimer les cookies via les réglages de votre navigateur.
                  La suppression du cookie de session vous déconnectera simplement de votre espace.
                </p>
              </LegalSection>
            </>
          )}

          {kind === "mentions" && (
            <>
              <LegalSection title="Éditeur du site">
                <p>
                  {SITE.name} — {SITE.addressLine}<br />
                  Contact : {SITE.email} · {SITE.phone}
                </p>
              </LegalSection>
              <LegalSection title="Hébergement">
                <p>
                  Le site est hébergé sur une infrastructure cloud sécurisée (HTTPS, pare-feu, sauvegardes
                  quotidiennes). Les coordonnées complètes de l&apos;hébergeur seront insérées ici lors
                  de la mise en production définitive.
                </p>
              </LegalSection>
              <LegalSection title="Propriété intellectuelle">
                <p>
                  Le logiciel, le site et l&apos;ensemble de leurs contenus (textes, visuels, logos,
                  interface) sont protégés par le droit d&apos;auteur. Toute reproduction non autorisée
                  est interdite.
                </p>
              </LegalSection>
              <LegalSection title="Droit applicable">
                <p>
                  Les présentes mentions sont soumises au droit ivoirien. Tout litige relatif à
                  l&apos;utilisation du site relève des tribunaux compétents d&apos;Abidjan, après
                  tentative de résolution amiable.
                </p>
              </LegalSection>
            </>
          )}
        </div>
      </Section>
    </main>
  );
}
