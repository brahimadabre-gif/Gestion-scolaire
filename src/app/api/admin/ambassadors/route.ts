import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { assertSameOrigin, fail, handle, ok } from "@/lib/api-helpers";
import { normalizePhoneNumber } from "@/lib/phone";
import { emailDejaUtilise, numeroDejaUtilise, MESSAGE_EMAIL_PRIS, MESSAGE_NUMERO_PRIS } from "@/lib/unicite";

const createSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(8),
  commissionAmount: z.coerce.number().min(0).max(1_000_000).default(1500),
});

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const ambassadors = await db.ambassador.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true, active: true } }, referrals: true, bonuses: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(ambassadors.map((a) => ({ ...a, totalConfirmed: a.referrals.filter((r) => r.status === "CONFIRMED").length, totalCommissions: a.referrals.filter((r) => r.commissionStatus === "VALIDATED" || r.commissionStatus === "PAID").reduce((n, r) => n + r.commissionAmount, 0), totalBonuses: a.bonuses.reduce((n, b) => n + b.amount, 0) })));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    await requireAdmin(req);
    const data = createSchema.parse(await req.json());
    const email = data.email.toLowerCase();
    if (await emailDejaUtilise(email)) return fail(MESSAGE_EMAIL_PRIS, 409);
    // Même règle que l'inscription : numéro valide et pas déjà utilisé par un autre compte
    const phone = data.phone ? normalizePhoneNumber(data.phone) : null;
    if (data.phone && !phone) return fail("Veuillez saisir un numéro de téléphone valide.", 422);
    if (phone && (await numeroDejaUtilise(phone))) return fail(MESSAGE_NUMERO_PRIS, 409);
    const code = `AMB-${data.firstName.slice(0, 4)}${data.lastName.slice(0, 4)}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`.replace(/[^A-Z0-9-]/gi, "").toUpperCase();
    const user = await db.user.create({ data: { firstName: data.firstName, lastName: data.lastName, email, phone, password: await hashPassword(data.password), role: "AMBASSADOR", emailVerified: true } });
    const ambassador = await db.ambassador.create({ data: { userId: user.id, code, commissionAmount: data.commissionAmount } });
    return ok({ id: ambassador.id, code, user: { firstName: user.firstName, lastName: user.lastName, email: user.email }, commissionAmount: ambassador.commissionAmount }, 201);
  });
}
