/** `true` en build/production (`next build` / `next start`). */
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Catalogue, agenda et contenus fictifs : uniquement en développement local.
 * Jamais activé sur le VPS (NODE_ENV=production).
 */
export const ENABLE_DEV_FALLBACKS = !IS_PRODUCTION;
