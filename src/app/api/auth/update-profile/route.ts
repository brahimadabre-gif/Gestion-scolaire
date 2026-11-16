import { db } from "@/lib/db";
import { ok, fail, handle, logAction, getClientIp, assertSameOrigin } from "@/lib/api-helpers";
import { profileSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/phone";
import { numeroDejaUtilise, MESSAGE_NUMERO_PRIS } from "@/lib/unicite";

export async function PATCH(req: Request) {
  return handle(async () => {
    assertSameOrigin(req);
    const sessionUser = await requireUser(req);
    const data = profileSchema.parse(await req.json());

    // Numéro au format international, et jamais celui d'un autre compte
    let phone: string | null = null;
    if (data.phone) {
      phone = normalizePhoneNumber(data.phone, data.country);
      if (!phone) return fail("Veuillez saisir un numéro de téléphone valide.", 422);
      // Contrôle seulement si le numéro change (un ancien doublon ne bloque pas l'enregistrement du profil)
      const actuel = await db.user.findUnique({ where: { id: sessionUser.id }, select: { phone: true } });
      const chiffres = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");
      const change = !chiffres(actuel?.phone) || !chiffres(phone).endsWith(chiffres(actuel?.phone).replace(/^0+/, ""));
      if (change && (await numeroDejaUtilise(phone, sessionUser.id))) return fail(MESSAGE_NUMERO_PRIS, 409);
    }

    const user = await db.user.update({
      where: { id: sessionUser.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone,
        establishment: data.establishment || null,
        country: data.country,
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        establishment: true, country: true, role: true, createdAt: true,
      },
    });
    await logAction("PROFILE_UPDATE", user.id, "Profil mis à jour", getClientIp(req));
    return ok({ user });
  });
}
