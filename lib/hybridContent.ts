import type { Content } from "../types/content";

export type HybridBlock =
  | { type: "video"; src: string; poster?: string; title?: string }
  | { type: "text"; body: string; title?: string }
  | { type: "image"; src: string; alt?: string; caption?: string }
  | { type: "embed"; src: string; title?: string };

type HybridDocument = { blocks: HybridBlock[] };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function parseBlock(v: unknown): HybridBlock | null {
  if (!isObject(v) || typeof v.type !== "string") return null;

  if (v.type === "video") {
    const src = asString(v.src);
    if (!src) return null;
    return {
      type: "video",
      src,
      poster: asString(v.poster) ?? undefined,
      title: asString(v.title) ?? undefined,
    };
  }
  if (v.type === "text") {
    const body = asString(v.body);
    if (!body) return null;
    return {
      type: "text",
      body,
      title: asString(v.title) ?? undefined,
    };
  }
  if (v.type === "image") {
    const src = asString(v.src);
    if (!src) return null;
    return {
      type: "image",
      src,
      alt: asString(v.alt) ?? "",
      caption: asString(v.caption) ?? undefined,
    };
  }
  if (v.type === "embed") {
    const src = asString(v.src);
    if (!src) return null;
    return {
      type: "embed",
      src,
      title: asString(v.title) ?? undefined,
    };
  }

  return null;
}

/** Parse JSON modulaire si présent, sinon fallback selon le type de contenu. */
export function buildHybridBlocks(item: Content): HybridBlock[] {
  try {
    const parsed = JSON.parse(item.content) as unknown;
    if (isObject(parsed) && Array.isArray(parsed.blocks)) {
      const blocks = parsed.blocks.map(parseBlock).filter((b): b is HybridBlock => b !== null);
      if (blocks.length > 0) return blocks;
    }
  } catch {
    /* fallback */
  }

  if (item.type === "video") {
    return [{ type: "video", src: item.content, poster: item.image_url, title: item.title }];
  }
  if (item.type === "audio") {
    return [
      { type: "image", src: item.image_url, alt: item.title, caption: item.tags[0] ?? "Audio" },
      { type: "embed", src: item.content, title: item.title },
    ];
  }
  return [{ type: "text", body: item.content, title: "Lecture" }];
}

/** Extrait un chapô court depuis un document hybride vidéo (cartes catalogue). */
export function getHybridVideoTeaser(content: string, maxLen = 140): string {
  try {
    const parsed = JSON.parse(content) as HybridDocument;
    if (!Array.isArray(parsed.blocks)) return "";
    const textBlock = parsed.blocks.find((b) => b.type === "text" && b.body.trim());
    if (!textBlock || textBlock.type !== "text") return "";
    const body = textBlock.body.replace(/\s+/g, " ").trim();
    if (body.length <= maxLen) return body;
    return `${body.slice(0, maxLen - 1).trim()}…`;
  } catch {
    return "";
  }
}

/** Découpe un bloc texte long en paragraphes lisibles (articles de presse). */
export function toParagraphs(text: string): string[] {
  const cleaned = text.replace(/<[^>]*>/g, " ").trim();
  if (!cleaned) return [];

  const fromDoubleBreak = cleaned
    .split(/\n\s*\n/)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (fromDoubleBreak.length > 1) return fromDoubleBreak;

  if (cleaned.includes("\n")) {
    return cleaned
      .split(/\n+/)
      .map((x) => x.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  return [cleaned.replace(/\s+/g, " ").trim()];
}

/** Construit un document hybride vidéo YouTube + texte éditorial. */
export function buildYouTubeVideoDocument(opts: {
  youtubeId: string;
  title: string;
  lede?: string;
  body?: string;
}): string {
  const url = `https://www.youtube.com/watch?v=${opts.youtubeId}`;
  const blocks: HybridBlock[] = [{ type: "video", src: url, title: opts.title }];
  if (opts.lede?.trim()) {
    blocks.push({ type: "text", title: "En bref", body: opts.lede.trim() });
  }
  if (opts.body?.trim()) {
    blocks.push({ type: "text", title: "Contexte", body: opts.body.trim() });
  }
  return JSON.stringify({ blocks });
}
