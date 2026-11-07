import assert from "node:assert/strict";
import test from "node:test";
import {
  checkLicensePlatform,
  detectDevicePlatform,
  normalizeDevicePlatform,
  platformFromKey,
  platformFromPlan,
  resolveLicensePlatform,
} from "../src/lib/license-platform.ts";

test("l'en-tête x-gspp-client donne la plateforme de l'appareil", () => {
  assert.equal(normalizeDevicePlatform("desktop"), "PC");
  assert.equal(normalizeDevicePlatform("PC"), "PC");
  assert.equal(normalizeDevicePlatform("android"), "ANDROID");
  assert.equal(normalizeDevicePlatform(" Android "), "ANDROID");
  assert.equal(normalizeDevicePlatform("ios"), null);
  assert.equal(normalizeDevicePlatform(undefined), null);
});

test("l'APK Android qui envoie « desktop » est reconnu par son User-Agent", () => {
  const androidUa = "Mozilla/5.0 (Linux; Android 13; SM-A145F; wv) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36";
  const windowsUa = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36 Edg/130";
  assert.equal(detectDevicePlatform({ userAgent: androidUa, clientHeader: "desktop" }), "ANDROID");
  assert.equal(detectDevicePlatform({ userAgent: windowsUa, clientHeader: "desktop" }), "PC");
  assert.equal(detectDevicePlatform({ userAgent: null, clientHeader: "android" }), "ANDROID");
  assert.equal(detectDevicePlatform({ userAgent: null, clientHeader: null, trustedServer: true }), "PC");
  assert.equal(detectDevicePlatform({ userAgent: null, clientHeader: null }), null);
});

test("le préfixe de la clé identifie sa plateforme", () => {
  assert.equal(platformFromKey("GSPC-AAAAA-BBBBB-CCCCC-DDDDD"), "PC");
  assert.equal(platformFromKey("gsan-aaaaa-bbbbb-ccccc-ddddd"), "ANDROID");
  assert.equal(platformFromKey("GSPP-AAAAA-BBBBB-CCCCC-DDDDD"), null);
});

test("la formule mobile est Android, même avant la migration", () => {
  assert.equal(platformFromPlan({ slug: "mobile", platform: "PC" }), "ANDROID");
  assert.equal(platformFromPlan({ slug: "android-6-mois", platform: "ANDROID" }), "ANDROID");
  assert.equal(platformFromPlan({ slug: "mobile" }), "ANDROID");
  assert.equal(platformFromPlan({ slug: "professionnel", platform: "PC" }), "PC");
  assert.equal(platformFromPlan(null), null);
});

test("ordre de résolution : champ en base, préfixe, puis formule", () => {
  assert.equal(resolveLicensePlatform({ key: "GSPP-X", platform: "ANDROID" }), "ANDROID");
  assert.equal(resolveLicensePlatform({ key: "GSAN-X", platform: null }), "ANDROID");
  assert.equal(resolveLicensePlatform({ key: "GSPP-X", platform: null, subscription: { plan: { slug: "mobile" } } }), "ANDROID");
  assert.equal(resolveLicensePlatform({ key: "GSPP-X", platform: null, subscription: { plan: { slug: "professionnel", platform: "PC" } } }), "PC");
  assert.equal(resolveLicensePlatform({ key: "GSPP-X", platform: null, subscription: null }), null);
});

test("une clé Android n'active jamais un PC", () => {
  const result = checkLicensePlatform("ANDROID", "PC");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "PLATFORM_MISMATCH");
  assert.match(result.message, /Android/);
});

test("une clé PC n'active jamais un appareil Android", () => {
  const result = checkLicensePlatform("PC", "ANDROID");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "PLATFORM_MISMATCH");
});

test("même plateforme acceptée; ancienne clé rattachée au premier appareil", () => {
  assert.deepEqual(checkLicensePlatform("PC", "PC"), { ok: true, platform: "PC", bind: false });
  assert.deepEqual(checkLicensePlatform("ANDROID", "ANDROID"), { ok: true, platform: "ANDROID", bind: false });
  assert.deepEqual(checkLicensePlatform(null, "ANDROID"), { ok: true, platform: "ANDROID", bind: true });
});
