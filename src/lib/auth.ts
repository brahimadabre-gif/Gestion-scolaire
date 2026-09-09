import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const rawJwtSecret = process.env.JWT_SECRET ?? "gspp-dev-secret-change-in-production-min-32-chars";

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET || rawJwtSecret === "gspp-dev-secret-change-in-production-min-32-chars")
) {
  throw new Error("JWT_SECRET doit être défini avec une valeur forte en production.");
}

const JWT_SECRET = new TextEncoder().encode(rawJwtSecret);

export const SESSION_COOKIE = "gspp_session";
const SESSION_DURATION = "7d";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
}

// ── Mots de passe ────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── Sessions JWT (httpOnly cookie) ───────────────────────────
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("gestion-scolaire-pro-plus")
    .setExpirationTime(SESSION_DURATION)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "gestion-scolaire-pro-plus",
    });
    if (!payload.userId || typeof payload.userId !== "string") return null;
    return {
      userId: payload.userId,
      email: String(payload.email ?? ""),
      role: String(payload.role ?? "USER"),
    };
  } catch {
    return null;
  }
}

// Récupère l'utilisateur complet depuis la requête (session cookie)
export async function getSessionUser(req: Request) {
  const token = getCookieFromRequest(req, SESSION_COOKIE);
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      establishment: true, country: true, role: true, emailVerified: true,
      active: true, createdAt: true, lastLoginAt: true,
    },
  });
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser(req: Request) {
  const user = await getSessionUser(req);
  if (!user) throw new AuthError("Non authentifié", 401);
  return user;
}

export async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  if (user.role !== "ADMIN") throw new AuthError("Accès réservé aux administrateurs", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

// ── Cookies helpers ──────────────────────────────────────────
export function getCookieFromRequest(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  };
}

// ── Tokens de réinitialisation ───────────────────────────────
import crypto from "crypto";

export function generateResetToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
}

export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ── Clés de licence ──────────────────────────────────────────
export function generateLicenseKey(): string {
  const bytes = crypto.randomBytes(16);
  const hex = bytes.toString("hex").toUpperCase();
  return `GSPP-${hex.slice(0, 5)}-${hex.slice(5, 10)}-${hex.slice(10, 15)}-${hex.slice(15, 20)}`;
}

export function generateReference(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}
