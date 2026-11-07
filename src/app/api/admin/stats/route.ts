import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { getLicenseStatus, type LicenseStatus } from "@/lib/license-duration";
import { resolveLicensePlatform, type LicensePlatform } from "@/lib/license-platform";

type PlatformKey = LicensePlatform | "UNKNOWN";
const PLATFORM_KEYS: PlatformKey[] = ["PC", "ANDROID", "UNKNOWN"];
const STATUS_KEYS: LicenseStatus[] = ["AVAILABLE", "ACTIVE", "EXPIRED", "REVOKED"];
const DAY = 86_400_000;

// GET /api/admin/stats — Statistiques du tableau de bord administration
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * DAY);

    const [
      totalUsers,
      activeUsers,
      newUsers30,
      totalSubs,
      activeSubs,
      completedPayments,
      pendingPayments,
      openTickets,
      articles,
      totalRevenueAgg,
      monthRevenueAgg,
      recentLogs,
      recentUsers,
      version,
      licenses,
      refusedPlatform30,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { active: true } }),
      db.user.count({ where: { createdAt: { gte: since30 } } }),
      db.subscription.count(),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.payment.count({ where: { status: "COMPLETED" } }),
      db.payment.count({ where: { status: "PENDING" } }),
      db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      db.article.count(),
      db.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      db.payment.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
        _sum: { amount: true },
      }),
      db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { firstName: true, lastName: true } } } }),
      db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, role: true, active: true } }),
      db.softwareVersion.findFirst({ where: { active: true }, orderBy: { releaseDate: "desc" } }),
      db.licenseKey.findMany({
        select: {
          id: true, key: true, platform: true, status: true, userId: true,
          activatedAt: true, expiresAt: true, lastCheckAt: true, validityMonths: true,
          user: { select: { firstName: true, lastName: true, email: true, establishment: true } },
          subscription: { select: { status: true, endDate: true, plan: { select: { name: true, slug: true, platform: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 20_000,
      }),
      db.activityLog.count({ where: { action: "LICENSE_PLATFORM_REFUSED", createdAt: { gte: since30 } } }),
    ]);

    // ── Licences : statut × plateforme ─────────────────────────
    const byStatus = Object.fromEntries(STATUS_KEYS.map((s) => [s, 0])) as Record<LicenseStatus, number>;
    const matrix = Object.fromEntries(PLATFORM_KEYS.map((p) => [p, Object.fromEntries(STATUS_KEYS.map((s) => [s, 0]))])) as Record<PlatformKey, Record<LicenseStatus, number>>;
    // Un client = un compte ayant au moins une licence en cours ; un code direct
    // sans compte compte pour un client (une installation).
    const clients: Record<PlatformKey, Set<string>> = { PC: new Set(), ANDROID: new Set(), UNKNOWN: new Set() };

    const enriched = licenses.map((license) => {
      const platform: PlatformKey = resolveLicensePlatform(license) ?? "UNKNOWN";
      const status = getLicenseStatus({
        status: license.status,
        expiresAt: license.expiresAt,
        subscriptionEndDate: license.subscription?.endDate ?? null,
        subscriptionStatus: license.subscription?.status ?? null,
      }, now);
      const endDate = license.expiresAt ?? license.subscription?.endDate ?? null;
      byStatus[status]++;
      matrix[platform][status]++;
      if (status === "ACTIVE") clients[platform].add(license.userId ?? `code:${license.id}`);
      return { ...license, platformKey: platform, computedStatus: status, endDate };
    });

    const allActiveClients = new Set([...clients.PC, ...clients.ANDROID, ...clients.UNKNOWN]);
    const bothPlatforms = [...clients.PC].filter((id) => clients.ANDROID.has(id)).length;

    // ── Activations des 6 derniers mois par plateforme ─────────
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
      return { key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`, PC: 0, ANDROID: 0, UNKNOWN: 0 };
    });
    const monthIndex = new Map(months.map((m, i) => [m.key, i]));
    let activations30 = 0;
    for (const license of enriched) {
      if (!license.activatedAt) continue;
      if (license.activatedAt >= since30) activations30++;
      const key = `${license.activatedAt.getUTCFullYear()}-${String(license.activatedAt.getUTCMonth() + 1).padStart(2, "0")}`;
      const index = monthIndex.get(key);
      if (index !== undefined) months[index][license.platformKey]++;
    }

    const summary = (l: (typeof enriched)[number]) => ({
      id: l.id,
      key: l.key,
      platform: l.platformKey === "UNKNOWN" ? null : l.platformKey,
      status: l.computedStatus,
      activatedAt: l.activatedAt,
      endDate: l.endDate,
      plan: l.subscription?.plan.name ?? (l.validityMonths ? `Code ${l.validityMonths} mois` : null),
      client: l.user ? { name: `${l.user.firstName} ${l.user.lastName}`, email: l.user.email, establishment: l.user.establishment } : null,
    });

    const recentActivations = enriched
      .filter((l) => l.activatedAt)
      .sort((a, b) => b.activatedAt!.getTime() - a.activatedAt!.getTime())
      .slice(0, 8)
      .map(summary);
    const expiringSoon = enriched
      .filter((l) => l.computedStatus === "ACTIVE" && l.endDate && l.endDate.getTime() - now.getTime() <= 30 * DAY)
      .sort((a, b) => a.endDate!.getTime() - b.endDate!.getTime())
      .slice(0, 8)
      .map(summary);

    return ok({
      users: { total: totalUsers, active: activeUsers, new30: newUsers30 },
      subscriptions: { total: totalSubs, active: activeSubs },
      payments: { completed: completedPayments, pending: pendingPayments },
      tickets: { open: openTickets },
      articles: { total: articles },
      revenue: {
        total: totalRevenueAgg._sum.amount ?? 0,
        thisMonth: monthRevenueAgg._sum.amount ?? 0,
      },
      version: version ? { version: version.version, releaseDate: version.releaseDate, downloads: version.downloads } : null,
      licenses: {
        total: licenses.length,
        byStatus,
        byPlatform: matrix,
        activations30,
        refusedPlatform30,
        activationsByMonth: months,
        recentActivations,
        expiringSoon,
      },
      clients: {
        active: allActiveClients.size,
        PC: clients.PC.size,
        ANDROID: clients.ANDROID.size,
        UNKNOWN: clients.UNKNOWN.size,
        both: bothPlatforms,
      },
      recentLogs,
      recentUsers,
    });
  });
}
