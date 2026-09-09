import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api-helpers";

// GET /api/versions — Dernière version stable active du logiciel (public)
export async function GET() {
  return handle(async () => {
    const version = await db.softwareVersion.findFirst({
      where: { active: true, channel: "stable" },
      orderBy: { releaseDate: "desc" },
    });
    return ok(version);
  });
}
