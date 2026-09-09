import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/users — Liste des comptes (recherche + pagination)
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const pageSize = 20;

    const where = q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { establishment: { contains: q } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          establishment: true, country: true, role: true, active: true,
          emailVerified: true, createdAt: true, lastLoginAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({ users, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) });
  });
}
