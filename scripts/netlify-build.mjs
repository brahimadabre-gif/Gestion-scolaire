import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";

const runNpx = (args, options) => {
  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx ${args.join(" ")}`], options);
  } else {
    execFileSync("npx", args, options);
  }
};
const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL || process.env.NETLIFY_DB_URL };

if (process.env.NETLIFY || process.env.NETLIFY_DB_URL) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL/NETLIFY_DB_URL est requis sur Netlify.");
  runNpx(["prisma", "db", "push"], { stdio: "inherit", env });
  if (env.SITE_ADMIN_PASSWORD) {
    execFileSync(process.execPath, ["--experimental-strip-types", "prisma/seed.ts"], { stdio: "inherit", env });
  }
}

runNpx(["next", "build"], { stdio: "inherit", env });
mkdirSync(".next/standalone/.next", { recursive: true });
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
if (existsSync("public")) cpSync("public", ".next/standalone/public", { recursive: true });
