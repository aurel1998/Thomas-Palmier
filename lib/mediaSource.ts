const ABSOLUTE_URL_RE = /^https?:\/\//i;
const AUDIO_EXT_RE = /\.(mp3|wav|ogg|m4a|aac|flac|opus)(?:$|[?#])/i;
const AUDIO_HINT_RE = /(?:audio|podcast|\.mp3|\.wav|\.ogg|\.m4a|\.aac|\.flac|\.opus)/i;

/**
 * Normalise une source media pour eviter les espaces parasites
 * et les valeurs nulles/non-string.
 */
export function normalizeMediaSource(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

/**
 * Detection permissive pour differencier audio/video dans l'UI.
 */
export function isLikelyAudioUrl(value: unknown): boolean {
  const src = normalizeMediaSource(value);
  if (!src) return false;
  if (AUDIO_EXT_RE.test(src)) return true;
  if (!ABSOLUTE_URL_RE.test(src)) return AUDIO_HINT_RE.test(src);
  try {
    const url = new URL(src);
    return AUDIO_EXT_RE.test(url.pathname) || AUDIO_HINT_RE.test(url.pathname + url.search);
  } catch {
    return AUDIO_HINT_RE.test(src);
  }
}
