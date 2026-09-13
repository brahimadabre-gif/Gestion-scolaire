import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, fail, handle, ok } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

const patchSchema = z.object({ commissionAmount: z.coerce.number().min(0).max(1_000_000).optional(), active: z.boolean().optional(), bonusAmount: z.coerce.number().min(0).max(1_000_000).optional(), bonusReason: z.string().trim().max(300).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    assertSameOrigin(req);
    await requireAdmin(req);
    const { id } = await params;
    const data = patchSchema.parse(await req.json());
    const ambassador = await db.ambassador.findUnique({ where: { id } });
    if (!ambassador) return fail("Ambassadeur introuvable.", 404);
    if (data.bonusAmount && data.bonusAmount > 0) await db.ambassadorBonus.create({ data: { ambassadorId: id, amount: data.bonusAmount, reason: data.bonusReason || "Bonus administrateur" } });
    const updated = await db.ambassador.update({ where: { id }, data: { commissionAmount: data.commissionAmount, active: data.active } });
    return ok(updated);
  });
}
