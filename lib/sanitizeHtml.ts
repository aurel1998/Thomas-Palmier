const BLOCKED_TAGS = /<\/?(?:script|iframe|object|embed|form|input|button|link|meta|style|base)[^>]*>/gi;

/** Retire les balises dangereuses ; conserve le HTML éditorial simple. */
export function sanitizeNewsletterHtml(html: string): string {
  return html.replace(BLOCKED_TAGS, "").trim();
}
