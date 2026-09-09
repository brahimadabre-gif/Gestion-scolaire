import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, clearRateLimit, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { loginSchema } from "@/lib/validations";
import {
  verifyPassword, createSessionToken, SESSION_COOKIE, sessionCookieOptions,
} from "@/lib/auth";

export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const body = await req.json();
    const data = loginSchema.parse(body);
    const ip = getClientIp(req);

    // Limitation des tentatives : 8 essais / 15 min par e-mail + IP
    const rlKey = `login:${data.email.toLowerCase()}:${ip}`;
    const rl = rateLimit(rlKey, 8, 15 * 60 * 1000);
    if (!rl.allowed) {
      await logAction("LOGIN_BLOCKED", null, `Trop de tentatives : ${data.email}`, ip);
      return fail(
        `Trop de tentatives de connexion. Réessayez dans ${Math.ceil(rl.retryAfterSec / 60)} minutes.`,
        429
      );
    }

    const user = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });

    // Message volontairement identique (email ou mot de passe incorrect) pour éviter l'énumération de comptes
    if (!user || !(await verifyPassword(data.password, user.password))) {
      return fail("E-mail ou mot de passe incorrect.", 401);
    }
    if (!user.active) {
      return fail("Ce compte a été désactivé. Contactez le support.", 403);
    }

    clearRateLimit(rlKey);
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await logAction("LOGIN", user.id, `Connexion réussie`, ip);

    const token = await createSessionToken({ userId: user.id, email: user.email, role: user.role });
    const res = ok({
      user: {
        id: user.id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, role: user.role,
      },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  });
}
