import type { UserRole } from "@prisma/client";

/** Email admin canonique en production (seul compte autorisé sur /monsite). */
export const CANONICAL_ADMIN_EMAIL = "contact@thomaspalmier.fr";

/**
 * Email admin autorisé — verrou production sur contact@thomaspalmier.fr.
 * Surcharge possible via ADMIN_EMAIL (déconseillé hors dev local).
 */
export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? CANONICAL_ADMIN_EMAIL).trim().toLowerCase();
}

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length > 0 && normalized === getAdminEmail();
}

export function isAllowedAdminRole(role: string | null | undefined): role is UserRole {
  return role === "admin";
}

export type AdminSessionUser = {
  email?: string | null;
  role?: string | null;
};

/** Vérifie email + rôle admin (middleware, API, login). */
export function isAllowedAdminUser(user: AdminSessionUser | null | undefined): boolean {
  if (!user) return false;
  return isAllowedAdminEmail(user.email) && isAllowedAdminRole(user.role);
}
