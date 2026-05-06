/**
 * Utilitaires YouTube : detection d'URL, extraction d'ID, embed et thumbnails.
 *
 * Formats supportes :
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://m.youtube.com/watch?v=VIDEO_ID
 *   - https://youtube.com/watch?v=VIDEO_ID&t=...
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/shorts/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *   - https://www.youtube.com/v/VIDEO_ID
 *   - VIDEO_ID brut (11 caracteres)
 */

const YT_HOSTS = new Set<string>([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function isValidId(id: string | null | undefined): id is string {
  return !!id && YT_ID_REGEX.test(id);
}

/**
 * Renvoie l'ID YouTube d'une URL, ou null si ce n'est pas une URL YouTube valide.
 */
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // ID brut ?
  if (isValidId(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!YT_HOSTS.has(host)) return null;

  // youtu.be/ID
  if (host.endsWith("youtu.be")) {
    const id = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
    return isValidId(id) ? id : null;
  }

  // youtube.com/watch?v=ID
  const v = url.searchParams.get("v");
  if (isValidId(v)) return v;

  // youtube.com/shorts/ID | /embed/ID | /v/ID
  const parts = url.pathname.split("/").filter(Boolean);
  for (const key of ["shorts", "embed", "v", "live"]) {
    const i = parts.indexOf(key);
    if (i !== -1) {
      const candidate = parts[i + 1];
      if (isValidId(candidate)) return candidate;
    }
  }

  return null;
}

export function isYouTubeUrl(input: string): boolean {
  return extractYouTubeId(input) !== null;
}

/**
 * URL d'embed YouTube (domaine nocookie pour une meilleure privacy).
 *
 * - `jsapi`  : active l'API postMessage (enablejsapi=1) pour que le script
 *              YouTube IFrame API puisse controler le player et ecouter les
 *              evenements (onStateChange, ENDED, etc.).
 * - `origin` : origine du site (doit correspondre a window.location.origin),
 *              requise par YouTube quand enablejsapi=1.
 */
export function getYouTubeEmbedUrl(
  id: string,
  opts: {
    autoplay?: boolean;
    mute?: boolean;
    loop?: boolean;
    start?: number;
    jsapi?: boolean;
    origin?: string;
  } = {}
): string {
  const base = `https://www.youtube-nocookie.com/embed/${id}`;
  const params = new URLSearchParams();
  if (opts.autoplay) params.set("autoplay", "1");
  if (opts.mute) params.set("mute", "1");
  if (opts.loop) {
    params.set("loop", "1");
    params.set("playlist", id);
  }
  if (opts.start && opts.start > 0) params.set("start", String(Math.floor(opts.start)));
  if (opts.jsapi) params.set("enablejsapi", "1");
  if (opts.origin) params.set("origin", opts.origin);
  params.set("rel", "0");
  params.set("modestbranding", "1");
  params.set("playsinline", "1");
  return `${base}?${params.toString()}`;
}

/**
 * URL d'une vignette YouTube (thumbnail).
 * "max" = maxresdefault.jpg (peut etre absent pour certaines videos)
 * "hq"  = hqdefault.jpg (toujours disponible)
 */
export function getYouTubeThumbnail(id: string, quality: "hq" | "max" = "hq"): string {
  const file = quality === "max" ? "maxresdefault" : "hqdefault";
  return `https://i.ytimg.com/vi/${id}/${file}.jpg`;
}
