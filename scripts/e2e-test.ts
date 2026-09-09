// ── Vérification navigateur end-to-end — Gestion Scolaire Pro Plus ──
// Parcours complets : accueil, navigation, inscription, connexion,
// abonnement (paiement simulé), dashboard, admin, documentation.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const results = [];
function log(name, ok, extra = "") {
  results.push({ name, ok, extra });
  console.log(`${ok ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 160));
  });
  page.on("pageerror", (err) => consoleErrors.push("PAGEERROR: " + String(err).slice(0, 160)));

  // ── 1. Accueil ─────────────────────────────────────────────
  await page.goto(BASE, { waitUntil: "networkidle" });
  const h1 = await page.locator("h1").first().textContent();
  log("Accueil — titre h1", /gestion scolaire/i.test(h1 ?? ""), h1?.slice(0, 60));

  const heroCtas = await page.locator("button:has-text('Découvrir le logiciel')").count();
  log("Accueil — CTA hero", heroCtas > 0);

  // Formulaire des formules chargé depuis l'API
  await page.waitForTimeout(800);
  const planCards = await page.locator("text=9 900 FCFA").count();
  log("Accueil — tarifs API affichés", planCards > 0, `${planCards} carte(s)`);

  // Témoignages
  const testimonial = await page.locator("text=Ils utilisent Gestion Scolaire Pro Plus").count();
  log("Accueil — section témoignages", testimonial > 0);

  // ── 2. Navigation par le menu ──────────────────────────────
  await page.click("nav >> text=Fonctionnalités");
  await page.waitForTimeout(400);
  log("Navigation — /fonctionnalites", page.url().includes("#/fonctionnalites"));

  await page.click("nav >> text=Tarifs");
  await page.waitForTimeout(500);
  const toggle = await page.locator("text=Jusqu'à 2 mois offerts").count();
  log("Page Tarifs", page.url().includes("#/tarifs") && toggle > 0);

  await page.click("nav >> text=Notice");
  await page.waitForTimeout(600);
  const docTitle = await page.locator("h1:has-text('Notice d')").count();
  log("Page Notice", docTitle > 0);
  // Recherche dans la documentation
  await page.fill("input[placeholder*='Rechercher dans la documentation']", "bulletin");
  await page.waitForTimeout(300);
  const filtered = await page.locator("a:has-text('Bulletins')").count();
  log("Notice — recherche", filtered > 0);
  await page.click("nav >> text=Télécharger");

  // ── 3. Page Télécharger + détection OS ─────────────────────
  await page.waitForTimeout(600);
  // Le sandbox tourne sous Linux : on sélectionne l'onglet Windows pour vérifier le bouton
  const winTab = page.locator("button:has-text('Windows')").first();
  if ((await winTab.count()) > 0) await winTab.click();
  await page.waitForTimeout(300);
  const dlBtn = await page.locator("button:has-text('Télécharger pour Windows')").count();
  log("Télécharger — bouton Windows détecté", dlBtn > 0);

  // ── 4. Inscription d'un nouveau compte ─────────────────────
  const unique = Date.now().toString().slice(-8);
  await page.click("a:has-text('Créer un compte')");
  await page.waitForTimeout(500);
  await page.fill("#reg-firstname", "Koffi");
  await page.fill("#reg-lastname", "Adjoua");
  await page.fill("#reg-email", `koffi.adjoua.${unique}@ecole-test.ci`);
  await page.fill("#reg-phone", "+225 07 11 22 33 44");
  await page.fill("#reg-establishment", "Collège Test Moderne");
  await page.fill("#reg-password", "Test@2026ok");
  await page.fill("#reg-confirm", "Test@2026ok");
  await page.click("button[type=submit]:has-text('Créer mon compte')");
  await page.waitForTimeout(1500);
  log("Inscription — redirection dashboard", page.url().includes("#/compte"), page.url().split("#")[1]);
  const welcome = await page.locator("h1:has-text('Bonjour, Koffi')").count();
  log("Dashboard — salutation personnalisée", welcome > 0);

  // ── 5. Parcours d'abonnement complet ───────────────────────
  await page.goto(`${BASE}/#/compte/abonnement`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  // Étape 1 : choisir une formule
  await page.click("button:has-text('Choisir Professionnel')");
  await page.waitForTimeout(400);
  // Étape 2 : cycle annuel pré-sélectionné + Mobile Money → numéro → confirmer
  await page.fill("#momo-phone", "+225 07 11 22 33 44");
  await page.click("button:has-text('Confirmer et procéder au paiement')");
  await page.waitForTimeout(1200);
  const payScreen = await page.locator("text=Finalisez votre paiement").count();
  log("Abonnement — écran paiement", payScreen > 0);
  const merchant = await page.locator("text=05 04 06 07 08").count();
  log("Abonnement — instructions Mobile Money", merchant > 0);
  // Étape 3 : confirmer le paiement
  await page.click("button:has-text('activer mon abonnement')");
  await page.waitForTimeout(1600);
  const congrats = await page.locator("h1:has-text('Félicitations')").count();
  log("Abonnement — activation confirmée", congrats > 0);
  const licenseVisible = await page.locator("text=GSPP-").first().isVisible().catch(() => false);
  log("Abonnement — clé de licence générée", licenseVisible);

  // ── 6. Dashboard avec licence ──────────────────────────────
  await page.goto(`${BASE}/#/compte`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const subActive = await page.locator("text=Actif").first().isVisible().catch(() => false);
  log("Dashboard — abonnement Actif", subActive);
  const daysRemaining = await page.locator("text=jours").first().isVisible().catch(() => false);
  log("Dashboard — jours restants affichés", daysRemaining);

  // ── 7. Paiements / factures ────────────────────────────────
  await page.goto(`${BASE}/#/compte/paiements`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const invoice = await page.locator("td:has-text('FA-2026')").count();
  log("Paiements — facture générée", invoice > 0, `${invoice} facture(s)`);

  // ── 8. Support : envoyer une demande ───────────────────────
  await page.goto(`${BASE}/#/support`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.fill("#s-subject", "Test automatisé du support");
  await page.locator("#s-category").click();
  await page.click("div[role=option]:has-text('Problème technique')");
  await page.fill("#s-message", "Message de test envoyé par la vérification automatisée du site.");
  await page.click("button:has-text('Envoyer la demande')");
  await page.waitForTimeout(1200);
  const ticketRef = await page.locator("text=TCK-2026-").count();
  log("Support — ticket créé", ticketRef > 0);

  // ── 9. Déconnexion puis connexion démo ─────────────────────
  await page.click("button[aria-label='Menu du compte']");
  await page.waitForTimeout(300);
  await page.locator("text=Se déconnecter").first().click();
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/#/connexion`, { waitUntil: "networkidle" });
  await page.fill("#login-email", "demo@gspp.ci");
  await page.fill("#login-password", process.env.SEED_DEMO_PASSWORD ?? "");
  await page.click("button[type=submit]:has-text('Se connecter')");
  await page.waitForTimeout(1400);
  const demoWelcome = await page.locator("h1:has-text('Bonjour, Ibrahim')").count();
  log("Connexion — compte démo (abonné)", demoWelcome > 0);

  // ── 10. Espace administration ──────────────────────────────
  await page.click("button[aria-label='Menu du compte']");
  await page.waitForTimeout(300);
  const hasLogout = await page.locator("text=Se déconnecter").count();
  if (hasLogout > 0) {
    await page.locator("text=Se déconnecter").first().click();
    await page.waitForTimeout(800);
  }
  await page.goto(`${BASE}/#/connexion`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.fill("#login-email", "admin@gspp.ci");
  await page.fill("#login-password", process.env.SEED_ADMIN_PASSWORD ?? "");
  await page.click("button[type=submit]:has-text('Se connecter')");
  await page.waitForTimeout(1400);
  await page.goto(`${BASE}/#/admin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const adminTitle = await page.locator("h1:has-text('Gestion de la plateforme')").count();
  log("Admin — accès autorisé (rôle ADMIN)", adminTitle > 0);
  const statsCards = await page.locator("text=Revenus totaux").first().isVisible().catch(() => false);
  log("Admin — statistiques chargées", statsCards);
  // Onglet tickets
  await page.locator("[role='tab']:has-text('Tickets')").first().click().catch(() => {});
  await page.waitForTimeout(600);
  const ticketsTab = await page.locator("text=Tickets de support").count();
  log("Admin — onglet tickets", ticketsTab > 0);

  // ── 11. Thème sombre ───────────────────────────────────────
  await page.click("button[aria-label*='Basculer entre mode clair et mode sombre']");
  await page.waitForTimeout(400);
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  log("Mode sombre — bascule", isDark);
  await page.click("button[aria-label*='Basculer entre mode clair et mode sombre']");

  // ── 12. Responsive mobile ──────────────────────────────────
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(BASE, { waitUntil: "networkidle" });
  await mobile.waitForTimeout(600);
  const burger = await mobile.locator("button[aria-label='Ouvrir le menu']").count();
  log("Mobile — bouton menu visible", burger > 0);
  await mobile.click("button[aria-label='Ouvrir le menu']");
  await mobile.waitForTimeout(400);
  const mobileNav = await mobile.locator("text=Créer un compte").count();
  log("Mobile — menu feuille ouvert", mobileNav > 0);
  const noHScroll = await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
  log("Mobile — pas de défilement horizontal", noHScroll);
  await mobile.close();

  // ── 13. Erreurs console ────────────────────────────────────
  const realErrors = consoleErrors.filter(
    (e) => !e.includes("favicon") && !e.includes("404") && !e.includes("Failed to load resource")
  );
  log("Erreurs console", realErrors.length === 0, realErrors.slice(0, 3).join(" | "));

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n═══ RÉSULTAT : ${results.length - failed.length}/${results.length} tests réussis ═══`);
  if (failed.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error("❌ Erreur fatale du script de test :", e.message);
  process.exit(1);
});
