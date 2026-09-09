# Gestion Scolaire Pro Plus — Site officiel & plateforme SaaS

> **« Simplifiez votre travail avec Gestion Scolaire Pro Plus ! »**

Plateforme centrale du logiciel : **présentation → documentation → compte → abonnement → paiement → téléchargement → licence → support**.

---

## 1. Architecture du projet

```
gestion-scolaire-pro-plus/
├── prisma/
│   ├── schema.prisma          # Schéma de base de données (12 modèles)
│   └── seed.ts                # Contenu initial (formules, FAQ, doc, comptes…)
├── db/custom.db               # Base SQLite
├── public/
│   ├── favicon.svg            # Favicon (chapeau de diplômé, dégradé émeraude)
│   └── manifest.webmanifest   # PWA manifest
├── scripts/
│   └── e2e-test.ts            # Suite de tests navigateur end-to-end (28 tests)
└── src/
    ├── app/
    │   ├── layout.tsx         # SEO (Open Graph, JSON-LD SoftwareApplication, viewport)
    │   ├── page.tsx           # Point d'entrée de la SPA
    │   ├── globals.css        # Design system (émeraude/ambre, mode sombre)
    │   ├── sitemap.ts         # Sitemap dynamique
    │   ├── robots.ts          # robots.txt dynamique
    │   └── api/               # ← BACKEND (API REST réelles)
    │       ├── auth/          #   register, login, logout, me, forgot/reset/change password, profil
    │       ├── plans|testimonials|faqs|articles|docs|versions|settings   # contenu public
    │       ├── subscriptions|payments|tickets                             # espace client
    │       ├── license/       #   activate, status (API machine-à-machine, clé x-api-key)
    │       └── admin/         #   stats, users, CRUD générique (liste blanche d'entités)
    ├── lib/
    │   ├── auth.ts            # JWT (jose), bcrypt, licences, tokens de reset
    │   ├── api-helpers.ts     # Réponses normalisées, rate limiting, CSRF (origine), audit
    │   ├── validations.ts     # Schémas Zod (validation serveur)
    │   ├── billing.ts         # Confirmation paiement → activation → facture → licence
    │   ├── db.ts              # Client Prisma
    │   └── site.ts            # Configuration centrale éditable (nom, nav, mots-clés SEO)
    └── components/gspp/
        ├── app-shell.tsx      # Aiguillage SPA + providers (Query, Theme, Auth)
        ├── router.tsx         # Routeur par hash (useSyncExternalStore)
        ├── auth-context.tsx   # Session utilisateur (cookie httpOnly)
        ├── site-header|site-footer.tsx
        ├── app-mockup.tsx     # Captures d'écran vivantes du logiciel (CSS pur)
        └── pages/             # home, features, pricing, download, docs, tutorial,
                               # faq, support, news, auth, account, account-subscription,
                               # admin, legal
```

**Pourquoi une SPA à routeur hash ?** L'environnement d'exécution du sandbox expose une seule page. Pour la **mise en production**, chaque composant de `components/gspp/pages/` se déplace tel quel vers une route du App Router Next.js (`app/fonctionnalites/page.tsx`, etc.) pour obtenir des URLs propres — la logique est 100 % réutilisable.

## 2. Technologies

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 strict |
| UI | Tailwind CSS 4, shadcn/ui (New York), Lucide, Framer Motion |
| État serveur | TanStack Query · État local : React + next-themes |
| Base de données | Prisma ORM + SQLite |
| Sécurité | JWT (jose) en cookie httpOnly, bcryptjs, Zod, rate limiting, contrôle d'origine, audit log |
| Tests | Playwright (28 scénarios E2E automatisés) |

## 3. Installation

```bash
bun install                  # dépendances
bun run db:push              # créer/synchroniser la base
bun prisma/seed.ts           # contenu initial + comptes de démonstration
bun run dev                  # serveur de développement (port 3000)
bun run lint                 # qualité (0 erreur)
bun scripts/e2e-test.ts      # tests navigateur complets
```

## 4. Variables d'environnement (.env — voir .env.example)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chemin SQLite (`file:./db/custom.db`) |
| `JWT_SECRET` | Signature des sessions — **générer : `openssl rand -hex 32`** |
| `SOFTWARE_API_KEY` | Clé API du logiciel (en-tête `x-api-key`) — jamais côté frontend |
| `SMTP_*` | Service e-mail (réinitialisation mot de passe, notifications) — à configurer |
| `PSP_*` | Clés des passerelles de paiement (Orange Money, MTN, Wave, Stripe…) — à intégrer |

## 5. Comptes de démonstration (seed)

Les comptes de démonstration sont initialisés par le seed, mais aucun mot de passe
n'est stocké dans le dépôt. Définissez `SEED_ADMIN_PASSWORD` et
`SEED_DEMO_PASSWORD` uniquement dans l'environnement privé du déploiement ou
dans un fichier local non versionné.

## 6. Intégration avec le logiciel (API machine-à-machine)

Le logiciel s'authentifie avec l'en-tête **`x-api-key: SOFTWARE_API_KEY`** :

```http
POST /api/license/activate     { "licenseKey": "GSPP-…", "deviceFingerprint": "…" }
POST /api/license/status       { "licenseKey": "GSPP-…" }
```

Réponses : validité de la licence, statut de l'abonnement, plan, date d'expiration, jours restants, limite d'appareils, informations établissement. Anti brute-force inclus (10 tentatives / 15 min / IP).

## 7. Éléments restant à configurer avant production

1. **Paiement réel** — le point d'extension est `POST /api/payments` (webhook PSP à brancher : Orange Money / MTN / Wave / Stripe / CinetPay). La confirmation manuelle simulée disparaît alors.
2. **Service e-mail SMTP** — les liens de réinitialisation s'affichent actuellement à l'écran (mode démo, clairement identifié) dès que `SMTP_*` est configuré, ils ne seront plus retournés par l'API.
3. **URL de téléchargement** — configurable dans Admin → Versions (`downloadUrl`) à chaque nouvelle version.
4. **Stockage de fichiers** (pièces jointes des tickets) — brancher S3/Cloudflare R2.
5. **Domaine + HTTPS** + passer de la SPA au App Router multi-pages (URLs propres, cf. §1).
6. **Migration PostgreSQL** recommandée (SQLite → Postgres : changer le provider Prisma).

## 8. Recommandations de sécurité (implémentées ✓ / à activer)

**Implémenté** : mots de passe hachés bcrypt · sessions JWT httpOnly + SameSite=Lax · limitation des tentatives (login 8/15 min, inscription 5/15 min) · messages d'erreur anti-énumération · contrôle d'origine (CSRF) sur toutes les mutations · validation Zod serveur partout · requêtes paramétrées Prisma (anti-injection SQL) · tokens de réinitialisation hashés + expiration 1 h · séparation des rôles USER/SUPPORT/ADMIN · journal d'audit des actions sensibles · aucune clé secrète dans le frontend · AUCUNE donnée de carte bancaire stockée.

**Avant mise en production** : activer HTTPS/HSTS, ajouter un en-tête CSP strict, restreindre la clé `SOFTWARE_API_KEY` par IP du serveur du logiciel, rotation périodique de `JWT_SECRET`, sauvegardes automatiques de la base, supervision des logs d'audit.
