// ─────────────────────────────────────────────────────────────
// Seed — Gestion Scolaire Pro Plus
// Contenu initial : formules, FAQ, témoignages, articles,
// documentation, version logicielle, paramètres, comptes démo.
// Exécution : bun prisma/seed.ts
// ─────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seed — Gestion Scolaire Pro Plus");

  // ── Comptes ────────────────────────────────────────────────
  const adminPass = await bcrypt.hash("Admin@2026!", 10);
  const demoPass = await bcrypt.hash("Demo@2026!", 10);
  const siteAdminUsername = process.env.SITE_ADMIN_USERNAME ?? "brahima05";
  const siteAdminPassword = process.env.SITE_ADMIN_PASSWORD;

  if (siteAdminPassword) {
    await db.user.upsert({
      where: { email: siteAdminUsername },
      update: { password: await bcrypt.hash(siteAdminPassword, 10), role: "ADMIN", active: true },
      create: {
        firstName: "Brahima", lastName: "Dabre", email: siteAdminUsername,
        password: await bcrypt.hash(siteAdminPassword, 10),
        establishment: "Gestion Scolaire Pro Plus", country: "Côte d'Ivoire",
        role: "ADMIN", emailVerified: true,
      },
    });
  }

  const admin = await db.user.upsert({
    where: { email: "admin@gspp.ci" },
    update: {},
    create: {
      firstName: "Awa", lastName: "Diallo",
      email: "admin@gspp.ci", password: adminPass,
      phone: "+225 07 00 00 00 01",
      establishment: "Gestion Scolaire Pro Plus",
      country: "Côte d'Ivoire", role: "ADMIN", emailVerified: true,
    },
  });

  const demo = await db.user.upsert({
    where: { email: "demo@gspp.ci" },
    update: {},
    create: {
      firstName: "Ibrahim", lastName: "Traoré",
      email: "demo@gspp.ci", password: demoPass,
      phone: "+225 07 00 00 00 02",
      establishment: "Lycée Moderne de Yamoussoukro",
      country: "Côte d'Ivoire", role: "USER", emailVerified: true,
    },
  });

  await db.user.upsert({
    where: { email: "essai@gspp.ci" },
    update: {},
    create: {
      firstName: "Aya", lastName: "Konaté",
      email: "essai@gspp.ci", password: demoPass,
      phone: "+225 07 00 00 00 03",
      establishment: "Groupe Scolaire Les Palmiers",
      country: "Côte d'Ivoire", role: "USER", emailVerified: true,
    },
  });

  // ── Formules d'abonnement ──────────────────────────────────
  const plans = [
    {
      slug: "essentiel",
      name: "Essentiel",
      description: "Pour l'enseignant indépendant ou la petite structure qui veut gagner du temps dès maintenant.",
      monthlyPrice: 0, annualPrice: 15000,
      maxUsers: 1, maxSchools: 1, maxStudents: 200,
      features: JSON.stringify([
        "Gestion des élèves et des classes",
        "Saisie des notes et calcul automatique des moyennes",
        "Bulletins scolaires professionnels",
        "Listes de classes et fiches scolaires",
        "Classement des élèves",
        "Support par e-mail",
      ]),
      highlighted: false, active: false, sortOrder: 1,
    },
    {
      slug: "professionnel",
      name: "Professionnel",
      description: "La formule complète pour les établissements qui veulent automatiser toute leur gestion.",
      monthlyPrice: 0, annualPrice: 15000,
      maxUsers: 5, maxSchools: 1, maxStudents: 1000,
      features: JSON.stringify([
        "Tout le contenu de la formule Essentiel",
        "Compositions et rapports de résultats",
        "Import intelligent de documents",
        "Signatures électroniques",
        "Promotion automatique des élèves",
        "Gestion administrative et documents officiels",
        "Support prioritaire (e-mail + téléphone)",
      ]),
      highlighted: true, active: true, sortOrder: 2,
    },
    {
      slug: "etablissement",
      name: "Établissement",
      description: "Pour les groupes scolaires et complexes multi-sites avec des besoins avancés.",
      monthlyPrice: 0, annualPrice: 15000,
      maxUsers: 20, maxSchools: 3, maxStudents: 5000,
      features: JSON.stringify([
        "Tout le contenu de la formule Professionnel",
        "Multi-établissements (jusqu'à 3 sites)",
        "Années scolaires illimitées",
        "Documents administratifs personnalisés à votre logo",
        "Sauvegardes automatiques",
        "Session de formation à distance offerte",
        "Support dédié 7j/7",
      ]),
      highlighted: false, active: false, sortOrder: 3,
    },
  ];

  for (const p of plans) {
    await db.subscriptionPlan.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  // ── Abonnement actif de démonstration + licence ────────────
  const proPlan = await db.subscriptionPlan.findUnique({ where: { slug: "professionnel" } });
  if (proPlan) {
    const existingSub = await db.subscription.findFirst({ where: { userId: demo.id, status: "ACTIVE" } });
    if (!existingSub) {
      const sub = await db.subscription.create({
        data: {
          reference: "SUB-DEMO-001",
          userId: demo.id, planId: proPlan.id, billingCycle: "annual",
          status: "ACTIVE",
          startDate: new Date("2026-01-15"),
          endDate: new Date("2027-01-15"),
          autoRenew: true,
        },
      });
      await db.payment.create({
        data: {
          reference: "PAY-DEMO-001",
          userId: demo.id, subscriptionId: sub.id,
          amount: proPlan.annualPrice, method: "mobile_money",
          phoneMsisdn: "+225 07 00 00 00 02",
          status: "COMPLETED", invoiceNumber: "FA-2026-0001",
          providerRef: "OMM-8837291",
        },
      });
      await db.licenseKey.upsert({
        where: { key: "GSPP-DEMO1-PRO22-KEY33-XXXXX" },
        update: {},
        create: {
          key: "GSPP-DEMO1-PRO22-KEY33-XXXXX",
          userId: demo.id, subscriptionId: sub.id,
          status: "ACTIVE", activatedAt: new Date("2026-01-20"),
          maxDevices: 2,
        },
      });
    }
  }

  // ── Version logicielle ─────────────────────────────────────
  const versionData = {
    version: "3.2.0",
    channel: "stable",
    releaseDate: new Date("2026-08-15"),
    fileSizeMb: 84.6,
    minOs: "Windows 10 64 bits (ou supérieur), 4 Go de RAM, 500 Mo d'espace disque",
    installerName: "",
    downloadUrl: "",
    changelog: [
      "## Nouveautés",
      "- **Bulletins personnalisables** : choisissez votre modèle, votre logo et vos couleurs",
      "- **Nouveau module de classement** avec distinctions automatiques (excellence, encouragements)",
      "- **Import intelligent** : importez vos listes d'élèves depuis Excel en un glisser-déposer",
      "## Améliorations",
      "- Calcul des moyennes 3 fois plus rapide sur les classes de plus de 100 élèves",
      "- Nouvelle interface de saisie des notes avec navigation au clavier",
      "## Corrections",
      "- Correction d'un problème d'impression des relevés sur certaines imprimantes réseau",
      "- Stabilité accrue lors de la promotion des élèves en fin d'année",
    ].join("\n"),
    active: true,
  };
  await db.softwareVersion.upsert({
    where: { version: versionData.version },
    update: versionData,
    create: versionData,
  });

  // ── Paramètres du site ─────────────────────────────────────
  await db.siteSettings.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main" },
  });

  // ── FAQ ────────────────────────────────────────────────────
  const faqs = [
    {
      question: "Qu'est-ce que Gestion Scolaire Pro Plus ?",
      answer: "Gestion Scolaire Pro Plus est un logiciel complet de gestion d'établissement scolaire conçu pour les enseignants, directeurs et responsables administratifs. Il centralise la gestion des élèves, des classes, des notes, des moyennes, des bulletins, des classements et des documents administratifs, avec des calculs automatiques et des impressions professionnelles.",
      category: "general", sortOrder: 1,
    },
    {
      question: "Comment créer un compte ?",
      answer: "Cliquez sur « Créer un compte » en haut du site, remplissez le formulaire d'inscription (nom, prénom, e-mail, établissement, pays), validez, puis connectez-vous. Un tutoriel illustré étape par étape est disponible dans la section « Tutoriel : créer un compte ».",
      category: "compte", sortOrder: 2,
    },
    {
      question: "Comment télécharger le logiciel ?",
      answer: "Rendez-vous sur la page « Télécharger ». Le site détecte automatiquement votre système d'exploitation et vous propose le bon fichier d'installation. Après votre achat, la clé de licence est disponible dans votre espace client pour activer le logiciel.",
      category: "logiciel", sortOrder: 3,
    },
    {
      question: "Le logiciel fonctionne-t-il hors connexion ?",
      answer: "Oui. Gestion Scolaire Pro Plus est installé sur votre ordinateur et fonctionne entièrement hors connexion pour la saisie des notes, les bulletins et les impressions. Une connexion Internet est uniquement nécessaire pour activer votre licence et vérifier périodiquement votre abonnement.",
      category: "logiciel", sortOrder: 4,
    },
    {
      question: "Comment activer mon abonnement ?",
      answer: "Créez votre compte, choisissez la formule Professionnel à 15 000 FCFA pour 12 mois, puis payez par Wave ou Orange Money sur le +225 07 09 93 33 64. Envoyez ensuite vos nom et prénom ainsi que la preuve du dépôt par WhatsApp. L'abonnement est activé après vérification.",
      category: "abonnement", sortOrder: 5,
    },
    {
      question: "Comment renouveler mon abonnement ?",
      answer: "Depuis votre espace client, onglet « Mon abonnement », cliquez sur « Renouveler » avant la date d'expiration. La durée restante est ajoutée à votre nouvelle période, vous ne perdez aucun jour. Vous pouvez également activer le renouvellement automatique.",
      category: "abonnement", sortOrder: 6,
    },
    {
      question: "Comment changer de formule ?",
      answer: "Vous pouvez passer à une formule supérieure à tout moment depuis votre espace client. La différence est calculée au prorata des jours restants. Le changement prend effet immédiatement après le paiement.",
      category: "abonnement", sortOrder: 7,
    },
    {
      question: "Comment récupérer mon mot de passe ?",
      answer: "Sur la page de connexion, cliquez sur « Mot de passe oublié ? », saisissez votre adresse e-mail et suivez le lien de réinitialisation qui vous est envoyé. Le lien est valable une heure. En cas de difficulté, contactez le support.",
      category: "compte", sortOrder: 8,
    },
    {
      question: "Que se passe-t-il lorsque mon abonnement expire ?",
      answer: "Vos données restent intactes et consultables : rien n'est jamais supprimé. En revanche, la génération de nouveaux documents (bulletins, rapports) est suspendue jusqu'au renouvellement. Vous pouvez réactiver toutes les fonctionnalités en renouvelant à tout moment.",
      category: "abonnement", sortOrder: 9,
    },
    {
      question: "Comment contacter le support ?",
      answer: "Le Centre d'aide vous permet d'envoyer une demande au support avec pièce jointe, de consulter la documentation et de suivre vos demandes précédentes. Notre équipe répond en général sous 24 heures ouvrées (support prioritaire pour les formules Professionnel et Établissement).",
      category: "support", sortOrder: 10,
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Oui. Les mots de passe sont chiffrés, les communications sont protégées par HTTPS et vos données restent stockées sur votre propre ordinateur. Aucune donnée d'élève n'est stockée sur nos serveurs : le site gère uniquement votre compte, votre abonnement et votre licence.",
      category: "general", sortOrder: 11,
    },
    {
      question: "Quelle est la configuration requise ?",
      answer: "Un PC sous Windows 10 64 bits ou supérieur, 4 Go de RAM (8 Go recommandés), 500 Mo d'espace disque et une imprimante pour les documents. Le logiciel est optimisé pour fonctionner sur des ordinateurs modestes, courants dans les établissements.",
      category: "logiciel", sortOrder: 12,
    },
  ];
  for (const f of faqs) {
    const exists = await db.faqItem.findFirst({ where: { question: f.question } });
    if (!exists) await db.faqItem.create({ data: f });
  }

  // ── Témoignages ────────────────────────────────────────────
  const testimonials = [
    {
      name: "Aya Konaté", role: "Directrice", establishment: "Groupe Scolaire Les Palmiers, Abidjan",
      content: "Avant, la préparation des bulletins prenait deux semaines à toute mon équipe. Avec Gestion Scolaire Pro Plus, tout est calculé et imprimé en trois jours. C'est tout simplement l'outil que notre établissement attendait.",
      rating: 5, initials: "AK", color: "emerald", sortOrder: 1,
    },
    {
      name: "Ibrahim Traoré", role: "Enseignant de Mathématiques", establishment: "Lycée Moderne de Yamoussoukro",
      content: "La saisie des notes est ultra rapide, même au clavier, et les moyennes se calculent automatiquement. Je consacre enfin mon temps à mes élèves plutôt qu'à mes tableurs.",
      rating: 5, initials: "IT", color: "teal", sortOrder: 2,
    },
    {
      name: "Kouadio N'Guessan", role: "Proviseur", establishment: "Lycée Scientifique de Bouaké",
      content: "Le classement automatique avec les distinctions et le rapport de résultats du conseil de classe : un gain de temps énorme. Les parents complimentent la qualité des bulletins.",
      rating: 5, initials: "KN", color: "amber", sortOrder: 3,
    },
    {
      name: "Fatou Diabaté", role: "Secrétaire générale", establishment: "Complexe Scolaire Al-Amana, Abidjan",
      content: "L'import intelligent des listes d'élèves depuis Excel nous a fait gagner un temps fou à la rentrée. L'inscription de 800 élèves a pris deux jours au lieu de trois semaines.",
      rating: 4, initials: "FD", color: "rose", sortOrder: 4,
    },
    {
      name: "Serge Kablan", role: "Enseignant de SVT", establishment: "Collège Sainte-Marie, San-Pédro",
      content: "Même sans connexion Internet, je peux tout faire : notes, fiches, impressions. Et le logiciel fonctionne parfaitement sur mon ancien ordinateur portable.",
      rating: 5, initials: "SK", color: "sky", sortOrder: 5,
    },
    {
      name: "Adjoua Brou", role: "Directrice des études", establishment: "Institut Polyvalent d'Abidjan",
      content: "Nous gérons trois sites avec la formule Établissement. Les promotions d'élèves en fin d'année, les années scolaires, tout est centralisé et le support répond vraiment rapidement.",
      rating: 5, initials: "AB", color: "violet", sortOrder: 6,
    },
  ];
  for (const t of testimonials) {
    const exists = await db.testimonial.findFirst({ where: { name: t.name } });
    if (!exists) await db.testimonial.create({ data: { ...t, published: false } });
  }

  // ── Articles (actualités) ──────────────────────────────────
  const articles = [
    {
      slug: "version-3-2-bulletins-personnalisables",
      title: "Version 3.2 : bulletins personnalisables et nouveau module de classement",
      excerpt: "La mise à jour majeure de Gestion Scolaire Pro Plus arrive avec les modèles de bulletins personnalisables, les distinctions automatiques et un import intelligent repensé.",
      category: "version", coverEmoji: "🎉",
      content: [
        "Nous sommes fiers d'annoncer la disponibilité de la version 3.2 de Gestion Scolaire Pro Plus, la plus importante mise à jour de l'année. Cette version a été conçue à partir des retours de plus de 300 enseignants et directeurs qui utilisent le logiciel chaque jour.",
        "Le module de bulletins accueille une personnalisation complète : importez le logo de votre établissement, choisissez vos couleurs, vos mentions et votre modèle d'en-tête. Chaque bulletin reflète désormais l'identité de votre école, prêt à être remis aux parents.",
        "Le nouveau module de classement introduit les distinctions automatiques : tableau d'excellence, encouragements et félicitations sont attribués selon les règles que vous définissez. Le rapport de résultats du conseil de classe se génère en un clic.",
        "Enfin, l'import intelligent de documents a été repensé : glissez-déposez votre fichier Excel d'élèves, le logiciel détecte automatiquement les colonnes, signale les doublons et les informations manquantes avant l'importation.",
        "La mise à jour est gratuite pour tous les abonnés actifs. Téléchargez le nouvel installateur depuis la page Télécharger et installez-le par-dessus votre version actuelle : vos données sont conservées.",
      ].join("\n\n"),
      publishedAt: new Date("2026-08-15"),
    },
    {
      slug: "paiement-mobile-money-disponible",
      title: "Paiement par Wave ou Orange Money",
      excerpt: "Réglez 15 000 FCFA pour 12 mois par Wave ou Orange Money, puis envoyez la preuve du dépôt pour l'activation.",
      category: "annonce", coverEmoji: "📱",
      content: [
        "Souscrire à un abonnement Gestion Scolaire Pro Plus est simple : choisissez la formule Professionnel à 15 000 FCFA pour 12 mois.",
        "Effectuez le dépôt par Wave, avec le QR code ou le numéro +225 07 09 93 33 64, ou par Orange Money sur ce même numéro.",
        "Envoyez vos nom et prénom ainsi que la preuve du dépôt par WhatsApp. L'abonnement est activé après vérification du paiement.",
        "Cette évolution s'inscrit dans notre engagement : rendre la gestion scolaire professionnelle accessible à tous les établissements, avec les moyens de paiement qu'ils utilisent déjà au quotidien.",
      ].join("\n\n"),
      publishedAt: new Date("2026-07-02"),
    },
    {
      slug: "tutoriel-premier-bulletin-5-minutes",
      title: "Tutoriel : créer votre premier bulletin scolaire en 5 minutes",
      excerpt: "De la création de la classe à l'impression du bulletin, suivez le parcours complet pas à pas. Vous verrez, c'est plus rapide que de faire du café.",
      category: "tutoriel", coverEmoji: "🎓",
      content: [
        "Vous venez d'installer Gestion Scolaire Pro Plus et vous voulez voir un résultat concret rapidement ? Ce tutoriel vous guide de la création de la classe jusqu'à l'impression de votre premier bulletin, en cinq étapes.",
        "Étape 1 — Créez votre classe. Dans le menu « Classes », cliquez sur « Nouvelle classe », indiquez le niveau (par exemple 6ème A) et validez. Étape 2 — Ajoutez vos élèves. Saisissez-les manuellement ou importez votre liste Excel avec l'import intelligent.",
        "Étape 3 — Configurez les matières. Ajoutez les matières de la classe et leurs coefficients : Mathématiques (coef. 4), Français (coef. 4), SVT (coef. 2)... Étape 4 — Saisissez les notes. Ouvrez la classe, sélectionnez la matière et la composition, puis entrez les notes. Les moyennes se calculent instantanément.",
        "Étape 5 — Générez les bulletins. Cliquez sur « Bulletins », choisissez la composition et lancez la génération. Chaque bulletin inclut les moyennes, le rang, les appréciations automatiques et la moyenne de la classe. Il ne reste qu'à imprimer.",
        "Retrouvez ce tutoriel en version détaillée, avec des captures d'écran, dans la notice d'utilisation, section « Bulletins ».",
      ].join("\n\n"),
      publishedAt: new Date("2026-06-20"),
    },
    {
      slug: "conseils-preparer-rentree",
      title: "5 conseils pour préparer la rentrée avec Gestion Scolaire Pro Plus",
      excerpt: "Année scolaire, promotions, imports de listes : les bonnes pratiques pour démarrer l'année du bon pied et éviter les pièges classiques.",
      category: "conseils", coverEmoji: "🧭",
      content: [
        "La rentrée est la période la plus chargée de l'année pour un établissement. Voici cinq conseils pour la préparer sereinement avec Gestion Scolaire Pro Plus.",
        "1. Créez la nouvelle année scolaire avant tout le reste. Menu « Années scolaires » → « Nouvelle année ». Toutes les classes, notes et bulletins seront rattachés à la bonne année, et les archives de l'an dernier restent consultables.",
        "2. Utilisez la promotion des élèves. En fin d'année, le module de promotion fait passer automatiquement chaque élève dans la classe suivante, en gérant les redoublements et les départs.",
        "3. Importez vos listes Excel plutôt que de ressaisir. L'import intelligent détecte les colonnes, vérifie les doublons et les dates de naissance. Deux heures de travail au lieu de deux semaines.",
        "4. Anticipez les coefficients et le barème des compositions dès le premier jour. Les moyennes et classements en dépendent directement.",
        "5. Configurez une sauvegarde hebdomadaire sur clé USB ou disque externe. Menu « Sauvegardes » → planification automatique. Vos données sont précieuses, protégez-les.",
      ].join("\n\n"),
      publishedAt: new Date("2026-09-01"),
    },
    {
      slug: "version-3-1-4-correction-impression",
      title: "Version 3.1.4 : amélioration de la stabilité de l'impression",
      excerpt: "Une mise à jour de maintenance qui corrige les problèmes d'impression réseau signalés sur certaines configurations Windows.",
      category: "correction", coverEmoji: "🛠️",
      content: [
        "Cette mise à jour de maintenance corrige un problème d'impression des relevés de notes rencontré sur certaines imprimantes réseau, notamment lorsque le spouleur Windows est saturé.",
        "Le gestionnaire d'impression du logiciel a été renforcé : la file d'attente est mieux gérée, les tâches bloquées se relancent automatiquement et un message clair s'affiche en cas d'imprimante injoignable.",
        "Nous en profitons pour rappeler que la mise à jour est toujours gratuite : lancez simplement le nouvel installateur, vos données et votre activation sont préservées.",
      ].join("\n\n"),
      publishedAt: new Date("2026-05-10"),
    },
    {
      slug: "nouveau-module-signatures-electroniques",
      title: "Nouveau : les signatures électroniques pour vos documents officiels",
      excerpt: "Appliquez la signature du directeur et le cachet de l'établissement sur les bulletins, certificats et correspondances, directement depuis le logiciel.",
      category: "version", coverEmoji: "✍️",
      content: [
        "Terminé les allers-retours entre l'imprimante et le bureau du directeur. Gestion Scolaire Pro Plus intègre désormais la gestion des signatures électroniques sur tous vos documents officiels.",
        "Importez une fois la signature manuscrite du directeur et le cachet de l'établissement, positionnez-les à l'endroit souhaité sur vos modèles, et chaque bulletin, certificat de scolarité ou correspondance sortira déjà signé.",
        "Les signatures sont stockées de manière sécurisée sur votre poste et ne sont accessibles qu'aux comptes administrateurs du logiciel. Vous pouvez définir plusieurs signatures (directeur, censeur, intendant) et les affecter par type de document.",
        "Cette fonctionnalité est incluse dans les formules Professionnel et Établissement, sans supplément.",
      ].join("\n\n"),
      publishedAt: new Date("2026-04-05"),
    },
  ];
  for (const a of articles) {
    await db.article.upsert({
      where: { slug: a.slug },
      update: {},
      create: a,
    });
  }

  // ── Documentation (notice d'utilisation) — 19 sections ─────
  const docs = buildDocs();
  for (const d of docs) {
    await db.docSection.upsert({
      where: { slug: d.slug },
      update: { number: d.number, title: d.title, content: d.content, icon: d.icon },
      create: d,
    });
  }

  // ── Tickets de démonstration ───────────────────────────────
  const ticketCount = await db.supportTicket.count();
  if (ticketCount === 0) {
    await db.supportTicket.createMany({
      data: [
        {
          reference: "TCK-2026-0001", userId: demo.id,
          name: "Ibrahim Traoré", email: "demo@gspp.ci",
          subject: "Question sur les coefficients personnalisés",
          category: "technique",
          message: "Bonjour, est-il possible de définir un coefficient différent par composition pour une même matière ? Merci d'avance pour votre retour.",
          status: "RESOLVED", priority: "NORMAL",
          response: "Bonjour, oui : ouvrez la classe, puis « Matières », cliquez sur la matière concernée et définissez le coefficient par composition dans l'onglet « Avancé ». Cordialement, l'équipe support.",
        },
        {
          reference: "TCK-2026-0002", userId: null,
          name: "Marc Gbagbo", email: "marc.gbagbo@college-hope.ci",
          subject: "Demander un devis pour 2 établissements",
          category: "abonnement",
          message: "Bonjour, nous gérons un collège et un lycée sur le même campus. Quelle formule nous conseillez-vous ? Peut-on avoir un devis officiel ?",
          status: "IN_PROGRESS", priority: "HIGH",
        },
      ],
    });
  }

  const counts = {
    users: await db.user.count(),
    plans: await db.subscriptionPlan.count(),
    faqs: await db.faqItem.count(),
    testimonials: await db.testimonial.count(),
    articles: await db.article.count(),
    docs: await db.docSection.count(),
    versions: await db.softwareVersion.count(),
  };
  console.log("✅ Seed terminé :", counts);
  console.log("👤 Admin : admin@gspp.ci / Admin@2026!");
  console.log("👤 Démo (abonné) : demo@gspp.ci / Demo@2026!");
  console.log("👤 Essai (sans abonnement) : essai@gspp.ci / Demo@2026!");
}

// ─────────────────────────────────────────────────────────────
// CONTENU DE LA NOTICE D'UTILISATION (19 sections, Markdown)
// ─────────────────────────────────────────────────────────────
function buildDocs() {
  return [
    {
      number: 1, slug: "introduction", icon: "book-open", title: "Introduction",
      content: [
        "## Bienvenue dans Gestion Scolaire Pro Plus",
        "Gestion Scolaire Pro Plus est un logiciel de gestion d'établissement scolaire conçu pour les professionnels de l'éducation : enseignants, directeurs, surveillants et responsables administratifs. Il centralise l'ensemble de la vie scolaire — élèves, classes, notes, bulletins, classements et documents administratifs — dans une interface simple et rapide.",
        "Cette notice vous accompagne de l'installation jusqu'aux fonctionnalités avancées. Chaque section décrit une étape précise de l'utilisation du logiciel, avec les menus concernés et les bonnes pratiques recommandées.",
        "## Les grands principes du logiciel",
        "- **Vos données restent chez vous** : tout est stocké sur votre ordinateur, aucune donnée d'élève ne transite par Internet.\n- **Automatisation maximale** : moyennes, rangs, appréciations et documents sont calculés automatiquement.\n- **Conçu pour le terrain** : fonctionne hors connexion, sur des ordinateurs modestes, avec une prise en main en moins d'une heure.",
        "> **Astuce** : si vous débutez, suivez les sections de cette notice dans l'ordre. Elles reproduisent le parcours naturel d'une année scolaire.",
      ].join("\n\n"),
    },
    {
      number: 2, slug: "installation", icon: "download", title: "Installation",
      content: [
        "## Télécharger et installer le logiciel",
        "1. Rendez-vous sur la page **Télécharger** du site officiel : le bon fichier d'installation est détecté automatiquement pour votre système.\n2. Lancez le fichier `GestionScolaireProPlus-Setup.exe` téléchargé.\n3. Si Windows affiche un avertissement, cliquez sur **Informations complémentaires** puis **Exécuter quand même** (le logiciel est signé, cet avertissement disparaît avec l'installation du certificat).\n4. Suivez l'assistant : acceptez la licence, choisissez le dossier d'installation (par défaut `C:\\Program Files\\Gestion Scolaire Pro Plus`), puis cliquez sur **Installer**.",
        "## Configuration minimale requise",
        "- Windows 10 64 bits ou supérieur\n- Processeur 1,5 GHz (2 GHz recommandé)\n- 4 Go de RAM (8 Go recommandés)\n- 500 Mo d'espace disque libre\n- Imprimante pour les documents (facultative mais recommandée)",
        "## Après l'installation",
        "Au premier lancement, le logiciel crée automatiquement sa base de données locale dans votre dossier Documents. Vous arrivez sur l'écran de connexion : il ne reste qu'à activer votre licence (voir section Première connexion).",
        "> **Important** : installez toujours une nouvelle version par-dessus l'ancienne. Vos données et votre activation sont conservées.",
      ].join("\n\n"),
    },
    {
      number: 3, slug: "creation-compte", icon: "user-plus", title: "Création d'un compte",
      content: [
        "## Pourquoi un compte ?",
        "Le compte sur le site officiel gère votre abonnement, votre licence et votre support. Il est différent des comptes utilisateurs créés dans le logiciel lui-même (enseignants, surveillants...), qui gèrent les accès à vos données scolaires.",
        "## Créer votre compte en 4 étapes",
        "1. Cliquez sur **Créer un compte** en haut du site.\n2. Renseignez vos informations : nom, prénom, adresse e-mail, téléphone, établissement et pays.\n3. Choisissez un mot de passe solide : au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.\n4. Validez : votre compte est créé et vous êtes connecté automatiquement.",
        "## Sécurité de votre compte",
        "Votre mot de passe est chiffré côté serveur (jamais stocké en clair), et les tentatives de connexion abusives sont automatiquement bloquées. Activez un mot de passe unique que vous n'utilisez nulle part ailleurs.",
        "> Consultez le tutoriel illustré **« Comment créer votre compte »** pour un guide pas à pas avec captures d'écran.",
      ].join("\n\n"),
    },
    {
      number: 4, slug: "premiere-connexion", icon: "log-in", title: "Première connexion",
      content: [
        "## Se connecter au site",
        "Cliquez sur **Se connecter**, saisissez votre e-mail et votre mot de passe. Vous accédez à votre tableau de bord : abonnement, licence, téléchargements et support y sont centralisés.",
        "## Activer le logiciel avec votre licence",
        "1. Après l'achat d'une formule, votre **clé de licence** au format `GSPP-XXXXX-XXXXX-XXXXX-XXXXX` apparaît dans votre tableau de bord.\n2. Lancez le logiciel installé sur votre ordinateur.\n3. Dans l'écran d'activation, copiez-collez la clé de licence, puis cliquez sur **Activer**.\n4. Le logiciel vérifie votre abonnement en ligne (connexion requise une fois), puis vous ouvre l'accès complet.",
        "## En cas de problème d'activation",
        "- Vérifiez que votre abonnement est bien **Actif** dans votre tableau de bord.\n- Vérifiez votre connexion Internet le temps de l'activation.\n- Si le message « Nombre d'appareils maximum atteint » s'affiche, désactivez l'ancien poste depuis votre espace client ou contactez le support.",
      ].join("\n\n"),
    },
    {
      number: 5, slug: "configuration-etablissement", icon: "building-2", title: "Configuration de l'établissement",
      content: [
        "## La première chose à faire dans le logiciel",
        "Menu **Paramètres → Établissement**. Ces informations apparaissent sur tous les documents officiels : bulletins, certificats, correspondances.",
        "## Informations à renseigner",
        "- **Nom de l'établissement** et sigle éventuel (ex. : LMY — Lycée Moderne de Yamoussoukro)\n- **Type** : école primaire, collège, lycée, groupe scolaire...\n- **Adresse complète**, téléphone et e-mail\n- **Logo** : importez une image carrée de préférence (PNG, 512×512 px recommandé)\n- **Année scolaire en cours** : au format `2026-2027`\n- **Devise ou devise du bulletin** : la mention affichée sous les notes (sur 10, sur 20...)",
        "## Personnalisation des documents",
        "Dans **Paramètres → Documents**, choisissez le modèle d'en-tête, la position du logo, la mention de signature et le texte de pied de page. Un aperçu en temps réel vous montre le rendu avant enregistrement.",
        "> **Conseil** : préparez votre logo et vos textes avant de commencer la configuration, cela prend cinq minutes et évite les allers-retours.",
      ].join("\n\n"),
    },
    {
      number: 6, slug: "creation-classes", icon: "layers", title: "Création des classes",
      content: [
        "## Créer une classe",
        "Menu **Classes → Nouvelle classe**. Renseignez :\n- L'**intitulé** (ex. : 6ème A)\n- Le **niveau** (6ème, 5ème, CM2, Terminale...)\n- La **série** pour les lycées (A, C, D...)\n- Le **professeur principal**\n- L'**effectif maximum** (utile pour les alertes de capacité)",
        "## Organiser vos classes",
        "Les classes sont regroupées par niveau dans l'écran principal. Vous pouvez à tout moment renommer une classe, changer son professeur principal ou la fermer (une classe fermée reste consultable dans les archives).",
        "## Bonnes pratiques",
        "- Créez toutes vos classes avant d'ajouter les élèves : les affectations en seront plus simples.\n- Utilisez une convention de nommage stable d'une année à l'autre (ex. : `6A`, `6B`, `5A`...).\n- Pour un groupe scolaire multi-sites (formule Établissement), créez d'abord les établissements dans **Paramètres → Établissements**, puis les classes dans chaque site.",
      ].join("\n\n"),
    },
    {
      number: 7, slug: "ajout-eleves", icon: "users", title: "Ajout des élèves",
      content: [
        "## Ajouter un élève manuellement",
        "Menu **Élèves → Nouvel élève**. Renseignez au minimum le nom, le prénom, la date de naissance, le sexe et la classe. Les champs photo, matricule, tuteur et contacts sont facultatifs mais recommandés pour les documents officiels.",
        "## L'import intelligent de documents (recommandé)",
        "1. Menu **Élèves → Importer**.\n2. Glissez-déposez votre fichier Excel ou CSV.\n3. Le logiciel **détecte automatiquement les colonnes** (nom, prénom, date de naissance...). Vérifiez la correspondance proposée.\n4. Un rapport signale les doublons, les dates invalides et les champs manquants avant validation.\n5. Cliquez sur **Importer** : les élèves sont créés et affectés à la classe choisie.",
        "## Fiches scolaires",
        "Chaque élève dispose d'une fiche complète : informations personnelles, scolarité (classe, année, promotion), notes par matière, absences et documents émis. Menu **Élèves → [nom de l'élève]**.",
        "> **Astuce** : le matricule peut être généré automatiquement (Paramètres → Numérotation) pour garder une numérotation cohérente d'une année sur l'autre.",
      ].join("\n\n"),
    },
    {
      number: 8, slug: "gestion-matieres", icon: "library", title: "Gestion des matières",
      content: [
        "## Créer les matières d'une classe",
        "Menu **Classes → [classe] → Matières → Ajouter**. Pour chaque matière, définissez :\n- L'**intitulé** (Mathématiques, Français, SVT...)\n- Le **coefficient** (utilisé dans le calcul des moyennes)\n- L'**enseignant** affecté\n- Le **barème** (sur 20 par défaut)",
        "## Coefficients : comment ça marche ?",
        "La moyenne générale d'un élève est calculée ainsi : `somme (moyenne de la matière × coefficient) / somme des coefficients`. Modifiez un coefficient à tout moment : toutes les moyennes et tous les classements sont recalculés instantanément.",
        "## Matières composées",
        "Pour les matières avec travaux pratiques ou oraux (ex. : Physique-Chimie avec TP), créez des **sous-matières**. Le logiciel calcule d'abord la moyenne de la matière parente selon les pondérations définies, puis la moyenne générale.",
        "> **Bon à savoir** : copiez les matières d'une classe à une autre (menu contextuel → Dupliquer les matières) pour gagner du temps sur les classes parallèles.",
      ].join("\n\n"),
    },
    {
      number: 9, slug: "saisie-notes", icon: "pencil-line", title: "Saisie des notes",
      content: [
        "## L'écran de saisie",
        "Menu **Notes → Saisir**. Choisissez la classe, la matière et la composition (1er devoir, 2ème devoir, composition...). La liste des élèves s'affiche avec une colonne par évaluation : saisissez les notes directement, la navigation au clavier (Tab, Entrée, flèches) est optimisée pour la vitesse.",
        "## Contrôles automatiques",
        "- Les notes hors barème sont signalées immédiatement (rouge + message).\n- Les moyennes de la classe se mettent à jour en temps réel en bas de colonne.\n- Une note non saisie est traitée comme « non évaluée » : elle est exclue du calcul jusqu'à saisie.",
        "## Compositions et trimestres",
        "Organisez vos évaluations par période (trimestre ou semestre, configurable dans Paramètres → Périodes). Chaque composition regroupe les évaluations de la période et alimente le bulletin.",
        "> **Astuce productivité** : le mode « saisie rapide » permet d'entrer une note par ligne sans confirmation, idéal pour corriger une pile de copies.",
      ].join("\n\n"),
    },
    {
      number: 10, slug: "calcul-moyennes", icon: "calculator", title: "Calcul des moyennes",
      content: [
        "## Calcul automatique et transparent",
        "Dès la saisie d'une note, Gestion Scolaire Pro Plus calcule :\n- La **moyenne de la matière** (moyenne des évaluations de la période)\n- La **moyenne générale pondérée** par les coefficients\n- La **moyenne de la classe** pour chaque matière\n- Les **plus fortes et plus faibles moyennes**",
        "## Règles de calcul configurables",
        "Dans **Paramètres → Calculs**, choisissez :\n- L'arrondi (0, 1 ou 2 décimales)\n- Le traitement des notes non évaluées (exclure ou compter comme zéro)\n- Le mode de calcul des sous-matières (moyenne simple ou pondérée)",
        "## Vérifier les moyennes d'un élève",
        "Ouvrez la fiche de l'élève, onglet **Moyennes** : le détail complet du calcul est affiché matière par matière, coefficient par coefficient. Les enseignants apprécient cette transparence lors des conseils de classe.",
        "> En cas de modification de coefficient, tout est recalculé automatiquement — y compris les bulletins déjà générés (qui resteront archivés avec les valeurs du moment de leur génération, sauf régénération).",
      ].join("\n\n"),
    },
    {
      number: 11, slug: "classements", icon: "trophy", title: "Classements",
      content: [
        "## Le classement automatique",
        "Menu **Classements** : sélectionnez la classe et la période. Le logiciel classe les élèves par moyenne générale et affiche le rang, la mention et l'écart avec la première place.",
        "## Mentions et distinctions",
        "Configurez vos seuils dans **Paramètres → Mentions** : par exemple Excellence ≥ 16, Félicitations ≥ 14, Encouragements ≥ 12, Tableau d'honneur ≥ 10. Les mentions apparaissent sur les bulletins et dans les rapports du conseil de classe.",
        "## Ex æquo et options",
        "- Deux élèves avec la même moyenne générale reçoivent le même rang (gestion standard des ex æquo).\n- Vous pouvez exclure une matière du classement (ex. : EPS) sans modifier les bulletins.\n- L'évolution de chaque élève (progression par rapport à la période précédente) est affichée avec une flèche verte ou rouge.",
        "> Le rapport de classement s'exporte en PDF et s'imprime pour l'affichage ou le conseil de discipline.",
      ].join("\n\n"),
    },
    {
      number: 12, slug: "bulletins", icon: "file-text", title: "Bulletins",
      content: [
        "## Générer les bulletins",
        "Menu **Bulletins → Générer**. Choisissez la classe, la période et le modèle. Chaque bulletin contient : les notes par matière avec coefficients, la moyenne générale, le rang sur l'effectif, la moyenne de la classe, les appréciations et les mentions.",
        "## Appréciations automatiques",
        "Le logiciel propose une appréciation automatique selon la moyenne (Très bien, Bien, Assez bien, Insuffisant...). Vous pouvez la modifier pour chaque matière : cliquez simplement sur la cellule d'appréciation avant génération.",
        "## Personnaliser le modèle",
        "Dans **Paramètres → Modèles de bulletins**, choisissez : l'en-tête avec logo, les colonnes affichées, la position de la signature, le texte de conclusion du conseil de classe et les couleurs. Plusieurs modèles peuvent coexister (un par niveau par exemple).",
        "## Impressions professionnelles",
        "L'impression est optimisée format A4, une page par bulletin par défaut (deux pages optionnelles pour les lycées). L'aperçu avant impression montre exactement le rendu final.",
        "> **Conseil** : générez d'abord les bulletins d'une classe test et vérifiez le rendu avant de lancer toute l'école.",
      ].join("\n\n"),
    },
    {
      number: 13, slug: "impressions", icon: "printer", title: "Impressions",
      content: [
        "## Documents imprimables",
        "Gestion Scolaire Pro Plus imprime tous vos documents officiels : bulletins scolaires, listes de classes, fiches scolaires, relevés de notes, certificats de scolarité, listes d'émargement, rapports de classement et correspondances types.",
        "## Listes de classes",
        "Menu **Impressions → Listes** : liste alphabétique avec dates de naissance, liste par ordre de mérite, liste d'émargement avec colonne de signature, listes vierges pour les examens. Choisissez les colonnes affichées avant l'impression.",
        "## Résoudre un problème d'impression",
        "1. Vérifiez que l'imprimante est bien sélectionnée et en ligne.\n2. Dans l'aperçu, utilisez **Mise à l'échelle automatique** si le contenu déborde.\n3. Pour les imprimantes réseau capricieuses, redémarrez le spouleur Windows ou imprimez en PDF puis imprimez le PDF.\n4. Les problèmes persistants sont pris en charge par le support (Centre d'aide).",
        "> **Astuce** : pour archiver, préférez l'export PDF — chaque document exporté est horodaté et nommé automatiquement (ex. : `Bulletins_6A_T1_2026-2027.pdf`).",
      ].join("\n\n"),
    },
    {
      number: 14, slug: "rapports", icon: "bar-chart-3", title: "Rapports",
      content: [
        "## Les rapports de résultats",
        "Menu **Rapports → Résultats** : synthèse complète d'une classe ou de tout l'établissement pour une période. Effectifs, moyenne générale, répartition par tranche de notes, taux de réussite, matières les plus et moins réussies.",
        "## Rapports pour le conseil de classe",
        "Le rapport de conseil regroupe pour chaque élève : moyennes, rang, évolution, mentions et appréciations des professeurs. Il s'imprime en un exemplaire par professeur — fini les notes manuscrites en réunion.",
        "## Statistiques d'établissement",
        "Formule Établissement : consolidez les résultats de plusieurs classes ou sites, comparez les niveaux entre classes parallèles et suivez l'évolution d'une année sur l'autre. Les rapports s'exportent en PDF ou en Excel pour vos réunions de coordination.",
        "> Tous les rapports respectent la charte de votre établissement (logo, couleurs) configurée dans les paramètres de documents.",
      ].join("\n\n"),
    },
    {
      number: 15, slug: "promotion-eleves", icon: "arrow-up-circle", title: "Promotion des élèves",
      content: [
        "## Le passage automatique en classe supérieure",
        "Menu **Élèves → Promotion** (disponible en fin d'année). Le logiciel fait passer chaque élève de `6A` vers `5A`, de `5A` vers `4A`, etc., en conservant toutes ses informations et son historique.",
        "## Redoublements et départs",
        "- Cochez **Redouble** pour maintenir un élève dans sa classe actuelle.\n- Cochez **Quitte l'établissement** pour archiver l'élève (ses données restent consultables dans les archives).\n- Les élèves admis dans une classe qui n'existe pas encore (ex. : passage en Terminale) vous proposent de créer la classe à la volée.",
        "## Avant de lancer la promotion",
        "1. Vérifiez que les nouvelles classes sont créées.\n2. Créez la nouvelle année scolaire si nécessaire.\n3. Faites une **sauvegarde** (menu Sauvegardes → Sauvegarder maintenant).\n4. Lancez la promotion : l'opération est irréversible, mais la sauvegarde vous protège.",
        "> La promotion est incluse dans toutes les formules et prend moins d'une minute même pour 1 000 élèves.",
      ].join("\n\n"),
    },
    {
      number: 16, slug: "annee-scolaire", icon: "calendar-range", title: "Année scolaire",
      content: [
        "## Gérer plusieurs années scolaires",
        "Menu **Paramètres → Années scolaires**. Chaque année (`2025-2026`, `2026-2027`...) contient ses propres classes, élèves et notes. L'année active est affichée en permanence dans la barre supérieure du logiciel.",
        "## Basculer d'une année à l'autre",
        "Cliquez sur le sélecteur d'année en haut de l'écran : vous consultez alors toutes les données de l'année choisie. C'est le moyen le plus simple de retrouver le bulletin d'un élève de l'an dernier ou de comparer des résultats.",
        "## Archives et conservation",
        "Aucune donnée n'est jamais supprimée lors du passage à une nouvelle année. Les années anciennes restent consultables indéfiniment et restent imprimables (utile pour les duplicata de bulletins demandés par les familles).",
        "> **Bonnes pratique** : créez la nouvelle année scolaire avant la promotion des élèves, et vérifiez les périodes (trimestres/semestres) dès la création.",
      ].join("\n\n"),
    },
    {
      number: 17, slug: "abonnement", icon: "credit-card", title: "Abonnement",
      content: [
        "## Gérer votre abonnement depuis le site",
        "Votre espace client affiche en permanence : la formule active, les dates de début et d'expiration, le nombre de jours restants, vos factures et votre clé de licence. La page **Abonnements** du site présente les formules disponibles et leurs tarifs.",
        "## Souscrire ou renouveler",
        "1. Connectez-vous à votre espace client.\n2. Choisissez la formule Professionnel pour 12 mois.\n3. Réglez 15 000 FCFA par Wave avec le QR code ou sur le +225 07 09 93 33 64, ou par Orange Money sur ce même numéro.\n4. Envoyez vos nom et prénom ainsi que la preuve du dépôt par WhatsApp. L'activation intervient après vérification.",
        "## Votre licence et vos appareils",
        "Chaque abonnement autorise un nombre d'appareils défini par la formule. Vous pouvez désactiver un ancien poste depuis votre espace client pour libérer une activation. En cas de réinstallation de Windows, désactivez d'abord la licence, puis réactivez.",
        "> Activez le **renouvellement automatique** pour ne jamais interrompre la génération de bulletins en pleine période de conseils de classe.",
      ].join("\n\n"),
    },
    {
      number: 18, slug: "resolution-problemes", icon: "wrench", title: "Résolution des problèmes",
      content: [
        "## Le logiciel ne démarre pas",
        "- Redémarrez l'ordinateur, puis relancez le logiciel.\n- Vérifiez que Windows n'a pas bloqué l'installation (clic droit sur le raccourci → Exécuter en tant qu'administrateur).\n- Réinstallez par-dessus la version existante : les données sont conservées.",
        "## Message « Licence invalide » ou « Abonnement expiré »",
        "1. Vérifiez le statut de votre abonnement dans votre espace client.\n2. Si l'abonnement est actif, vérifiez votre connexion Internet puis cliquez sur **Revérifier la licence** dans l'écran d'activation du logiciel.\n3. Si le problème persiste, contactez le support en joignant une capture d'écran du message.",
        "## Données introuvables après une mise à jour",
        "La base de données est stockée dans `Documents\\GestionScolaireProPlus\\data`. Si vous avez déplacé ce dossier, utilisez **Paramètres → Base de données → Indiquer l'emplacement** pour la rattacher.",
        "## Restaurer une sauvegarde",
        "Menu **Sauvegardes → Restaurer**, choisissez le fichier de sauvegarde (`.gsbackup`) et validez. Le logiciel redémarre avec les données de la sauvegarde choisie.",
        "> Un problème non listé ici ? Le **Centre d'aide** du site vous permet d'envoyer une demande avec capture d'écran — réponse sous 24 h ouvrées.",
      ].join("\n\n"),
    },
    {
      number: 19, slug: "questions-frequentes", icon: "help-circle", title: "Questions fréquentes",
      content: [
        "## Les questions les plus posées au support",
        "**Le logiciel fonctionne-t-il sans Internet ?** Oui, entièrement : notes, bulletins, impressions et classements sont hors ligne. Internet ne sert qu'à l'activation et à la vérification périodique de la licence.",
        "**Puis-je installer le logiciel sur plusieurs ordinateurs ?** Oui, dans la limite du nombre d'appareils de votre formule (1 pour Essentiel, 5 pour Professionnel, 20 pour Établissement).",
        "**Mes données d'élèves sont-elles envoyées sur Internet ?** Non. Toutes les données scolaires restent sur votre ordinateur. Le site officiel ne gère que votre compte, votre abonnement et votre licence.",
        "**Comment transférer mes données vers un nouvel ordinateur ?** Faites une sauvegarde complète (fichier `.gsbackup`) sur l'ancien poste, installez le logiciel sur le nouveau, puis restaurez la sauvegarde.",
        "**Puis-je essayer avant d'acheter ?** Oui : créez votre compte et contactez le support pour obtenir une période d'évaluation.",
        "**Comment obtenir une facture au nom de mon établissement ?** Renseignez le nom de l'établissement lors de la souscription ; la facture est générée automatiquement et téléchargeable dans votre espace client, onglet Paiements.",
        "> La FAQ complète (abonnements, compte, paiement) est disponible sur la page **FAQ** du site.",
      ].join("\n\n"),
    },
  ];
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
