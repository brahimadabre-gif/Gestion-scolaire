// Construction du site pour Cloudflare Workers (appelée par `opennextjs-cloudflare build`).
// Contrairement à Netlify, rien n'est écrit dans la base pendant la construction :
// après un changement de prisma/schema.prisma, lancer `npx prisma db push`
// avec l'adresse de la base Neon.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";

const runNpx = (args, options) => {
  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx ${args.join(" ")}`], options);
  } else {
    execFileSync("npx", args, options);
  }
};

const env = { ...process.env, GSPP_CIBLE: "cloudflare" };

// Prisma sans moteur Rust (engineType = "client") : le programme envoyé à
// Cloudflare est plus léger. Le schéma d'origine n'est pas modifié ; une copie
// adaptée est générée ici (ignorée par git). `npm run cf:build` régénère ensuite
// le client normal pour le développement local et Netlify.
const schema = readFileSync("prisma/schema.prisma", "utf8");
const schemaCf = schema.replace(
  /generator client \{([^}]*)\}/,
  (_m, corps) => `generator client {${corps.replace(/\s*binaryTargets[^\n]*\n/, "\n")}  engineType = "client"\n}`
);
if (!schemaCf.includes('engineType = "client"')) throw new Error("Bloc generator introuvable dans prisma/schema.prisma.");
writeFileSync("prisma/schema.cloudflare.prisma", schemaCf);

runNpx(["prisma", "generate", "--schema", "prisma/schema.cloudflare.prisma"], { stdio: "inherit", env });
rmSync(".next", { recursive: true, force: true });
runNpx(["next", "build"], { stdio: "inherit", env });
