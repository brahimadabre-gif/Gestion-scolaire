import { z } from "zod";

// ── Messages aux logiciels : règles communes (admin + logiciels + licences) ──

export const MESSAGE_KINDS = ["INFO", "NEW", "IMPORTANT", "OFFER", "PAYMENT"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];
// ALL / PC / ANDROID : logiciels Gestion Scolaire Pro ; CANTINE / CANTINE_PC / CANTINE_ANDROID : logiciels Cantine Pro ;
// SELECTION : comptes ou clés choisis (les clés portent déjà leur logiciel).
export const MESSAGE_AUDIENCES = ["ALL", "PC", "ANDROID", "CANTINE", "CANTINE_PC", "CANTINE_ANDROID", "SELECTION"] as const;
export type MessageAudience = (typeof MESSAGE_AUDIENCES)[number];

export const MESSAGE_KIND_LABELS: Record<MessageKind, string> = {
  INFO: "Information",
  NEW: "Nouveauté",
  IMPORTANT: "Important",
  OFFER: "Offre",
  PAYMENT: "Rappel de paiement",
};

/** Clé de licence telle qu'elle est enregistrée (majuscules, sans espaces). */
export const normaliserCle = (cle: string) => cle.trim().toUpperCase().replace(/\s+/g, "");

const urlSure = z.string().trim().max(300).refine((u) => /^https:\/\//i.test(u), "Le lien doit commencer par https://");

// Données envoyées par l'administration (création ou modification d'un brouillon).
export const messageInputSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court.").max(120),
  body: z.string().trim().min(3, "Message trop court.").max(2000),
  kind: z.enum(MESSAGE_KINDS),
  buttonLabel: z.string().trim().max(40).optional().nullable(),
  buttonUrl: urlSure.optional().nullable().or(z.literal("")),
  audience: z.enum(MESSAGE_AUDIENCES),
  targetUserIds: z.array(z.string().min(1).max(40)).max(2000).default([]),
  targetKeys: z.array(z.string().min(4).max(60)).max(2000).default([]),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  deadlineAt: z.coerce.date().optional().nullable(),
  suspendAtDeadline: z.boolean().default(false),
}).superRefine((m, ctx) => {
  if (m.audience === "SELECTION" && m.targetUserIds.length + m.targetKeys.length === 0) {
    ctx.addIssue({ code: "custom", path: ["audience"], message: "Choisissez au moins un destinataire." });
  }
  if (m.suspendAtDeadline && !m.deadlineAt) {
    ctx.addIssue({ code: "custom", path: ["deadlineAt"], message: "La suspension demande une échéance." });
  }
  // Garde-fou : on ne suspend jamais tous les logiciels d'un coup.
  if (m.suspendAtDeadline && m.audience !== "SELECTION") {
    ctx.addIssue({ code: "custom", path: ["suspendAtDeadline"], message: "La suspension n'est possible que pour des destinataires choisis." });
  }
  if (m.buttonUrl && !m.buttonLabel) {
    ctx.addIssue({ code: "custom", path: ["buttonLabel"], message: "Donnez un texte au bouton." });
  }
  if (m.startsAt && m.endsAt && m.endsAt <= m.startsAt) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Le retrait doit être après la publication." });
  }
});
export type MessageInput = z.infer<typeof messageInputSchema>;

export function nettoyerMessage(m: MessageInput) {
  return {
    title: m.title,
    body: m.body,
    kind: m.kind,
    buttonLabel: m.buttonUrl ? m.buttonLabel || null : null,
    buttonUrl: m.buttonUrl || null,
    audience: m.audience,
    targetUserIds: m.audience === "SELECTION" ? [...new Set(m.targetUserIds)] : [],
    targetKeys: m.audience === "SELECTION" ? [...new Set(m.targetKeys.map(normaliserCle))] : [],
    startsAt: m.startsAt ?? null,
    endsAt: m.endsAt ?? null,
    deadlineAt: m.deadlineAt ?? null,
    suspendAtDeadline: Boolean(m.deadlineAt) && m.suspendAtDeadline,
  };
}

interface MessageCible {
  status: string;
  audience: string;
  targetUserIds: string[];
  targetKeys: string[];
  startsAt: Date | null;
  endsAt: Date | null;
}

/** Le message est-il en ligne à cet instant ? */
export function estEnLigne(m: Pick<MessageCible, "status" | "startsAt" | "endsAt">, now: Date): boolean {
  if (m.status !== "PUBLISHED") return false;
  if (m.startsAt && m.startsAt > now) return false;
  if (m.endsAt && m.endsAt <= now) return false;
  return true;
}

/** Ce logiciel (plateforme, clé, compte) doit-il recevoir ce message ? */
export function viseLogiciel(
  m: MessageCible,
  logiciel: { platform: "PC" | "ANDROID" | null; licenseKey: string | null; userId: string | null; product?: "GSPP" | "CANTINE" },
  now: Date,
): boolean {
  if (!estEnLigne(m, now)) return false;
  const cantine = logiciel.product === "CANTINE";
  if (m.audience === "ALL") return !cantine;
  if (m.audience === "PC" || m.audience === "ANDROID") return !cantine && logiciel.platform === m.audience;
  if (m.audience === "CANTINE") return cantine;
  if (m.audience === "CANTINE_PC") return cantine && logiciel.platform === "PC";
  if (m.audience === "CANTINE_ANDROID") return cantine && logiciel.platform === "ANDROID";
  if (m.audience !== "SELECTION") return false;
  if (logiciel.licenseKey && m.targetKeys.includes(normaliserCle(logiciel.licenseKey))) return true;
  return Boolean(logiciel.userId && m.targetUserIds.includes(logiciel.userId));
}

/** La licence est-elle suspendue par un rappel dont l'échéance est passée ? */
export function suspenduParMessage(
  m: MessageCible & { deadlineAt: Date | null; suspendAtDeadline: boolean },
  licence: { key: string; userId: string | null },
  now: Date,
): boolean {
  if (!m.suspendAtDeadline || !m.deadlineAt || m.deadlineAt > now) return false;
  if (m.audience !== "SELECTION" || m.status !== "PUBLISHED") return false;
  // L'échéance compte même si la date de retrait automatique est passée :
  // seul le retrait manuel (« Paiement reçu ») lève la suspension.
  if (m.startsAt && m.startsAt > now) return false;
  return m.targetKeys.includes(normaliserCle(licence.key)) || Boolean(licence.userId && m.targetUserIds.includes(licence.userId));
}
