import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

// GET /api/articles — Liste des actualités publiées (public)
export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");
    const category = searchParams.get("category");
    const articles = await db.article.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      orderBy: { publishedAt: "desc" },
      ...(limit ? { take: Math.min(parseInt(limit) || 10, 50) } : {}),
    });
    return ok(articles);
  });
}
