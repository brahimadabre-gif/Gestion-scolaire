import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { db } from "./db";

// ── Un seul compte par adresse e-mail et par numéro de téléphone ──

/** Un autre compte utilise-t-il déjà cette adresse ? (majuscules/minuscules ignorées) */
export async function emailDejaUtilise(email: string, saufUserId?: string): Promise<boolean> {
  const autre = await db.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" }, ...(saufUserId ? { id: { not: saufUserId } } : {}) },
    select: { id: true },
  });
  return !!autre;
}

/**
 * Un autre compte utilise-t-il déjà ce numéro ? `numero` est au format international
 * (+225…). Les anciens comptes ont pu l'enregistrer autrement (« +225 07 … »,
 * « 07 07 … ») : on compare donc les chiffres seuls, avec ou sans indicatif.
 */
export async function numeroDejaUtilise(numero: string, saufUserId?: string): Promise<boolean> {
  const complet = numero.replace(/\D/g, "");
  if (!complet) return false;
  const national = parsePhoneNumberFromString(numero)?.nationalNumber?.replace(/\D/g, "") ?? complet;
  const formes = [...new Set([complet, national, "0" + national])];
  const lignes = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "User"
    WHERE regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') IN (${formes[0]}, ${formes[1] ?? formes[0]}, ${formes[2] ?? formes[0]})
    LIMIT 3`;
  return lignes.some((l) => l.id !== saufUserId);
}

export const MESSAGE_EMAIL_PRIS = "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou utilisez « Mot de passe oublié ».";
export const MESSAGE_NUMERO_PRIS = "Ce numéro de téléphone est déjà utilisé par un autre compte. Connectez-vous ou utilisez un autre numéro.";
