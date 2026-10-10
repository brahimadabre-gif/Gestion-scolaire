import assert from "node:assert/strict";
import test from "node:test";
import { addCalendarMonths, getLicenseStatus } from "../src/lib/license-duration.ts";

test("les durées en mois suivent le calendrier et préservent les heures UTC", () => {
  assert.equal(addCalendarMonths(new Date("2026-01-31T14:25:30.000Z"), 1).toISOString(), "2026-02-28T14:25:30.000Z");
  assert.equal(addCalendarMonths(new Date("2026-01-31T14:25:30.000Z"), 3).toISOString(), "2026-04-30T14:25:30.000Z");
  assert.equal(addCalendarMonths(new Date("2024-02-29T00:00:00.000Z"), 12).toISOString(), "2025-02-28T00:00:00.000Z");
});

test("la durée personnalisée est bornée côté serveur", () => {
  assert.throws(() => addCalendarMonths(new Date("2026-01-01T00:00:00.000Z"), 0), RangeError);
  assert.throws(() => addCalendarMonths(new Date("2026-01-01T00:00:00.000Z"), 1.5), RangeError);
  assert.throws(() => addCalendarMonths(new Date("2026-01-01T00:00:00.000Z"), 601), RangeError);
});

test("le statut distingue disponible, activé, expiré et révoqué", () => {
  const now = new Date("2026-10-10T00:00:00.000Z");
  assert.equal(getLicenseStatus({ status: "INACTIVE", expiresAt: null, subscriptionEndDate: null }, now), "AVAILABLE");
  assert.equal(getLicenseStatus({ status: "ACTIVE", expiresAt: new Date("2026-10-11T00:00:00.000Z"), subscriptionEndDate: null }, now), "ACTIVE");
  assert.equal(getLicenseStatus({ status: "ACTIVE", expiresAt: new Date("2026-10-09T00:00:00.000Z"), subscriptionEndDate: null }, now), "EXPIRED");
  assert.equal(getLicenseStatus({ status: "ACTIVE", expiresAt: null, subscriptionEndDate: null, subscriptionStatus: "CANCELLED" }, now), "EXPIRED");
  assert.equal(getLicenseStatus({ status: "REVOKED", expiresAt: null, subscriptionEndDate: null }, now), "REVOKED");
});
