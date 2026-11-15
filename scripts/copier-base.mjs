// ── Copie de la base Netlify vers la base Neon ───────────────
// La base source (Netlify) est seulement LUE. La base cible (Neon) reçoit la
// structure (prisma db push) puis toutes les lignes, table par table, dans
// l'ordre des dépendances. Les adresses ne sont jamais affichées.
//
// Utilisation (PowerShell, dans le dossier du site) :
//   $env:SOURCE_DATABASE_URL = "adresse de la base Netlify"
//   $env:CIBLE_DATABASE_URL  = "adresse de la base Neon (connexion directe, sans -pooler)"
//   node scripts/copier-base.mjs              # première copie (cible vide)
//   node scripts/copier-base.mjs --remplacer  # recopie : vide la cible puis recopie
import { execFileSync } from "node:child_process";
import { Prisma, PrismaClient } from "@prisma/client";

const source = process.env.SOURCE_DATABASE_URL;
const cible = process.env.CIBLE_DATABASE_URL;
const remplacer = process.argv.includes("--remplacer");

if (!source || !cible) {
  console.error("Il manque SOURCE_DATABASE_URL ou CIBLE_DATABASE_URL.");
  process.exit(1);
}
if (source.trim() === cible.trim()) {
  console.error("La source et la cible sont la même base : arrêt.");
  process.exit(1);
}

// 1. Structure des tables dans la base cible
console.log("1/3  Création des tables dans la base Neon…");
const npx = process.platform === "win32" ? [process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npx prisma db push --skip-generate"]] : ["npx", ["prisma", "db", "push", "--skip-generate"]];
execFileSync(npx[0], npx[1], { stdio: "inherit", env: { ...process.env, DATABASE_URL: cible } });

// 2. Ordre des tables : une table passe après celles dont elle dépend
const modeles = Prisma.dmmf.datamodel.models;
const deps = new Map(modeles.map((m) => [m.name, m.fields.filter((f) => f.relationFromFields?.length).map((f) => f.type).filter((t) => t !== m.name)]));
const ordre = [];
while (ordre.length < modeles.length) {
  const pret = modeles.find((m) => !ordre.includes(m.name) && deps.get(m.name).every((d) => ordre.includes(d)));
  if (!pret) throw new Error("Dépendances circulaires entre tables : copie impossible.");
  ordre.push(pret.name);
}
const delegue = (client, nom) => client[nom[0].toLowerCase() + nom.slice(1)];

const src = new PrismaClient({ datasourceUrl: source });
const dst = new PrismaClient({ datasourceUrl: cible });

try {
  // La cible doit être vide (première copie) ou vidée explicitement (--remplacer)
  let dejaRempli = 0;
  for (const nom of ordre) dejaRempli += await delegue(dst, nom).count();
  if (dejaRempli > 0 && !remplacer) {
    console.error(`La base Neon contient déjà ${dejaRempli} ligne(s). Relancez avec --remplacer pour la vider et recopier.`);
    process.exit(1);
  }
  if (remplacer) {
    console.log("     Vidage de la base Neon (ordre inverse)…");
    for (const nom of [...ordre].reverse()) await delegue(dst, nom).deleteMany({});
  }

  console.log("2/3  Copie des données…");
  for (const nom of ordre) {
    const lignes = await delegue(src, nom).findMany();
    for (let i = 0; i < lignes.length; i += 500) {
      await delegue(dst, nom).createMany({ data: lignes.slice(i, i + 500) });
    }
    console.log(`     ${nom.padEnd(20)} ${lignes.length} ligne(s)`);
  }

  console.log("3/3  Vérification…");
  let ecarts = 0;
  for (const nom of ordre) {
    const [a, b] = await Promise.all([delegue(src, nom).count(), delegue(dst, nom).count()]);
    if (a !== b) { ecarts++; console.log(`     ÉCART ${nom} : Netlify ${a}, Neon ${b}`); }
  }
  console.log(ecarts === 0 ? "✅ Copie terminée : toutes les tables ont le même nombre de lignes." : `❌ ${ecarts} table(s) différente(s).`);
  if (ecarts) process.exitCode = 1;
} finally {
  await Promise.all([src.$disconnect(), dst.$disconnect()]);
}
