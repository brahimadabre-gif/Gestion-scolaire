import { z } from "zod";

// ── Schémas de validation Zod (validation côté serveur) ──────

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères").max(60),
    lastName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(60),
    email: z.string().trim().email("Adresse e-mail invalide").max(120),
    phone: z
      .string()
      .trim()
      .regex(/^[+0-9 ().-]{8,20}$/, "Numéro de téléphone invalide")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
    confirmPassword: z.string(),
    establishment: z.string().trim().max(120).optional().or(z.literal("")),
    country: z.string().trim().min(2).max(80).default("Côte d'Ivoire"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().min(3, "E-mail ou identifiant requis").max(120),
  password: z.string().min(1, "Mot de passe requis"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Token invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  establishment: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(80),
});

export const createSubscriptionSchema = z.object({
  planSlug: z.string().trim().min(1),
  billingCycle: z.enum(["monthly", "annual"]),
  method: z.enum(["wave", "orange_money"]).default("wave"),
  phoneMsisdn: z.string().trim().max(20).optional().or(z.literal("")),
});

export const ticketSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(80),
  email: z.string().trim().email("Adresse e-mail invalide"),
  subject: z.string().trim().min(4, "Sujet requis").max(150),
  category: z.enum(["general", "technique", "facturation", "installation", "abonnement"]),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(4000),
  attachment: z.string().trim().max(255).optional().or(z.literal("")),
});

export const licenseActivateSchema = z.object({
  licenseKey: z.string().trim().min(8).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "Code de licence invalide"),
  // Toute licence délivrée par le serveur doit être liée à un appareil réel.
  deviceFingerprint: z.string().trim().min(4).max(120),
});

export const adminPlanSchema = z.object({
  slug: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300),
  monthlyPrice: z.number().min(0),
  annualPrice: z.number().min(0),
  maxUsers: z.number().int().min(1),
  maxSchools: z.number().int().min(1),
  maxStudents: z.number().int().min(1),
  features: z.array(z.string()),
  highlighted: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int().default(0),
});

export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Très faible", "Faible", "Moyen", "Bon", "Fort", "Très fort"];
  return { score, label: labels[score] };
}
