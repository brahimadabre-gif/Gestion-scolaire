// ─────────────────────────────────────────────────────────────
// Plateformes des licences : une clé PC n'active jamais un appareil
// Android, et inversement. Module sans dépendance (testable avec node:test).
// ─────────────────────────────────────────────────────────────

export const LICENSE_PLATFORMS = ["PC", "ANDROID"] as const;
export type LicensePlatform = (typeof LICENSE_PLATFORMS)[number];

/** Préfixe distinct par plateforme. Les anciennes clés commencent par GSPP-. */
export const PLATFORM_KEY_PREFIX: Record<LicensePlatform, string> = {
  PC: "GSPC",
  ANDROID: "GSAN",
};
export const LEGACY_KEY_PREFIX = "GSPP";

export const PLATFORM_LABELS: Record<LicensePlatform, string> = {
  PC: "PC Windows",
  ANDROID: "Android",
};

export function isLicensePlatform(value: unknown): value is LicensePlatform {
  return value === "PC" || value === "ANDROID";
}

/**
 * Plateforme déclarée par l'appareil. L'application envoie l'en-tête
 * `x-gspp-client: desktop | android`; un serveur de confiance peut aussi
 * transmettre `platform` dans le corps de la requête.
 */
export function normalizeDevicePlatform(value: unknown): LicensePlatform | null {
  if (typeof value !== "string") return null;
  switch (value.trim().toLowerCase()) {
    case "desktop":
    case "pc":
    case "windows":
      return "PC";
    case "android":
    case "mobile":
      return "ANDROID";
    default:
      return null;
  }
}

/**
 * Plateforme réelle de l'appareil qui appelle le serveur de licences.
 * L'application Android (Capacitor) partage le code web du PC et envoie elle
 * aussi `x-gspp-client: desktop` : le User-Agent de sa WebView (« Android »)
 * fait donc foi en premier. Ensuite l'en-tête, puis `platform` dans le corps.
 * Un appel authentifié par la clé API sans autre indice vient du logiciel PC
 * (commandes natives Tauri) : il est traité comme PC.
 */
export function detectDevicePlatform(input: {
  userAgent?: string | null;
  clientHeader?: string | null;
  bodyPlatform?: unknown;
  trustedServer?: boolean;
}): LicensePlatform | null {
  if (input.userAgent && /android/i.test(input.userAgent)) return "ANDROID";
  return normalizeDevicePlatform(input.clientHeader)
    ?? normalizeDevicePlatform(input.bodyPlatform)
    ?? (input.trustedServer ? "PC" : null);
}

/** Plateforme encodée dans le préfixe de la clé (null pour les anciennes clés GSPP-). */
export function platformFromKey(key: string): LicensePlatform | null {
  const prefix = key.trim().toUpperCase().split("-")[0];
  if (prefix === PLATFORM_KEY_PREFIX.PC) return "PC";
  if (prefix === PLATFORM_KEY_PREFIX.ANDROID) return "ANDROID";
  return null;
}

/**
 * Plateforme d'une formule. La formule « mobile » est toujours l'offre Android,
 * y compris juste après l'ajout de la colonne (valeur par défaut PC).
 */
export function platformFromPlan(plan: { platform?: string | null; slug?: string | null } | null | undefined): LicensePlatform | null {
  if (!plan) return null;
  if (plan.slug === "mobile") return "ANDROID";
  if (isLicensePlatform(plan.platform)) return plan.platform;
  return null;
}

/**
 * Plateforme attendue pour une licence, par ordre de priorité :
 * champ `platform` en base → préfixe de la clé → plateforme de la formule.
 * null = ancienne licence pas encore rattachée (elle le sera au premier contact).
 */
export function resolveLicensePlatform(license: {
  key: string;
  platform?: string | null;
  subscription?: { plan?: { platform?: string | null; slug?: string | null } | null } | null;
}): LicensePlatform | null {
  if (isLicensePlatform(license.platform)) return license.platform;
  return platformFromKey(license.key) ?? platformFromPlan(license.subscription?.plan);
}

export type PlatformCheck =
  | { ok: true; platform: LicensePlatform; bind: boolean }
  | { ok: false; reason: "PLATFORM_MISMATCH"; expected: LicensePlatform; device: LicensePlatform; message: string };

/**
 * Vérifie que l'appareil correspond à la licence. `bind` indique qu'il faut
 * enregistrer la plateforme (ancienne licence sans plateforme connue).
 */
export function checkLicensePlatform(expected: LicensePlatform | null, device: LicensePlatform): PlatformCheck {
  if (!expected) return { ok: true, platform: device, bind: true };
  if (expected === device) return { ok: true, platform: device, bind: false };
  return {
    ok: false,
    reason: "PLATFORM_MISMATCH",
    expected,
    device,
    message: expected === "ANDROID"
      ? "Cette clé est réservée à l'application Android : elle ne peut pas activer un PC."
      : "Cette clé est réservée au logiciel PC Windows : elle ne peut pas activer un appareil Android.",
  };
}
