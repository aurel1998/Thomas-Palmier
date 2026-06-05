import { isRateLimited, resetRateLimit } from "./rateLimit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

/** Limite les tentatives de connexion par email (anti brute-force basique). */
export function isLoginRateLimited(email: string): boolean {
  return isRateLimited(`login:${email}`, MAX_ATTEMPTS, WINDOW_MS);
}

export function resetLoginRateLimit(email: string): void {
  resetRateLimit(`login:${email}`);
}