import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { registerSchema } from "@/lib/validations";
import { normalizePhoneNumber } from "@/lib/phone";
import { hashPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const ip = getClientIp(req);
    const rl = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return fail(
        `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfterSec / 60)} minutes.`,
        429
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const phoneIssue = parsed.error.issues.find((issue) => issue.path[0] === "phone");
      return fail(phoneIssue?.message ?? parsed.error.issues[0]?.message ?? "Données invalides", 422);
    }
    const data = parsed.data;
    const phone = normalizePhoneNumber(data.phone, data.country);
    if (!phone) return fail("Veuillez saisir un numéro de téléphone valide.", 422);

    const ambassador = data.ambassadorCode
      ? await db.ambassador.findFirst({ where: { code: data.ambassadorCode.toUpperCase(), active: true } })
      : null;
    if (data.ambassadorCode && !ambassador) return fail("Code ambassadeur invalide ou inactif.", 422);

    const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return fail("Un compte existe déjà avec cette adresse e-mail.", 409);
    }

    const hashed = await hashPassword(data.password);
    const user = await db.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone,
        password: hashed,
        establishment: data.establishment || null,
        country: data.country,
        emailVerified: true, // Vérification par e-mail à activer lors de l'intégration du service SMTP
      },
    });

    if (ambassador) {
      await db.referral.create({
        data: {
          ambassadorId: ambassador.id,
          clientUserId: user.id,
          codeSubmitted: ambassador.code,
          commissionAmount: ambassador.commissionAmount,
        },
      });
    }

    // Session automatique après inscription
    const token = await createSessionToken({ userId: user.id, email: user.email, role: user.role });
    await logAction("REGISTER", user.id, `Nouveau compte : ${user.email}`, ip);

    const res = ok(
      {
        user: {
          id: user.id, firstName: user.firstName, lastName: user.lastName,
          email: user.email, role: user.role,
        },
      },
      201
    );
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  });
}
