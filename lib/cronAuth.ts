/** Vérifie le secret cron (header Bearer ; query ?secret= uniquement hors production). */
export function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization")?.trim();
  if (auth === `Bearer ${secret}`) return true;

  if (process.env.NODE_ENV === "production") return false;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export function cronSecretConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET?.trim());
}
