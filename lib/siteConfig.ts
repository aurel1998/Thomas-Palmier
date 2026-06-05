/**
 * Configuration site (serveur) — emails, URLs, libellés.
 */
import { getAdminEmail } from "./adminAccess";

export { getAdminEmail };

export function getSiteName(): string {
  return process.env.NEXT_PUBLIC_SITE_NAME ?? "Thomas Palmier";
}

export function getContactEmail(): string {
  const raw =
    process.env.CONTACT_EMAIL ??
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ??
    "contact@thomaspalmier.fr";
  return raw.trim().toLowerCase();
}

export function getPublicAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
