import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api-helpers";

// GET /api/docs — Sections de la notice d'utilisation
// Sans ?slug : liste (numéro, titre, slug, icône). Avec ?slug : section complète.
export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const section = await db.docSection.findUnique({ where: { slug } });
      if (!section) return fail("Section introuvable", 404);
      return ok(section);
    }

    const sections = await db.docSection.findMany({
      orderBy: { number: "asc" },
      select: { number: true, slug: true, title: true, icon: true },
    });
    return ok(sections);
  });
}
