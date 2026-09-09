import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, handle } from "@/lib/api-helpers";

// GET /api/library/:id — redirection vers le fichier et compteur de téléchargements
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const item = await db.libraryDocument.findFirst({ where: { id, published: true } });
    if (!item) return fail("Document introuvable.", 404);
    await db.libraryDocument.update({ where: { id }, data: { downloads: { increment: 1 } } });
    return NextResponse.redirect(item.downloadUrl, 302);
  });
}
