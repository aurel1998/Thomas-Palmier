/**
 * Mode presentation (sans Supabase) : acces admin local pour maquette / demo.
 *
 * Active avec DEMO_PRESENTATION=true dans .env.local.
 * Mot de passe : DEMO_PRESENTATION_PASSWORD (defaut documente dans .env.example).
 *
 * Ne jamais activer en production sur Internet : le flag est lisible cote serveur
 * et le mot de passe est volontairement simple pour une demo locale.
 */

export const PRESENTATION_COOKIE = "tp_presentation_admin";
export const PRESENTATION_COOKIE_VALUE = "1";

export function isPresentationModeEnabled(): boolean {
  const v = process.env.DEMO_PRESENTATION?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function getPresentationPassword(): string {
  return (process.env.DEMO_PRESENTATION_PASSWORD ?? "Presentation2026!").trim();
}

export function getAdminEmailForPresentation(): string {
  return (process.env.ADMIN_EMAIL ?? "thomas@site.com").trim().toLowerCase();
}
