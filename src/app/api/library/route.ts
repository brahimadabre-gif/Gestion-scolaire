import { db } from "@/lib/db";
import { handle, ok } from "@/lib/api-helpers";

// GET /api/library — bibliothèque publique, uniquement les documents publiés
export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category")?.trim();
    const level = searchParams.get("level")?.trim();
    const items = await db.libraryDocument.findMany({
      where: {
        published: true,
        ...(category && category !== "Toutes" ? { category } : {}),
        ...(level && level !== "Tous niveaux" ? { level } : {}),
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return ok(items);
  });
}
