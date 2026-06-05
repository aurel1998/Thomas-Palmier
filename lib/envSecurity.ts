const PLACEHOLDER_PATTERNS = [/change-me/i, /CHANGEME/i, /^admin$/i, /^password$/i];

export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== "production") return;

  const secret = (process.env.JWT_SECRET ?? process.env.AUTH_SECRET ?? "").trim();
  if (!secret || secret.length < 32 || PLACEHOLDER_PATTERNS.some((p) => p.test(secret))) {
    console.error(
      "[security] JWT_SECRET manquant ou trop faible en production. Générez : openssl rand -base64 32"
    );
  }

  const cron = (process.env.CRON_SECRET ?? "").trim();
  if (cron && cron.length < 24 && PLACEHOLDER_PATTERNS.some((p) => p.test(cron))) {
    console.error("[security] CRON_SECRET placeholder détecté en production.");
  }
}
