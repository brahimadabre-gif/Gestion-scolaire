// Configuration OpenNext pour Cloudflare Workers.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();
// Construction dédiée : génère Prisma puis lance `next build` avec GSPP_CIBLE=cloudflare.
config.buildCommand = "node scripts/cloudflare-build.mjs";

export default config;
