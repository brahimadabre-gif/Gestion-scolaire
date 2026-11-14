import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { db } from "@/lib/db";
import { fail, handle } from "@/lib/api-helpers";

// GET /api/library/:id — sert les fichiers locaux et conserve le compteur de téléchargements
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const item = await db.libraryDocument.findFirst({ where: { id, published: true } });
    if (!item) return fail("Document introuvable.", 404);
    await db.libraryDocument.update({ where: { id }, data: { downloads: { increment: 1 } } });

    // Les ressources embarquées dans le déploiement doivent être servies par
    // Next.js lui-même : Netlify ne garantit pas la présence de l'URL stockée
    // en base dans le répertoire public après un build standalone.
    const fileUrl = new URL(item.downloadUrl);
    const localPrefix = "/library/";
    if (fileUrl.origin === new URL(_req.url).origin && fileUrl.pathname.startsWith(localPrefix)) {
      // Cloudflare Workers : pas de disque, le fichier est lu dans les ressources statiques.
      if (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers") {
        const { env } = getCloudflareContext();
        const assets = (env as unknown as { ASSETS?: { fetch: (u: URL) => Promise<Response> } }).ASSETS;
        const res = assets ? await assets.fetch(new URL(fileUrl.pathname, _req.url)) : null;
        if (!res || !res.ok) return fail("Fichier du document introuvable sur le serveur.", 404);
        const filename = decodeURIComponent(fileUrl.pathname.split("/").pop() || "document");
        return new NextResponse(res.body, {
          headers: {
            "Content-Type": item.fileType.toLowerCase() === "pdf" ? "application/pdf" : "application/octet-stream",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      const relativePath = fileUrl.pathname.slice(1);
      const publicRoot = path.join(process.cwd(), "public");
      const absolutePath = path.resolve(publicRoot, relativePath);
      if (absolutePath.startsWith(`${publicRoot}${path.sep}`)) {
        try {
          const file = await readFile(absolutePath);
          const filename = path.basename(absolutePath);
          return new NextResponse(file, {
            headers: {
              "Content-Type": item.fileType.toLowerCase() === "pdf" ? "application/pdf" : "application/octet-stream",
              "Content-Disposition": `attachment; filename="${filename}"`,
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch {
          return fail("Fichier du document introuvable sur le serveur.", 404);
        }
      }
    }

    return NextResponse.redirect(item.downloadUrl, 302);
  });
}
