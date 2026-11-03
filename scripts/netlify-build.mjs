import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

const runNpx = (args, options) => {
  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx ${args.join(" ")}`], options);
  } else {
    execFileSync("npx", args, options);
  }
};
const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL || process.env.NETLIFY_DB_URL };
const onNetlify = Boolean(process.env.NETLIFY || process.env.NETLIFY_DB_URL);

if (onNetlify) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL/NETLIFY_DB_URL est requis sur Netlify.");
  // Netlify utilise un moteur Linux différent de Windows/macOS : le client
  // Prisma doit être généré avant le push et le seed de la base.
  runNpx(["prisma", "generate"], { stdio: "inherit", env });
  runNpx(["prisma", "db", "push", "--skip-generate"], { stdio: "inherit", env });
  if (env.SITE_ADMIN_PASSWORD) {
    execFileSync(process.execPath, ["--experimental-strip-types", "prisma/seed.ts"], { stdio: "inherit", env });
  }
}

// Netlify peut conserver un cache `.next` entre deux déploiements. Une
// compilation propre évite de servir un ancien bundle client après une mise à jour.
rmSync(".next", { recursive: true, force: true });
runNpx(["next", "build"], { stdio: "inherit", env });
// Sur Netlify, le runtime Next.js force la sortie standalone et copie tout
// .next/standalone dans la fonction serveur : y mettre public/ (installateurs
// APK/EXE compris) la rend trop lourde pour être créée. Netlify sert déjà
// public/ et .next/static depuis son CDN.
if (!onNetlify && existsSync(".next/standalone")) {
  mkdirSync(".next/standalone/.next", { recursive: true });
  cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
  if (existsSync("public")) cpSync("public", ".next/standalone/public", { recursive: true });
}
