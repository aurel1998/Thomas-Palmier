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
const YT_LOOSE_ID_REGEX = /(?:youtu\.be\/|v=|embed\/|shorts\/|\/v\/)([a-zA-Z0-9_-]{11})/;

function isValidId(id: string | null | undefined): id is string {
  return !!id && YT_ID_REGEX.test(id);
}

function parseYouTubeIdFromUrl(trimmed: string): string | null {
  if (isValidId(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!YT_HOSTS.has(host)) return null;

  if (host.endsWith("youtu.be")) {
    const id = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
    return isValidId(id) ? id : null;
  }

  const v = url.searchParams.get("v");
  if (isValidId(v)) return v;

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

function parseYouTubeIdFromHybridJson(trimmed: string): string | null {
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed) as { blocks?: unknown[] };
    if (!Array.isArray(parsed.blocks)) return null;
    for (const block of parsed.blocks) {
      if (!block || typeof block !== "object") continue;
      const record = block as { type?: unknown; src?: unknown };
      if (record.type !== "video" || typeof record.src !== "string") continue;
      const id = parseYouTubeIdFromUrl(record.src.trim()) ?? parseYouTubeIdLoose(record.src);
      if (id) return id;
    }
  } catch {
    return null;
  }
  return null;
}

function parseYouTubeIdLoose(input: string): string | null {
  const match = input.match(YT_LOOSE_ID_REGEX);
  const id = match?.[1];
  return isValidId(id) ? id : null;
}

/**
 * Renvoie l'ID YouTube d'une URL, d'un document hybride JSON ou d'une chaîne contenant un lien.
 */
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  return (
    parseYouTubeIdFromUrl(trimmed) ??
    parseYouTubeIdFromHybridJson(trimmed) ??
    parseYouTubeIdLoose(trimmed)
  );
}

/** URL de lecture pour le player (YouTube ou MP4), y compris depuis un JSON hybride. */
export function resolveVideoMediaSource(content: string): string {
  const trimmed = content.trim();
  const id = extractYouTubeId(trimmed);
  if (!id) return trimmed;

  if (trimmed.startsWith("http") && !trimmed.startsWith("{")) {
    const fromUrl = parseYouTubeIdFromUrl(trimmed);
    if (fromUrl === id) return trimmed;
  }

  return `https://www.youtube.com/watch?v=${id}`;
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
