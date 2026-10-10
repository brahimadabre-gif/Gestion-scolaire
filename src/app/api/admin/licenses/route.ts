import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, fail, getClientIp, handle, logAction, rateLimit, ok } from "@/lib/api-helpers";
import { generateLicenseKey, requireAdmin } from "@/lib/auth";
import { getLicenseStatus } from "@/lib/license-duration";

const createSchema = z.object({
  count: z.number().int().min(1).max(100),
  durationMonths: z.number().int().min(1).max(600),
});

// GET /api/admin/licenses — Liste réservée aux administrateurs.
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 120).toLocaleLowerCase();
    const requestedStatus = url.searchParams.get("status") ?? "all";
    const sort = url.searchParams.get("sort") ?? "createdAt";
    const direction = url.searchParams.get("direction") === "asc" ? 1 : -1;
    const now = new Date();

    const records = await db.licenseKey.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, establishment: true } },
        subscription: { select: { id: true, status: true, startDate: true, endDate: true, plan: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    const items = records.map((license) => ({
      id: license.id,
      key: license.key,
      status: getLicenseStatus({ status: license.status, expiresAt: license.expiresAt, subscriptionEndDate: license.subscription?.endDate ?? null, subscriptionStatus: license.subscription?.status ?? null }, now),
      createdAt: license.createdAt,
      validityMonths: license.validityMonths,
      activatedAt: license.activatedAt,
      expiresAt: license.expiresAt ?? license.subscription?.endDate ?? null,
      deviceFingerprint: license.deviceFingerprint,
      maxDevices: license.maxDevices,
      user: license.user,
      subscription: license.subscription,
    })).filter((license) => {
      if (requestedStatus !== "all" && license.status !== requestedStatus.toUpperCase()) return false;
      if (!q) return true;
      const searchable = [license.key, license.user?.email, license.user?.firstName, license.user?.lastName, license.user?.establishment].filter(Boolean).join(" ").toLocaleLowerCase();
      return searchable.includes(q);
    });

    const sorters: Record<string, (a: typeof items[number]) => string | number> = {
      createdAt: (x) => x.createdAt.getTime(),
      activatedAt: (x) => x.activatedAt?.getTime() ?? 0,
      expiresAt: (x) => x.expiresAt?.getTime() ?? 0,
      status: (x) => x.status,
      key: (x) => x.key,
    };
    const value = sorters[sort] ?? sorters.createdAt;
    items.sort((a, b) => {
      const left = value(a);
      const right = value(b);
      return (typeof left === "string" && typeof right === "string" ? left.localeCompare(right) : Number(left) - Number(right)) * direction;
    });
    return ok({ items, truncated: records.length === 2000 });
  });
}

// POST /api/admin/licenses — Émission atomique de codes à activation unique.
export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin(req);
    const ip = getClientIp(req);
    const rl = rateLimit(`admin-license-generate:${admin.id}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) return fail("Trop de générations. Réessayez plus tard.", 429);

    const { count, durationMonths } = createSchema.parse(await req.json());
    const codes = Array.from({ length: count }, () => generateLicenseKey());
    if (new Set(codes).size !== codes.length) return fail("La génération a rencontré un doublon. Réessayez.", 409);

    try {
      await db.$transaction(async (tx) => {
        await tx.licenseKey.createMany({
          data: codes.map((key) => ({
            key,
            userId: null,
            subscriptionId: null,
            status: "INACTIVE",
            validityMonths: durationMonths,
            maxDevices: 1,
          })),
        });
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
        return fail("Un doublon a été détecté. Aucun code n'a été généré; réessayez.", 409);
      }
      throw error;
    }

    await logAction("LICENSE_CODES_GENERATED", admin.id, `${count} code(s), durée ${durationMonths} mois`, ip);
    return ok({ codes, count, durationMonths }, 201);
  });
}
