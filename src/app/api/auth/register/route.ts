import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { registerSchema } from "@/lib/validations";
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
    const data = registerSchema.parse(body);

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
        phone: data.phone || null,
        password: hashed,
        establishment: data.establishment || null,
        country: data.country,
        emailVerified: true, // Vérification par e-mail à activer lors de l'intégration du service SMTP
      },
    });

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
