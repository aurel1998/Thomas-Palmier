import type { Content } from "../types/content";

/** Intentions éditoriales (logique métier, pas format technique). */
export type EditorialIntentId = "analyses" | "enquetes" | "coulisses" | "interviews";

export type EditorialIntentDef = {
  id: EditorialIntentId;
  label: string;
  /** Ligne éditoriale affichée sous le titre de rail. */
  lede: string;
  /** Correspondance sur les tags : sous-chaîne insensible à la casse / accents. */
  tagPatterns: string[];
};

/** Ordre d’assignation : un contenu = une seule intention (la première qui matche). */
export const EDITORIAL_INTENTS: readonly EditorialIntentDef[] = [
  {
    id: "analyses",
    label: "Analyses",
    lede: "Lecture du jeu, angles tactiques et décryptages.",
    tagPatterns: [
      "analyse",
      "analyses",
      "tactique",
      "décryptage",
      "decryptage",
      "stats",
      "statistique",
      "breakdown",
    ],
  },
  {
    id: "enquetes",
    label: "Enquêtes",
    lede: "Investigations, faits et révélations.",
    tagPatterns: [
      "enquête",
      "enquete",
      "investigation",
      "révélation",
      "revelation",
      "révélations",
      "revelations",
      "affaire",
      "document",
    ],
  },
  {
    id: "coulisses",
    label: "Coulisses",
    lede: "Instants de vestiaires, préparation et coulisses du sport.",
    tagPatterns: [
      "coulisse",
      "coulisses",
      "vestiaire",
      "backstage",
      "préparation",
      "preparation",
      "archives",
      "ambiance",
    ],
  },
  {
    id: "interviews",
    label: "Interviews",
    lede: "Entretiens, portraits et voix du terrain.",
    tagPatterns: [
      "interview",
      "entretien",
      "portrait",
      "propos",
      "témoignage",
      "temoignage",
      "dialogue",
      "face à face",
    ],
  },
] as const;

function normalizeTag(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function tagMatchesPatterns(tag: string, patterns: readonly string[]): boolean {
  const n = normalizeTag(tag);
  if (!n) return false;
  return patterns.some((p) => n.includes(normalizeTag(p)));
}

/** Retourne l’intention éditoriale déduite des tags (une seule, ordre des piliers). */
export function intentForContentTags(tags: string[]): EditorialIntentId | null {
  for (const intent of EDITORIAL_INTENTS) {
    for (const tag of tags) {
      if (tagMatchesPatterns(tag, intent.tagPatterns)) {
        return intent.id;
      }
    }
  }
  return null;
}

export type GroupedByIntent = Record<EditorialIntentId, Content[]>;

export function groupContentsByEditorialIntent(
  contents: Content[],
  options?: { excludeIds?: Set<string> }
): GroupedByIntent {
  const exclude = options?.excludeIds ?? new Set<string>();
  const grouped: GroupedByIntent = {
    analyses: [],
    enquetes: [],
    coulisses: [],
    interviews: [],
  };

  for (const item of contents) {
    if (exclude.has(item.id)) continue;
    const intent = intentForContentTags(item.tags ?? []);
    if (intent) grouped[intent].push(item);
  }

  return grouped;
}

export function intentDef(id: EditorialIntentId): EditorialIntentDef | undefined {
  return EDITORIAL_INTENTS.find((x) => x.id === id);
}

export function hasAnyEditorialContent(grouped: GroupedByIntent): boolean {
  return EDITORIAL_INTENTS.some((d) => grouped[d.id].length > 0);
}
