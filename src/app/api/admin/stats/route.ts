import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/stats — Statistiques du tableau de bord administration
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);

    const [
      totalUsers,
      activeUsers,
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
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { active: true } }),
      db.subscription.count(),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.payment.count({ where: { status: "COMPLETED" } }),
      db.payment.count({ where: { status: "PENDING" } }),
      db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      db.article.count(),
      db.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      db.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
      db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: { select: { firstName: true, lastName: true } } } }),
      db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, role: true, active: true } }),
      db.softwareVersion.findFirst({ where: { active: true }, orderBy: { releaseDate: "desc" } }),
    ]);

    return ok({
      users: { total: totalUsers, active: activeUsers },
      subscriptions: { total: totalSubs, active: activeSubs },
      payments: { completed: completedPayments, pending: pendingPayments },
      tickets: { open: openTickets },
      articles: { total: articles },
      revenue: {
        total: totalRevenueAgg._sum.amount ?? 0,
        thisMonth: monthRevenueAgg._sum.amount ?? 0,
      },
      version: version ? { version: version.version, releaseDate: version.releaseDate, downloads: version.downloads } : null,
      recentLogs,
      recentUsers,
    });
  });
}
