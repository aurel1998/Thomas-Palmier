import type { Content, ContentType } from "../types/content";
import { articleExcerpt } from "./articleExcerpt";

/** Découpe le corps article en paragraphes narratifs (HTML ou texte). */
export function parseArticleParagraphs(htmlOrText: string): string[] {
  const trimmed = htmlOrText.trim();
  if (!trimmed) return [];

  if (trimmed.includes("<p")) {
    const parts: string[] = [];
    const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(trimmed)) !== null) {
      const inner = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (inner) parts.push(inner);
    }
    if (parts.length) return parts;
  }

  return trimmed
    .split(/\n\s*\n/)
    .map((s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function leadForType(item: Content, paragraphs: string[]): string {
  const { type, title, content, tags } = item;

  if (type === "article") {
    if (paragraphs.length >= 1) return paragraphs[0];
    return articleExcerpt(content, 260) || title;
  }

  if (type === "video") {
    const tag = tags[0];
    return tag
      ? `Une histoire ${tag.toLowerCase()} — images et rythme, comme au bord du terrain.`
      : "Images, sons du stade et regard journalistique.";
  }

  return `Écoutez : chronique et ambiance, du terrain aux tribunes.`;
}

/** Paragraphes suivant le chapô (récit long-form). */
export function getStoryChapters(item: Content): { lead: string; chapters: string[] } {
  if (item.type !== "article") {
    return { lead: leadForType(item, []), chapters: [] };
  }

  const paragraphs = parseArticleParagraphs(item.content);
  if (paragraphs.length <= 1) {
    return {
      lead: leadForType(item, paragraphs),
      chapters: [],
    };
  }

  return {
    lead: paragraphs[0],
    chapters: paragraphs.slice(1),
  };
}

export function formatStoryLabel(type: ContentType): string {
  switch (type) {
    case "video":
      return "Récit visuel";
    case "audio":
      return "Récit audio";
    default:
      return "Grand format";
  }
}
