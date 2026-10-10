import assert from "node:assert/strict";
import test from "node:test";
import { phoneValidationMessage, normalizePhoneNumber } from "../src/lib/phone.ts";

test("signale les téléphones vides ou composés d'espaces", () => {
  assert.equal(phoneValidationMessage(""), "Le numéro de téléphone est obligatoire.");
  assert.equal(phoneValidationMessage("   "), "Le numéro de téléphone est obligatoire.");
});

test("valide et normalise les numéros ivoiriens, y compris en format national", () => {
  assert.equal(normalizePhoneNumber("+225 (07) 00.00-00 00", "Côte d'Ivoire"), "+2250700000000");
  assert.equal(normalizePhoneNumber("07 00 00 00 00", "Côte d'Ivoire"), "+2250700000000");
});

test("accepte les numéros internationaux valides et rejette les numéros invalides", () => {
  assert.equal(normalizePhoneNumber("+33 6 12 34 56 78", "France"), "+33612345678");
  assert.equal(normalizePhoneNumber("+1 (202) 555-0123", "Autre pays"), "+12025550123");
  assert.equal(normalizePhoneNumber("+225 12 34", "Côte d'Ivoire"), null);
  assert.equal(normalizePhoneNumber("+225 07 ABC 00 00 00", "Côte d'Ivoire"), null);
  assert.equal(
    phoneValidationMessage("+225 12 34", "Côte d'Ivoire"),
    "Veuillez saisir un numéro de téléphone valide.",
  );
});
