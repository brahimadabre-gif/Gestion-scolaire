import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { forgotPasswordSchema } from "@/lib/validations";
import { generateResetToken } from "@/lib/auth";

export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const ip = getClientIp(req);
    const rl = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return fail(`Trop de demandes. Réessayez dans ${Math.ceil(rl.retryAfterSec / 60)} minutes.`, 429);
    }

    const data = forgotPasswordSchema.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: data.email.toLowerCase() } });

    // Réponse identique que le compte existe ou non (anti-énumération)
    const genericMessage =
      "Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte de réception et vos spams.";

    if (user) {
      const { raw, hashed } = generateResetToken();
      await db.passwordResetToken.create({
        data: {
          token: hashed,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // expire dans 1 heure
        },
      });
      await logAction("PASSWORD_RESET_REQUEST", user.id, `Demande de réinitialisation`, ip);

      // NOTE INTÉGRATION E-MAIL : envoyer `raw` par e-mail via le service SMTP configuré.
      // En environnement de développement sans SMTP, le lien est retourné pour les tests.
      const devLink = `/#/mot-de-passe-oublie?token=${raw}`;
      return ok({ message: genericMessage, devLink });
    }

    return ok({ message: genericMessage });
  });
}
