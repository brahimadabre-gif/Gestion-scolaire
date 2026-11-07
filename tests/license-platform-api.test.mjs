// Test d'intégration : refus d'activation entre plateformes, contre un serveur réel.
// Prérequis : `next dev` lancé sur une base de test contenant les données de
// tests/fixtures/legacy-licenses.sql (anciennes clés GSPP-) migrées par
// prisma/backfill-license-platform.ts, et un compte administrateur de test.
//
//   BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//   node --test tests/license-platform-api.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
let ipCounter = 0;
// Chaque appel simule une IP distincte pour ne pas déclencher la limite anti-abus.
const ip = () => `10.99.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

// En-têtes réellement envoyés par les applications (APK 2.3.26 inspecté) :
// l'APK Android (Capacitor) envoie lui aussi « desktop », depuis une WebView Android.
const ANDROID_WEBVIEW_UA = "Mozilla/5.0 (Linux; Android 13; SM-A145F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.107 Mobile Safari/537.36";
const WINDOWS_WEBVIEW_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0";

async function call(path, { client, body, cookie, method = "POST", apiKey } = {}) {
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip() };
  if (client === "android") { headers["x-gspp-client"] = "desktop"; headers["user-agent"] = ANDROID_WEBVIEW_UA; }
  else if (client === "desktop") { headers["x-gspp-client"] = "desktop"; headers["user-agent"] = WINDOWS_WEBVIEW_UA; }
  else if (client) headers["x-gspp-client"] = client;
  if (apiKey) headers["x-api-key"] = apiKey;
  if (cookie) { headers.cookie = cookie; headers.origin = BASE; }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, res };
}
const activate = (client, licenseKey, deviceFingerprint) =>
  call("/api/license/activate", { client, body: { licenseKey, deviceFingerprint } });
const status = (client, licenseKey) => call("/api/license/status", { client, body: { licenseKey } });

async function adminCookie() {
  assert.ok(ADMIN_EMAIL && ADMIN_PASSWORD, "ADMIN_EMAIL et ADMIN_PASSWORD sont requis");
  const { status: code, res } = await call("/api/auth/login", { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  assert.equal(code, 200, "connexion administrateur");
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

test("les nouvelles clés ont un préfixe par plateforme et refusent l'autre plateforme", async () => {
  const cookie = await adminCookie();
  const android = await call("/api/admin/licenses", { cookie, body: { count: 1, durationMonths: 12, platform: "ANDROID" } });
  const pc = await call("/api/admin/licenses", { cookie, body: { count: 1, durationMonths: 3, platform: "PC" } });
  assert.equal(android.status, 201);
  assert.equal(pc.status, 201);
  const androidKey = android.json.data.codes[0];
  const pcKey = pc.json.data.codes[0];
  assert.match(androidKey, /^GSAN-/);
  assert.match(pcKey, /^GSPC-/);

  // Une clé Android n'active jamais un PC…
  const androidOnPc = await activate("desktop", androidKey, "pc-test-1");
  assert.equal(androidOnPc.status, 403);
  assert.match(androidOnPc.json.error, /Android/);
  // …et une clé PC n'active jamais un appareil Android.
  const pcOnAndroid = await activate("android", pcKey, "android-test-1");
  assert.equal(pcOnAndroid.status, 403);
  assert.match(pcOnAndroid.json.error, /PC/);

  // Sur la bonne plateforme, l'activation réussit et le refus n'a rien consommé.
  const okAndroid = await activate("android", androidKey, "android-test-1");
  assert.equal(okAndroid.status, 200);
  assert.equal(okAndroid.json.data.license.platform, "ANDROID");
  const okPc = await activate("desktop", pcKey, "pc-test-1");
  assert.equal(okPc.status, 200);
  assert.equal(okPc.json.data.license.platform, "PC");

  // Le contrôle de statut applique la même règle.
  assert.equal((await status("desktop", androidKey)).json.data.reason, "PLATFORM_MISMATCH");
  assert.equal((await status("android", androidKey)).json.data.valid, true);

  // Création refusée sans plateforme.
  const noPlatform = await call("/api/admin/licenses", { cookie, body: { count: 1, durationMonths: 12 } });
  assert.equal(noPlatform.status, 422);
});

for (const { platform, client, other, prefix, months } of [
  { platform: "PC", client: "desktop", other: "android", prefix: /^GSPC-/, months: 3 },
  { platform: "ANDROID", client: "android", other: "desktop", prefix: /^GSAN-/, months: 12 },
]) {
  test(`parcours complet ${platform} : émission, activation, statut, second appareil, autre plateforme`, async () => {
    const cookie = await adminCookie();
    const created = await call("/api/admin/licenses", { cookie, body: { count: 1, durationMonths: months, platform } });
    assert.equal(created.status, 201);
    const key = created.json.data.codes[0];
    assert.match(key, prefix);
    const device = `${client}-parcours-${Date.now()}`;

    // Avant activation : statut « non activée », quelle que soit la plateforme.
    assert.equal((await status(client, key)).json.data.reason, "LICENSE_NOT_ACTIVATED");

    // L'autre plateforme est refusée avant même l'activation…
    assert.equal((await activate(other, key, `${other}-intrus`)).status, 403);

    // …puis la bonne plateforme active la clé, avec la bonne durée.
    const ok = await activate(client, key, device);
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    assert.equal(ok.json.data.license.platform, platform);
    const days = ok.json.data.subscription.daysRemaining;
    assert.ok(days >= months * 28 && days <= months * 31 + 1, `durée ${days} jours pour ${months} mois`);

    // Relancer l'application sur le même appareil reste accepté.
    assert.equal((await activate(client, key, device)).status, 200);
    const st = await status(client, key);
    assert.equal(st.json.data.valid, true);
    assert.equal(st.json.data.license.platform, platform);

    // Un second appareil de la même plateforme est refusé (une clé = une installation).
    assert.equal((await activate(client, key, `${device}-bis`)).status, 409);

    // L'autre plateforme reste refusée après activation, en activation comme en statut.
    assert.equal((await activate(other, key, device)).status, 403);
    assert.equal((await status(other, key)).json.data.reason, "PLATFORM_MISMATCH");
  });
}

for (const { planSlug, platform, client, other, prefix, months } of [
  { planSlug: "pc-3-mois", platform: "PC", client: "desktop", other: "android", prefix: /^GSPC-/, months: 3 },
  { planSlug: "mobile", platform: "ANDROID", client: "android", other: "desktop", prefix: /^GSAN-/, months: 12 },
]) {
  test(`achat de la formule ${planSlug} : paiement confirmé → clé ${platform} de ${months} mois`, async () => {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `client.${planSlug}.${stamp}@test.ci`;
    const password = "Client-Test-2026";
    const registered = await call("/api/auth/register", { body: {
      firstName: "Client", lastName: "Test", email, phone: `+22507${stamp.slice(-8)}`,
      password, confirmPassword: password, country: "Côte d'Ivoire",
    } });
    assert.ok([200, 201].includes(registered.status), JSON.stringify(registered.json));
    const login = await call("/api/auth/login", { body: { email, password } });
    const userCookie = login.res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

    const sub = await call("/api/subscriptions", { cookie: userCookie, body: { planSlug, billingCycle: "annual", method: "wave" } });
    assert.equal(sub.status, 201, JSON.stringify(sub.json));
    const admin = await adminCookie();
    const confirmed = await call(`/api/admin/payments/${sub.json.data.payment.id}`, { cookie: admin, method: "PATCH", body: { status: "COMPLETED" } });
    assert.equal(confirmed.status, 200, JSON.stringify(confirmed.json));

    const mine = await call("/api/subscriptions", { cookie: userCookie, method: "GET" });
    const record = mine.json.data[0];
    const key = record.licenseKeys[0].key;
    assert.match(key, prefix);
    const days = Math.round((new Date(record.endDate) - new Date(record.startDate)) / 86_400_000);
    assert.ok(days >= months * 28 && days <= months * 31 + 1, `abonnement de ${days} jours pour ${months} mois`);

    assert.equal((await activate(other, key, `${other}-${stamp}`)).status, 403);
    const ok = await activate(client, key, `${client}-${stamp}`);
    assert.equal(ok.status, 200, JSON.stringify(ok.json));
    assert.equal(ok.json.data.license.platform, platform);
  });
}

test("ancienne licence d'une formule Android : refusée sur PC, toujours valide sur Android", async () => {
  const onPc = await status("desktop", "GSPP-MOU00-AND00-00000-00002");
  assert.equal(onPc.json.data.valid, false);
  assert.equal(onPc.json.data.reason, "PLATFORM_MISMATCH");
  const onAndroid = await status("android", "GSPP-MOU00-AND00-00000-00002");
  assert.equal(onAndroid.json.data.valid, true);
});

test("ancienne licence PC déjà active : refusée sur Android, toujours acceptée sur son PC", async () => {
  const refused = await activate("android", "GSPP-AWA00-PC000-00000-00001", "pc-awa");
  assert.equal(refused.status, 403);
  const ok = await activate("desktop", "GSPP-AWA00-PC000-00000-00001", "pc-awa");
  assert.equal(ok.status, 200);
});

test("ancien code direct sans formule : rattaché au premier appareil, puis l'autre plateforme est refusée", async () => {
  const first = await activate("android", "GSPP-DIR00-NEW00-00000-00005", "android-direct-2");
  assert.equal(first.status, 200);
  assert.equal(first.json.data.license.platform, "ANDROID");
  const other = await activate("desktop", "GSPP-DIR00-NEW00-00000-00005", "pc-direct-2");
  assert.equal(other.status, 403);
  assert.match(other.json.error, /Android/);
});

test("ancien code direct déjà actif : rattaché au premier contrôle de statut", async () => {
  const first = await status("android", "GSPP-DIR00-USED0-00000-00004");
  assert.equal(first.json.data.valid, true);
  const pc = await status("desktop", "GSPP-DIR00-USED0-00000-00004");
  assert.equal(pc.json.data.reason, "PLATFORM_MISMATCH");
});

test("logiciel PC via la clé API (commandes natives) : traité comme PC", async () => {
  const apiKey = process.env.SOFTWARE_API_KEY;
  if (!apiKey) return;
  const cookie = await adminCookie();
  const created = await call("/api/admin/licenses", { cookie, body: { count: 2, durationMonths: 12, platform: "PC" } });
  const [pcKey] = created.json.data.codes;
  const androidCreated = await call("/api/admin/licenses", { cookie, body: { count: 1, durationMonths: 12, platform: "ANDROID" } });
  const androidKey = androidCreated.json.data.codes[0];
  const ok = await call("/api/license/activate", { apiKey, body: { licenseKey: pcKey, deviceFingerprint: "pc-natif-1" } });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  const refused = await call("/api/license/activate", { apiKey, body: { licenseKey: androidKey, deviceFingerprint: "pc-natif-2" } });
  assert.equal(refused.status, 403);
});

test("en-tête explicite x-gspp-client: android (futures versions) accepté comme Android", async () => {
  const cookie = await adminCookie();
  const created = await call("/api/admin/licenses", { cookie, body: { count: 1, durationMonths: 12, platform: "ANDROID" } });
  const key = created.json.data.codes[0];
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip(), "x-gspp-client": "android" };
  const res = await fetch(`${BASE}/api/license/activate`, { method: "POST", headers, body: JSON.stringify({ licenseKey: key, deviceFingerprint: "android-explicite" }) });
  assert.equal(res.status, 200);
});

test("une requête de l'application sans plateforme reconnue est refusée", async () => {
  const unknown = await activate("ios", "GSPP-FAT00-AND00-00000-00003", "x-device");
  assert.equal(unknown.status, 401);
});
