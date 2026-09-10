import { z } from "zod";
import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";
import { db } from "@/lib/db";

// ── Réponses JSON normalisées ────────────────────────────────
export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

// Les applications Windows/Android appellent uniquement les routes licence
// depuis leur WebView. Sans ces en-têtes, le navigateur masque la réponse
// serveur et remonte à l'application une erreur générique « Failed to fetch ».
export function withPublicLicenseCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, x-gspp-client, x-api-key");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Wrapper global : capture les erreurs AuthError / Zod / inattendues
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return fail(first ? `${first.path.join(".")}: ${first.message}` : "Données invalides", 422);
    }
    console.error("[API Error]", err);
    return fail("Une erreur interne est survenue. Veuillez réessayer.", 500);
  }
}

// ── Journalisation des actions importantes ───────────────────
export async function logAction(
  action: string,
  userId: string | null,
  details?: string,
  ip?: string
) {
  try {
    await db.activityLog.create({
      data: { action, userId, details, ipAddress: ip ?? null },
    });
  } catch (e) {
    console.error("[Log Error]", e);
  }
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ── Limitation des tentatives (anti brute-force, en mémoire) ─
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > maxAttempts) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}

// Nettoyage périodique des entrées expirées
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k);
  }, 60_000);
  if (typeof timer === "object" && "unref" in timer) (timer as { unref: () => void }).unref();
}

// ── Protection CSRF : vérifier l'origine des mutations ───────
export function assertSameOrigin(req: Request) {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return; // Requêtes serveur à serveur / même origine sans header
  const host = req.headers.get("host");
  try {
    const originHost = new URL(origin).host;
    if (host && originHost !== host) {
      throw new AuthError("Origine non autorisée (CSRF)", 403);
    }
  } catch (e) {
    if (e instanceof AuthError) throw e;
    throw new AuthError("Origine invalide", 403);
  }
}
