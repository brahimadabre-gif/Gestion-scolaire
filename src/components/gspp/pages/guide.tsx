"use client";

// ── Tutoriel d'utilisation du logiciel, illustré par de vraies captures ──
// Captures prises dans le logiciel avec une école entièrement fictive
// (EPP Les Palmiers) : aucune donnée réelle d'élève ou d'enseignant.
import { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "../router";
import { PageHero } from "../page-hero";
import { Section } from "../ui-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { navigate } from "../router";
import { AlertTriangle, Download, Images, KeyRound, Lightbulb, ZoomIn } from "lucide-react";

interface Step {
  title: string;
  img?: string;
  alt?: string;
  text: string[];
  tip?: string;
  warn?: string;
}
interface Chapter {
  id: string;
  title: string;
  intro: string;
  steps: Step[];
}

const SHOT = { w: 1708, h: 960 };

const CHAPTERS: Chapter[] = [
  {
    id: "installation",
    title: "Installer le logiciel",
    intro: "Gestion Scolaire Pro Plus fonctionne sur un ordinateur Windows et sur un téléphone ou une tablette Android. Les données restent sur votre appareil : aucune connexion Internet n'est nécessaire au quotidien.",
    steps: [
      {
        title: "Sur un ordinateur Windows",
        text: [
          "Ouvrez Microsoft Store, recherchez « Gestion Scolaire Pro Plus », puis cliquez sur « Obtenir ». Le logiciel s'installe et se met à jour automatiquement.",
          "Configuration conseillée : Windows 10 64 bits ou plus récent, 4 Go de mémoire et 500 Mo d'espace libre.",
        ],
      },
      {
        title: "Sur un téléphone ou une tablette Android",
        text: [
          "Depuis votre téléphone, ouvrez la page « Télécharger » de ce site et appuyez sur « Télécharger pour Android ». Ouvrez ensuite le fichier APK téléchargé. Si Android le demande, autorisez l'installation depuis votre navigateur.",
          "Pour une mise à jour, installez le nouveau fichier par-dessus l'ancien : vos données sont conservées. Android 5.1 ou plus récent est nécessaire.",
        ],
      },
    ],
  },
  {
    id: "compte",
    title: "Créer le compte principal",
    intro: "À la toute première utilisation, vous créez le compte principal de l'école. Cette étape n'a lieu qu'une seule fois.",
    steps: [
      {
        title: "Ouvrir le logiciel",
        img: "01-accueil", alt: "Écran d'accueil du logiciel avec le bouton Commencer",
        text: ["Au lancement, l'écran d'accueil s'affiche. Cliquez sur « Commencer »."],
      },
      {
        title: "Choisir « Créer le compte principal »",
        img: "02-connexion", alt: "Écran de connexion, lien Créer le compte principal",
        text: [
          "L'écran « Se connecter » apparaît. Comme aucun compte n'existe encore, cliquez sur le lien « Créer le compte principal », sous « Première mise en service ? ».",
        ],
      },
      {
        title: "Remplir le formulaire",
        img: "04-creation-rempli", alt: "Formulaire de création du compte principal rempli",
        text: [
          "Type de compte : choisissez « Administrateur principal » pour la direction (accès complet). Le type « Enseignant » limite l'accès à une seule classe.",
          "Année scolaire : au format AAAA-AAAA, par exemple 2026-2027. Elle s'imprime sur tous les documents : bulletins, listes, registres.",
          "Nom du compte principal : le nom affiché dans le logiciel, par exemple « Direction — EPP Les Palmiers ».",
          "Nom d'utilisateur principal : l'identifiant que vous taperez pour vous connecter, par exemple « directeur.tanoh ».",
          "Mot de passe et confirmation : au moins 8 caractères. Les mots trop simples (123456, azerty, admin…) sont refusés.",
        ],
      },
      {
        title: "Choisir le code de récupération, puis créer le compte",
        img: "05-creation-bas", alt: "Champ Code de récupération propriétaire et bouton Créer le compte",
        text: [
          "Code de récupération propriétaire : un second code secret, différent du mot de passe. Il ne sert pas à se connecter : il permet uniquement de récupérer le compte si vous oubliez le mot de passe.",
          "Cliquez sur « Créer le compte ». Le logiciel revient à l'écran de connexion.",
        ],
        warn: "Notez le nom d'utilisateur, le mot de passe et le code de récupération sur papier et rangez-le en lieu sûr. Sans mot de passe ni code de récupération, le compte principal ne peut pas être récupéré.",
      },
    ],
  },
  {
    id: "connexion",
    title: "Se connecter et récupérer son compte",
    intro: "Après la création du compte, chaque connexion se fait avec deux informations seulement : le nom d'utilisateur principal et son mot de passe.",
    steps: [
      {
        title: "Se connecter",
        img: "07-connexion-remplie", alt: "Écran de connexion rempli avec le nom d'utilisateur principal",
        text: [
          "Nom d'utilisateur : tapez le nom d'utilisateur principal choisi à la création, par exemple « directeur.tanoh ».",
          "Mot de passe : tapez le mot de passe du compte, puis cliquez sur « Se connecter ».",
          "« Se souvenir de moi » évite de retaper ces informations. Cochez-le uniquement sur un appareil personnel.",
        ],
        tip: "Le code de récupération ne se tape jamais sur cet écran. Il sert seulement en cas de mot de passe oublié.",
      },
      {
        title: "Mot de passe oublié : récupérer le compte",
        img: "08-recuperation", alt: "Écran Réinitialisation propriétaire avec le champ Code de récupération",
        text: [
          "Sur l'écran de connexion, cliquez sur « Mot de passe oublié ? » ou sur « Réinitialisation propriétaire ».",
          "Saisissez votre code de récupération, puis choisissez un nouveau nom d'utilisateur et un nouveau mot de passe, à taper deux fois.",
          "Cliquez sur « Réinitialiser le compte principal ». Connectez-vous ensuite avec ces nouveaux identifiants. Les données de l'école restent intactes.",
        ],
      },
      {
        title: "Verrouillage automatique",
        text: [
          "Après quelques minutes sans activité, l'écran se verrouille pour protéger les données des élèves. Cliquez sur « Continuer » pour reprendre votre travail.",
        ],
      },
    ],
  },
  {
    id: "licence",
    title: "Activer la licence",
    intro: "Le logiciel démarre avec une période d'essai. Pour continuer ensuite, activez une clé de licence.",
    steps: [
      {
        title: "Saisir la clé d'activation",
        img: "09-licence", alt: "Page Gestion des licences avec la période d'essai et le champ Clé de licence",
        text: [
          "Cliquez sur la clé 🔑 en haut de l'écran, ou ouvrez le menu « Système » puis « Gestion des licences ». Le type de licence, la date d'expiration et les jours restants s'affichent.",
          "Collez votre clé dans le champ « Clé de licence » et cliquez sur « Activer la licence ». La clé est vérifiée automatiquement.",
          "Chaque appareil s'active avec sa propre clé, valable un an : 15 000 FCFA pour un ordinateur Windows et 5 000 FCFA pour un téléphone ou une tablette Android.",
        ],
        tip: "Pour obtenir une clé, contactez le développeur par WhatsApp ou par appel au +225 07 09 93 33 64.",
      },
    ],
  },
  {
    id: "ecole",
    title: "Renseigner l'école",
    intro: "Ces informations s'impriment automatiquement en en-tête de tous les documents. Elles ne se saisissent qu'une fois.",
    steps: [
      {
        title: "Informations de l'école et de la direction",
        img: "10-ecole", alt: "Paramètres, informations de l'école et de la direction",
        text: [
          "Cliquez sur la roue ⚙ en haut de l'écran pour ouvrir les Paramètres, puis repérez « Informations de l'école et en-tête des documents ».",
          "Renseignez le nom de l'établissement, l'adresse, la ville, la direction régionale, l'inspection, ainsi que le nom et le téléphone du directeur.",
        ],
      },
      {
        title: "Enseignants titulaires et en-tête officiel",
        img: "11-titulaires", alt: "Enseignants titulaires par classe et en-tête officiel",
        text: [
          "Indiquez pour chaque classe le nom et le téléphone de l'enseignant titulaire : ils apparaissent sur les listes et les bulletins.",
          "Vérifiez l'en-tête officiel (ministère, république, devise, emblème), puis cliquez sur « Enregistrer l'en-tête ».",
        ],
      },
    ],
  },
  {
    id: "classes",
    title: "Classes et matières",
    intro: "Les niveaux CP1 à CM2 sont déjà prêts. Adaptez-les à votre école, ainsi que les matières et leurs barèmes.",
    steps: [
      {
        title: "Gérer les niveaux",
        img: "12-niveaux", alt: "Gestion des niveaux dans les Paramètres",
        text: [
          "Dans les Paramètres, la rubrique « Gestion des niveaux » liste les classes de l'école. Le bouton « + Ajouter un niveau » crée une classe supplémentaire, et ⚙ règle un niveau existant.",
        ],
      },
      {
        title: "Gérer les matières",
        img: "14-matieres", alt: "Page Gestion des matières avec leurs barèmes",
        text: [
          "Menu « Académique » puis « Gestion des matières ». Chaque matière a son barème (/10, /20…). « + Ajouter une matière » en crée une nouvelle.",
        ],
      },
    ],
  },
  {
    id: "enseignants",
    title: "Créer les comptes enseignants",
    intro: "Chaque enseignant peut avoir son propre compte, limité à sa classe.",
    steps: [
      {
        title: "Ajouter un enseignant",
        img: "13-compte-enseignant", alt: "Fenêtre Créer un compte enseignant",
        text: [
          "Dans les Paramètres, rubrique « Gestion des enseignants », cliquez sur « + Créer un compte enseignant ».",
          "Indiquez le nom affiché, l'identifiant de connexion, le mot de passe (8 caractères au moins) et la classe assignée, puis laissez « Compte actif » coché.",
          "L'enseignant se connecte ensuite avec son identifiant et son mot de passe. Il ne voit que sa classe : élèves, notes, bulletins, registre d'appel et assiduité.",
        ],
      },
    ],
  },
  {
    id: "tableau-de-bord",
    title: "Choisir la classe de travail",
    intro: "Le tableau de bord résume les résultats et fixe la classe sur laquelle vous travaillez.",
    steps: [
      {
        title: "Le tableau de bord",
        img: "36-tableau-de-bord", alt: "Tableau de bord avec le niveau CM2 sélectionné",
        text: [
          "Choisissez le niveau, puis la composition. Les effectifs, la moyenne de la classe, les meilleurs élèves et le taux de réussite s'affichent aussitôt.",
          "Les autres pages (notes, rangement, bulletins, registre…) travaillent sur le niveau choisi ici. Si une page indique « Aucun niveau de classe sélectionné », revenez au tableau de bord pour en choisir un.",
        ],
      },
    ],
  },
  {
    id: "eleves",
    title: "Inscrire les élèves",
    intro: "Inscrivez les élèves un par un, ou importez une liste existante en une seule fois.",
    steps: [
      {
        title: "La liste des élèves",
        img: "15-eleves", alt: "Page Gestion des élèves",
        text: [
          "Menu « Académique » puis « Gestion des élèves ». Recherchez un élève par son nom, triez la liste de A à Z, ou modifiez une fiche avec ⚙.",
        ],
      },
      {
        title: "Ajouter un élève",
        img: "16-inscription", alt: "Formulaire Ajouter un élève rempli",
        text: [
          "Cliquez sur « + Ajouter un élève ». Renseignez le nom, le prénom, le genre, la date et le lieu de naissance, le niveau, le statut (nouveau ou redoublant) et la nationalité.",
          "Complétez les informations des parents ou du tuteur (noms et contacts), puis cliquez sur « Ajouter ».",
        ],
      },
      {
        title: "Ajouter la photo de l'élève",
        img: "16b-inscription-bas", alt: "Zone Photo de l'élève avec le bouton Choisir une photo",
        text: [
          "Dans « Photo de l'élève », cliquez sur « Choisir une photo » (format JPG ou PNG). La photo apparaît sur le bulletin.",
          "Sur Android, la photo se prend directement avec l'appareil photo du téléphone, sans quitter l'application.",
        ],
        tip: "Toutes les photos de ce tutoriel sont des illustrations fictives d'élèves portant un cache-nez.",
      },
      {
        title: "Importer une liste d'élèves",
        img: "17-import", alt: "Bloc Import intelligent des élèves",
        text: [
          "Menu « Système » puis « Convertisseur de fichiers », bloc « Import intelligent — Élèves ». Choisissez un fichier PDF, une photo de liste, un document Word ou un tableau Excel.",
          "Choisissez la classe cible, puis cliquez sur « Analyser le document ». Les élèves détectés s'affichent dans un tableau : relisez, corrigez si besoin, puis validez l'import.",
        ],
      },
      {
        title: "Imprimer la liste de classe",
        img: "18-liste-classe", alt: "Page Liste de classe",
        text: [
          "Menu « Académique » puis « Liste de classe ». Cliquez sur « Imprimer » ou « Exporter en PDF ». L'en-tête de l'école et le nom du titulaire sont ajoutés automatiquement.",
        ],
      },
    ],
  },
  {
    id: "notes",
    title: "Notes, rangement et bulletins",
    intro: "Saisissez les notes : les moyennes, les rangs et les décisions se calculent seuls.",
    steps: [
      {
        title: "Saisir les notes",
        img: "19-notes", alt: "Page Saisie des notes d'un élève",
        text: [
          "Menu « Académique » puis « Saisie des notes ». Choisissez l'élève dans la liste, ou passez de l'un à l'autre avec « Précédent » et « Suivant ».",
          "Choisissez la composition (COMP. N°1, N°2, N°3 ou PASSAGE), puis tapez les notes. La virgule est acceptée (12,50) et une note supérieure au barème est refusée.",
          "Cliquez sur « Enregistrer ».",
        ],
      },
      {
        title: "Le rangement de la classe",
        img: "20-rangement", alt: "Page Rangement avec le classement de la composition",
        text: [
          "Menu « Académique » puis « Rangement ». Choisissez une composition ou les résultats annuels : totaux, moyennes, rangs et décisions (Admis ou Refusé) sont calculés automatiquement.",
          "Cliquez sur « Imprimer » ou « PDF » pour obtenir le classement.",
        ],
      },
      {
        title: "Les bulletins",
        img: "21-bulletins", alt: "Page Bulletins scolaires avec l'aperçu d'un bulletin",
        text: [
          "Menu « Académique » puis « Bulletins scolaires ». Choisissez l'élève et la composition : l'aperçu du bulletin s'affiche, avec la photo de l'élève.",
          "« Imprimer » ou « Exporter en PDF » produit le bulletin de l'élève choisi. « Imprimer les bulletins » produit ceux de toute la classe.",
        ],
      },
    ],
  },
  {
    id: "documents",
    title: "Documents administratifs",
    intro: "Certificats et fiches se remplissent à partir de la fiche de l'élève.",
    steps: [
      {
        title: "Certificat de scolarité",
        img: "22-certificats", alt: "Page Certificats de scolarité remplie",
        text: [
          "Menu « Administration » puis « Certificats de scolarité ». Cliquez sur « Rechercher un élève » : ses informations se remplissent. Complétez les champs facultatifs, puis imprimez.",
          "Le certificat de fréquentation scolaire fonctionne de la même manière.",
        ],
      },
      {
        title: "Fiche scolaire",
        img: "23-fiche-scolaire", alt: "Page Fiche scolaire remplie",
        text: [
          "Menu « Administration » puis « Fiche scolaire ». Recherchez l'élève, complétez la fiche, puis imprimez-la pour le dossier administratif.",
        ],
        tip: "Tous ces documents sont présentés sur la page « Documents du logiciel ».",
      },
    ],
  },
  {
    id: "assiduite",
    title: "Appel, assiduité et statistiques",
    intro: "Faites l'appel en quelques secondes et suivez la fréquentation de chaque classe.",
    steps: [
      {
        title: "Faire l'appel",
        img: "24-registre", alt: "Registre d'appel de la classe",
        text: [
          "Menu « Assiduité » puis « Registre d'appel ». Choisissez l'année, le trimestre, le mois et le jour.",
          "« Tous présents » coche toute la classe. Marquez ensuite les absents du matin ou de l'après-midi, puis cliquez sur « Enregistrer l'appel ».",
        ],
      },
      {
        title: "Suivre l'assiduité",
        img: "25-assiduite", alt: "Page Assiduité des élèves",
        text: [
          "Menu « Assiduité » puis « Assiduité » : présences, absences, taux de fréquentation et élèves réguliers, par élève et pour toute la classe.",
        ],
      },
      {
        title: "Statistiques de l'école",
        img: "35-statistiques", alt: "Page Statistiques avec le tableau des âges",
        text: [
          "Menu « Administration » puis « Statistiques » : tableau des âges, effectifs et redoublements, récapitulatif des effectifs, effectifs et nationalités. Chaque tableau s'imprime ou s'exporte en PDF.",
        ],
      },
    ],
  },
  {
    id: "caisse",
    title: "Caisse et cours de renforcement",
    intro: "Encaissez les frais, imprimez les reçus et suivez les impayés.",
    steps: [
      {
        title: "La caisse",
        img: "27-caisse", alt: "Tableau de bord de la Caisse",
        text: [
          "Menu « Principal » puis « Caisse ». Les onglets couvrent l'encaissement, le décaissement, les scolarités, les réductions, les autres frais, les élèves non à jour, le journal, les clôtures, la paie, le budget et les rapports.",
          "Chaque encaissement produit un reçu numéroté. Si le module est masqué, affichez-le dans Paramètres, rubrique « Modules de l'application ».",
        ],
      },
      {
        title: "Les cours de renforcement",
        img: "28-renforcement", alt: "Module Cours de renforcement",
        text: [
          "Menu « Principal » puis « Cours de renforcement ». Cochez les élèves inscrits, définissez les cours et leurs tarifs, puis les mois de cours. Les paiements se font dans la Caisse.",
        ],
      },
    ],
  },
  {
    id: "pedagogie",
    title: "Pédagogie",
    intro: "Progressions et fiches de séance d'après les programmes officiels.",
    steps: [
      {
        title: "Progressions par classe",
        img: "29-progressions", alt: "Progression de la classe",
        text: [
          "Menu « Pédagogie » puis « Progressions par classe ». L'aperçu montre exactement ce qui sera imprimé. « Modifier » permet d'écrire directement dans le document. Chaque classe a sa propre progression.",
        ],
      },
      {
        title: "Fiches de séance",
        img: "30-fiches", alt: "Préparation d'une fiche de séance",
        text: [
          "Menu « Pédagogie » puis « Fiches de séance ». Choisissez la classe, la matière, le thème, la leçon et la séance, puis cliquez sur « Préparer la fiche ». La fiche suit la méthode APC : complétez-la puis imprimez-la.",
        ],
      },
    ],
  },
  {
    id: "outils",
    title: "Synchronisation, convertisseur et assistant",
    intro: "Des outils qui fonctionnent sans Internet.",
    steps: [
      {
        title: "Échanger les données avec les enseignants",
        img: "31-synchronisation", alt: "Page Synchronisation",
        text: [
          "Menu « Système » puis « Synchronisation ». Pour envoyer, choisissez la classe et un mot de passe, puis cliquez sur « Créer le fichier .gspp ». Transmettez le fichier par clé USB, Bluetooth ou WhatsApp.",
          "Pour recevoir, choisissez le fichier .gspp, saisissez son mot de passe et cliquez sur « Lire le fichier ». Vous examinez chaque donnée avant de l'intégrer.",
        ],
      },
      {
        title: "Convertisseur de fichiers",
        img: "34-convertisseur", alt: "Convertisseur de fichiers",
        text: [
          "Menu « Système » puis « Convertisseur de fichiers ». Il convertit un PDF en Word ou en Excel, et un Word en PDF. Les PDF scannés sont lus par reconnaissance de texte (OCR), et aucun fichier n'est envoyé sur Internet.",
        ],
      },
      {
        title: "L'assistant Brahima",
        img: "37-assistant", alt: "Assistant Brahima ouvert",
        text: [
          "Cliquez sur le personnage en bas à droite. Brahima retrouve un élève, répond aux questions de statistiques (effectifs, filles et garçons, redoublants, moyennes) et vous guide dans le logiciel.",
        ],
      },
    ],
  },
  {
    id: "fin-annee",
    title: "Sauvegarde et fin d'année",
    intro: "Protégez votre travail et préparez l'année suivante.",
    steps: [
      {
        title: "Sauvegarder les données",
        img: "32-sauvegarde", alt: "Rubrique Sauvegarde des données",
        text: [
          "Dans les Paramètres, rubrique « Sauvegarde des données » : « Exporter » crée une copie complète, et « Export chiffré » la protège par mot de passe. « Importer » restaure une sauvegarde.",
          "Activez les sauvegardes automatiques et choisissez leur fréquence : quotidienne, hebdomadaire ou mensuelle.",
        ],
        tip: "Gardez régulièrement une copie de la sauvegarde sur une clé USB.",
      },
      {
        title: "Le passage de classe",
        img: "33-passage", alt: "Rubrique Passage de classe",
        text: [
          "En fin d'année, dans les Paramètres, rubrique « Passage de classe » : « Aperçu du passage » montre qui passe et qui redouble, d'après la moyenne annuelle. « Lancer le passage de classe » applique les changements.",
        ],
        warn: "Imprimez les bulletins de l'année et faites une sauvegarde avant de lancer le passage : les notes de l'année écoulée sont réinitialisées.",
      },
    ],
  },
];

// Numéro de la première étape de chaque chapitre (numérotation continue)
const FIRST_STEP = CHAPTERS.map((_, i) => CHAPTERS.slice(0, i).reduce((t, c) => t + c.steps.length, 1));

function scrollToHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
}

export function GuidePage() {
  const [zoom, setZoom] = useState<Step | null>(null);
  useEffect(scrollToHash, []);

  return (
    <main id="contenu">
      <PageHero
        eyebrow="Tutoriel d'utilisation"
        title="Utiliser Gestion Scolaire Pro Plus, étape par étape"
        description="De la création du compte principal à la fin de l'année, chaque étape est illustrée par une capture du vrai logiciel, avec une école et des élèves fictifs."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" className="rounded-full" onClick={() => document.getElementById("compte")?.scrollIntoView({ behavior: "smooth" })}>
            <KeyRound className="mr-1.5 h-4 w-4" aria-hidden="true" /> Commencer par le compte
          </Button>
          <Button size="lg" variant="outline" className="rounded-full" onClick={() => navigate("/documents")}>
            <Images className="mr-1.5 h-4 w-4" aria-hidden="true" /> Voir les documents
          </Button>
        </div>
      </PageHero>

      <Section className="pb-0 sm:pb-0 lg:pb-0">
        <nav aria-label="Sommaire du tutoriel" className="mx-auto max-w-5xl rounded-3xl border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sommaire</h2>
          <ol className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {CHAPTERS.map((c, i) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.replaceState(null, "", `#${c.id}`);
                    document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-baseline gap-2 text-sm hover:text-primary"
                >
                  <span className="w-6 shrink-0 font-mono text-xs text-orange-700 dark:text-orange-400">{String(i + 1).padStart(2, "0")}</span>
                  {c.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Section>

      {CHAPTERS.map((c, ci) => (
        <Section key={c.id} id={c.id} className={`scroll-mt-20 ${ci % 2 === 1 ? "bg-secondary/40" : ""}`}>
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
              Chapitre {ci + 1}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{c.title}</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{c.intro}</p>

            <div className="mt-10 space-y-14">
              {c.steps.map((s, si) => {
                const n = FIRST_STEP[ci] + si;
                return (
                  <article key={s.title} className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
                    <div>
                      <h3 className="flex items-start gap-3 text-lg font-semibold">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
                          {n}
                        </span>
                        <span className="pt-0.5">{s.title}</span>
                      </h3>
                      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                        {s.text.map((p) => <p key={p}>{p}</p>)}
                      </div>
                      {s.tip && (
                        <p className="mt-4 flex gap-2 rounded-2xl border border-orange-600/25 bg-orange-600/5 p-3.5 text-sm leading-relaxed">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                          <span>{s.tip}</span>
                        </p>
                      )}
                      {s.warn && (
                        <p className="mt-4 flex gap-2 rounded-2xl border border-red-600/25 bg-red-600/5 p-3.5 text-sm leading-relaxed">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                          <span>{s.warn}</span>
                        </p>
                      )}
                    </div>
                    {s.img ? (
                      <button
                        type="button"
                        onClick={() => setZoom(s)}
                        className="group relative block overflow-hidden rounded-2xl border bg-card shadow-lg transition hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                        aria-label={`Agrandir : ${s.alt}`}
                      >
                        <Image
                          src={`/tutoriel/${s.img}.webp`}
                          alt={s.alt ?? s.title}
                          width={SHOT.w}
                          height={SHOT.h}
                          sizes="(min-width: 1024px) 600px, 100vw"
                          className="h-auto w-full"
                        />
                        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                          <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" /> Agrandir
                        </span>
                      </button>
                    ) : (
                      <div className="hidden lg:block" />
                    )}
                  </article>
                );
              })}
            </div>

            {c.id === "installation" && (
              <div className="mt-8">
                <Button className="rounded-full" onClick={() => navigate("/telecharger")}>
                  <Download className="mr-1.5 h-4 w-4" aria-hidden="true" /> Aller à la page Télécharger
                </Button>
              </div>
            )}
            {c.id === "documents" && (
              <div className="mt-8">
                <Button variant="outline" className="rounded-full" onClick={() => navigate("/documents")}>
                  <Images className="mr-1.5 h-4 w-4" aria-hidden="true" /> Voir tous les documents du logiciel
                </Button>
              </div>
            )}
          </div>
        </Section>
      ))}

      <Section className="bg-secondary/40">
        <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold">Une étape vous bloque ?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Le support répond par WhatsApp, par appel ou par le formulaire de contact. La notice détaille aussi chaque module.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button className="rounded-full" onClick={() => navigate("/support")}>Contacter le support</Button>
            <Button variant="outline" className="rounded-full" onClick={() => navigate("/notice")}>Lire la notice</Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Les captures montrent la version 2.3.21 pour Windows. École, enseignants, élèves et photos sont fictifs.{" "}
            <Link to="/fonctionnalites" className="font-semibold text-primary hover:underline">Toutes les fonctionnalités</Link>
          </p>
        </div>
      </Section>

      <Dialog open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-[min(96vw,1400px)] p-2 sm:max-w-[min(96vw,1400px)]">
          <DialogTitle className="sr-only">{zoom?.title}</DialogTitle>
          <DialogDescription className="sr-only">{zoom?.alt}</DialogDescription>
          {zoom?.img && (
            <Image
              src={`/tutoriel/${zoom.img}.webp`}
              alt={zoom.alt ?? zoom.title}
              width={SHOT.w}
              height={SHOT.h}
              sizes="96vw"
              className="h-auto w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
