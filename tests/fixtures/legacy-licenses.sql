-- Données "avant migration" : schéma de production actuel, clés GSPP- uniquement.
INSERT INTO "User" (id, "firstName", "lastName", email, password, role, "updatedAt") VALUES
 ('u_admin','Test','Admin','admin.local@test.ci','$2b$10$abcdefghijklmnopqrstuuS2nU8a5yqU6t3m0F7c1cVnVq0o9u7mS','ADMIN', now()),
 ('u_awa','Awa','Koné','awa@test.ci','x','USER', now()),
 ('u_moussa','Moussa','Traoré','moussa@test.ci','x','USER', now()),
 ('u_fatou','Fatou','Diallo','fatou@test.ci','x','USER', now());

INSERT INTO "SubscriptionPlan" (id, slug, name, description, "annualPrice", features, active, "sortOrder", "updatedAt") VALUES
 ('p_pro','professionnel','Ordinateur Windows','PC',15000,'["Bulletins"]',true,2, now()),
 ('p_mob','mobile','Téléphone et tablette','Android',5000,'["Bulletins"]',true,3, now());

INSERT INTO "Subscription" (id, reference, "userId", "planId", "billingCycle", status, "startDate", "endDate", "updatedAt") VALUES
 ('s_awa','SUB-AWA','u_awa','p_pro','annual','ACTIVE', now() - interval '60 days', now() + interval '300 days', now()),
 ('s_moussa','SUB-MOU','u_moussa','p_mob','annual','ACTIVE', now() - interval '20 days', now() + interval '20 days', now()),
 ('s_fatou','SUB-FAT','u_fatou','p_mob','annual','ACTIVE', now() - interval '5 days', now() + interval '360 days', now());

INSERT INTO "LicenseKey" (id, key, "userId", "subscriptionId", status, "validityMonths", "activatedAt", "expiresAt", "deviceFingerprint", "updatedAt", "createdAt") VALUES
 ('l_awa','GSPP-AWA00-PC000-00000-00001','u_awa','s_awa','ACTIVE',NULL, now() - interval '55 days', NULL,'pc-awa', now(), now() - interval '60 days'),
 ('l_moussa','GSPP-MOU00-AND00-00000-00002','u_moussa','s_moussa','ACTIVE',NULL, now() - interval '18 days', NULL,'android-moussa', now(), now() - interval '20 days'),
 ('l_fatou','GSPP-FAT00-AND00-00000-00003','u_fatou','s_fatou','INACTIVE',NULL, NULL, NULL, NULL, now(), now() - interval '5 days'),
 ('l_direct_used','GSPP-DIR00-USED0-00000-00004',NULL,NULL,'ACTIVE',12, now() - interval '100 days', now() + interval '265 days','android-direct', now(), now() - interval '110 days'),
 ('l_direct_new','GSPP-DIR00-NEW00-00000-00005',NULL,NULL,'INACTIVE',6, NULL, NULL, NULL, now(), now() - interval '2 days'),
 ('l_revoked','GSPP-REV00-00000-00000-00006',NULL,NULL,'REVOKED',12, NULL, NULL, NULL, now(), now() - interval '30 days'),
 ('l_expired','GSPP-EXP00-00000-00000-00007',NULL,NULL,'ACTIVE',1, now() - interval '70 days', now() - interval '40 days','pc-old', now(), now() - interval '75 days');
