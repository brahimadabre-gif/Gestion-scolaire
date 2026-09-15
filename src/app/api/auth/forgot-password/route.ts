import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { forgotPasswordSchema } from "@/lib/validations";
import { generateResetToken } from "@/lib/auth";

const genericMessage =
  "Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte de réception et vos spams.";

async function sendResetEmail(email: string, rawToken: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.MAIL_FROM ?? "support@gestionscolaire.pro";
  const appUrl = process.env.APP_URL ?? "https://gestionscolaire.pro";

  if (!apiKey) throw new Error("BREVO_API_KEY non configurée");

  const resetUrl = `${appUrl}/#/mot-de-passe-oublie?token=${encodeURIComponent(rawToken)}`;
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: from, name: "Gestion Scolaire Pro Plus" },
      to: [{ email }],
      subject: "Réinitialisation de votre mot de passe",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#102322;max-width:600px;margin:auto">
          <h2>Réinitialisation du mot de passe</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe Gestion Scolaire Pro Plus.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#008b68;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Réinitialiser mon mot de passe</a></p>
          <p>Ce lien est valable pendant une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        </div>
      `,
      textContent: `Réinitialisez votre mot de passe ici : ${resetUrl}\n\nCe lien est valable pendant une heure.`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Échec de l'envoi Brevo (${response.status}): ${details}`);
  }
}

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

      try {
        await sendResetEmail(user.email, raw);
      } catch (error) {
        await db.passwordResetToken.deleteMany({ where: { token: hashed } });
        console.error("PASSWORD_RESET_EMAIL_FAILED", error);
        return fail("Le service d'e-mail est momentanément indisponible. Réessayez plus tard.", 503);
      }
    }

    return ok({ message: genericMessage });
  });
}
