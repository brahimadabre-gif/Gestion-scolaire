import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = process.env.PHONE_TEST_BASE_URL;
const adminEmail = process.env.PHONE_TEST_ADMIN_EMAIL;
const adminPassword = process.env.PHONE_TEST_ADMIN_PASSWORD;
const legacyEmail = process.env.PHONE_TEST_LEGACY_EMAIL;
const legacyPassword = process.env.PHONE_TEST_LEGACY_PASSWORD;

test("l'API impose le téléphone, enregistre les formats valides et préserve l'accès existant", {
  skip: !baseUrl || !adminEmail || !adminPassword || !legacyEmail || !legacyPassword,
}, async () => {
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  assert.equal(login.status, 200, "le compte administrateur existant doit encore se connecter");
  const sessionCookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(sessionCookie, "la connexion admin doit fournir un cookie de session");

  const register = async (email, phone, country = "Côte d'Ivoire", includePhone = true) => {
    const body = {
      firstName: "Test",
      lastName: "Téléphone",
      email,
      password: "SecurePass2026",
      confirmPassword: "SecurePass2026",
      country,
    };
    if (includePhone) body.phone = phone;
    return fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify(body),
    });
  };
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const emailFor = (suffix) => `phone-check-${runId}-${suffix}@example.test`;

  const missing = await register(emailFor("missing"), undefined, undefined, false);
  assert.equal(missing.status, 422);
  assert.equal((await missing.json()).error, "Le numéro de téléphone est obligatoire.");

  const blank = await register(emailFor("blank"), "   ");
  assert.equal(blank.status, 422);
  assert.equal((await blank.json()).error, "Le numéro de téléphone est obligatoire.");

  const invalid = await register(emailFor("invalid"), "+225 12 34");
  assert.equal(invalid.status, 422);
  assert.equal((await invalid.json()).error, "Veuillez saisir un numéro de téléphone valide.");

  const ciEmail = emailFor("ci");
  const ci = await register(ciEmail, "+225 (07) 00.00-00 00");
  assert.equal(ci.status, 201);

  const internationalEmail = emailFor("fr");
  const international = await register(internationalEmail, "+33 6 12 34 56 78", "France");
  assert.equal(international.status, 201);

  const adminUsers = await fetch(`${baseUrl}/api/admin/users?q=${encodeURIComponent(`phone-check-${runId}`)}`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(adminUsers.status, 200);
  const registeredUsers = (await adminUsers.json()).data.users;
  const ciUser = registeredUsers.find((user) => user.email === ciEmail);
  assert.equal(ciUser?.phone, "+2250700000000", "l'admin doit consulter le numéro normalisé enregistré");
  const internationalUser = registeredUsers.find((user) => user.email === internationalEmail);
  assert.equal(internationalUser?.phone, "+33612345678", "le numéro international doit être normalisé et visible en admin");

  const legacyLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ email: legacyEmail, password: legacyPassword }),
  });
  assert.equal(legacyLogin.status, 200, "un compte existant sans téléphone doit toujours se connecter");
});
