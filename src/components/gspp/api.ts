"use client";

// ── Client API typé — réponses normalisées { success, data } ──
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    credentials: "same-origin",
  });
  const json = await res.json().catch(() => ({ success: false, error: "Réponse invalide" }));
  if (!res.ok || !json.success) {
    throw new ApiError(json.error ?? "Une erreur est survenue.", res.status);
  }
  return json.data as T;
}

export const api = {
  get: <T,>(url: string) => request<T>(url),
  post: <T,>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T,>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T,>(url: string) => request<T>(url, { method: "DELETE" }),
};

// ── Types partagés ────────────────────────────────────────────
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string | null;
  establishment?: string | null;
  country?: string | null;
  active?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface SubscriptionInfo {
  id: string;
  reference: string;
  status: string;
  billingCycle: string;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  plan: { name: string; slug: string };
}

export interface LicenseInfo {
  key: string;
  status: string;
}

export interface MeResponse {
  user: User;
  subscription: SubscriptionInfo | null;
  licenseKey: LicenseInfo | null;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  maxUsers: number;
  maxSchools: number;
  maxStudents: number;
  features: string[];
  highlighted: boolean;
  active: boolean;
  sortOrder: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  establishment: string;
  content: string;
  rating: number;
  initials: string;
  color: string;
  published: boolean;
  sortOrder: number;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverEmoji: string;
  published: boolean;
  views: number;
  publishedAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  published: boolean;
}

export interface DocSectionSummary {
  number: number;
  slug: string;
  title: string;
  icon: string;
}

export interface DocSection extends DocSectionSummary {
  content: string;
  updatedAt: string;
}

export interface SoftwareVersion {
  id: string;
  version: string;
  channel: string;
  releaseDate: string;
  fileSizeMb: number;
  minOs: string;
  installerName: string;
  downloadUrl: string;
  changelog: string;
  downloads: number;
  active: boolean;
}

export interface SubscriptionRecord {
  id: string;
  reference: string;
  billingCycle: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
  createdAt: string;
  plan: Plan;
  payments: PaymentRecord[];
  licenseKeys: { id: string; key: string; status: string; maxDevices: number; deviceFingerprint: string | null }[];
}

export interface PaymentRecord {
  id: string;
  reference: string;
  amount: number;
  method: string;
  phoneMsisdn: string | null;
  status: string;
  invoiceNumber: string | null;
  providerRef: string | null;
  createdAt: string;
  subscription?: { plan?: { name: string; slug: string } };
}

export interface TicketRecord {
  id: string;
  reference: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  response: string | null;
  createdAt: string;
}
