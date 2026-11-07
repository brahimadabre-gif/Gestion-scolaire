// ─────────────────────────────────────────────────────────────
// Migration des données : plateformes des formules et des licences.
// Idempotent — exécuté à chaque build Netlify juste après `prisma db push`.
// Manuel : node --experimental-strip-types prisma/backfill-license-platform.ts
//
// 1. La formule « mobile » devient la formule Android (les autres restent PC).
// 2. Les licences liées à un abonnement prennent la plateforme de la formule.
// 3. Les clés GSPC-/GSAN- prennent la plateforme de leur préfixe.
// 4. Les anciens codes directs GSPP- sans abonnement restent à null : le serveur
//    les rattache à la plateforme du premier appareil qui les contrôle (activation
//    ou vérification de statut), puis refuse l'autre plateforme. L'administrateur
//    peut aussi les rattacher à la main depuis « Gestion des licences ».
// 5. La formule PC 3 mois (5 000 FCFA) est créée si elle n'existe pas encore.
// ─────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
import { platformFromKey, platformFromPlan } from "../src/lib/license-platform.ts";

import { PC_QUARTER_PLAN } from "./pc-quarter-plan.ts";

const db = new PrismaClient();

async function main() {
  const mobilePlans = await db.subscriptionPlan.updateMany({
    where: { slug: "mobile", platform: { not: "ANDROID" } },
    data: { platform: "ANDROID" },
  });

  const pending = await db.licenseKey.findMany({
    where: { platform: null },
    select: { id: true, key: true, subscription: { select: { plan: { select: { slug: true, platform: true } } } } },
  });

  let fromPlan = 0;
  let fromPrefix = 0;
  for (const license of pending) {
    const prefixPlatform = platformFromKey(license.key);
    const planPlatform = platformFromPlan(license.subscription?.plan);
    const platform = prefixPlatform ?? planPlatform;
    if (!platform) continue;
    await db.licenseKey.updateMany({ where: { id: license.id, platform: null }, data: { platform } });
    if (prefixPlatform) fromPrefix++; else fromPlan++;
  }

  const quarter = await db.subscriptionPlan.findUnique({ where: { slug: PC_QUARTER_PLAN.slug } });
  if (!quarter) await db.subscriptionPlan.create({ data: PC_QUARTER_PLAN });

  const remaining = await db.licenseKey.count({ where: { platform: null } });
  console.log(
    `🔑 Plateformes : formule mobile→Android (${mobilePlans.count}), ` +
    `${fromPlan} licence(s) via la formule, ${fromPrefix} via le préfixe, ` +
    `${remaining} ancien(s) code(s) direct(s) rattaché(s) au premier appareil.` +
    (quarter ? "" : " Formule PC 3 mois créée."),
  );
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
