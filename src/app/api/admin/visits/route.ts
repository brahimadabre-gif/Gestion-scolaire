import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

const DAY = 86_400_000;
const PERIODS = [1, 7, 30, 90] as const;

type Count = { key: string; value: number };

// Visiteurs distincts par clé (une empreinte = un visiteur pour un jour donné)
function distinctBy<T extends { visitor: string }>(rows: T[], keyOf: (r: T) => string | null): Count[] {
  const sets = new Map<string, Set<string>>();
  for (const r of rows) {
    const k = keyOf(r);
    if (!k) continue;
    if (!sets.has(k)) sets.set(k, new Set());
    sets.get(k)!.add(r.visitor);
  }
  return [...sets].map(([key, s]) => ({ key, value: s.size })).sort((a, b) => b.value - a.value);
}

// GET /api/admin/visits?days=30 — statistiques du compteur de visites
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const asked = Number(new URL(req.url).searchParams.get("days"));
    const days = (PERIODS as readonly number[]).includes(asked) ? asked : 30;

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const start = new Date(today.getTime() - (days - 1) * DAY);
    const prevStart = new Date(start.getTime() - days * DAY);

    const [rows, prevRows, totalAgg, first] = await Promise.all([
      db.siteVisit.findMany({
        where: { createdAt: { gte: start } },
        select: { visitor: true, path: true, video: true, source: true, device: true, createdAt: true },
      }),
      db.siteVisit.findMany({ where: { createdAt: { gte: prevStart, lt: start } }, select: { visitor: true }, distinct: ["visitor"] }),
      db.$queryRaw<{ n: number | bigint }[]>`SELECT CAST(COUNT(DISTINCT "visitor") AS INTEGER) AS n FROM "SiteVisit"`,
      db.siteVisit.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);

    // Série jour par jour (visiteurs distincts)
    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(start.getTime() + i * DAY);
      return { day: d.toISOString().slice(0, 10), visitors: new Set<string>(), views: 0 };
    });
    for (const r of rows) {
      const i = Math.floor((r.createdAt.getTime() - start.getTime()) / DAY);
      if (series[i]) { series[i].visitors.add(r.visitor); series[i].views++; }
    }
    const visitors = new Set(rows.map((r) => r.visitor)).size;
    const todayVisitors = series[series.length - 1]?.visitors.size ?? 0;
    const previous = prevRows.length;

    return ok({
      days,
      visitors,
      previous,
      views: rows.filter((r) => !r.video).length,
      today: todayVisitors,
      total: Number(totalAgg[0]?.n ?? 0),
      since: first?.createdAt ?? null,
      series: series.map((s) => ({ day: s.day, visitors: s.visitors.size, views: s.views })),
      pages: distinctBy(rows, (r) => (r.video ? null : r.path)).slice(0, 8),
      videos: distinctBy(rows, (r) => r.video).slice(0, 8),
      sources: distinctBy(rows, (r) => r.source),
      devices: distinctBy(rows, (r) => r.device),
    });
  });
}
