/** Add calendar months without allowing dates such as January 31 to overflow. */
export function addCalendarMonths(start: Date, months: number): Date {
  if (!Number.isInteger(months) || months < 1 || months > 600) {
    throw new RangeError("La durée doit être comprise entre 1 et 600 mois.");
  }

  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + months;
  const day = start.getUTCDate();
  const targetMonthStart = new Date(Date.UTC(year, month, 1, start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth() + 1, 0)).getUTCDate();
  targetMonthStart.setUTCDate(Math.min(day, lastDay));
  return targetMonthStart;
}

export type LicenseStatus = "AVAILABLE" | "ACTIVE" | "EXPIRED" | "REVOKED";

export function getLicenseStatus(input: {
  status: string;
  expiresAt: Date | null;
  subscriptionEndDate: Date | null;
  subscriptionStatus?: string | null;
}, now = new Date()): LicenseStatus {
  if (input.status === "REVOKED") return "REVOKED";
  if (input.status === "INACTIVE") return "AVAILABLE";
  if (input.status !== "ACTIVE") return "AVAILABLE";
  if (input.subscriptionStatus && input.subscriptionStatus !== "ACTIVE") return "EXPIRED";
  if ((input.expiresAt && input.expiresAt <= now) || (input.subscriptionEndDate && input.subscriptionEndDate <= now)) {
    return "EXPIRED";
  }
  return "ACTIVE";
}
