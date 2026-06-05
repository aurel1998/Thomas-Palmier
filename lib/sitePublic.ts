/**
 * Variables publiques (client) — doivent être préfixées NEXT_PUBLIC_ dans .env.
 */

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Thomas Palmier";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@thomaspalmier.fr";

/** Indication login admin (email attendu en production). */
export const ADMIN_EMAIL_HINT =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL_HINT ?? "contact@thomaspalmier.fr";
