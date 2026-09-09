import { db } from "@/lib/db";
import { ok, fail, handle, rateLimit, getClientIp, logAction, assertSameOrigin } from "@/lib/api-helpers";
import { resetPasswordSchema } from "@/lib/validations";
import { hashToken, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const ip = getClientIp(req);
    const rl = rateLimit(`reset:${ip}`, 8, 15 * 60 * 1000);
    if (!rl.allowed) return fail("Trop de tentatives. Réessayez plus tard.", 429);

    const data = resetPasswordSchema.parse(await req.json());
    const hashedToken = hashToken(data.token);

    const record = await db.passwordResetToken.findUnique({ where: { token: hashedToken } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return fail("Lien de réinitialisation invalide ou expiré. Faites une nouvelle demande.", 400);
    }

    await db.user.update({
      where: { id: record.userId },
      data: { password: await hashPassword(data.password) },
    });
    await db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    await logAction("PASSWORD_RESET", record.userId, "Mot de passe réinitialisé", ip);
    return ok({ message: "Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter." });
  });
}
