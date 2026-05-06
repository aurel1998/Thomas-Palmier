import type { Content } from "../types/content";

export type EditorialSeriesId = "coulisses" | "analyse-tactique" | "portraits";

export type EditorialSeriesDef = {
  id: EditorialSeriesId;
  title: string;
  lede: string;
  patterns: string[];
};

export const EDITORIAL_SERIES: readonly EditorialSeriesDef[] = [
  {
    id: "coulisses",
    title: "Dans les coulisses",
    lede: "Immersions, vestiaires et récits de terrain.",
    patterns: ["coulisse", "vestiaire", "immersion", "reportage", "ambiance", "terrain"],
  },
  {
    id: "analyse-tactique",
    title: "Analyse tactique",
    lede: "Décryptages, schémas de jeu et lectures collectives.",
    patterns: ["analyse", "tactique", "decryptage", "décryptage", "strategie", "stratégie"],
  },
  {
    id: "portraits",
    title: "Portraits",
    lede: "Parcours, voix et entretiens des acteurs du sport.",
    patterns: ["portrait", "interview", "entretien", "temoignage", "témoignage", "voix"],
  },
] as const;

function normalize(v: string): string {
  return v
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function matches(text: string, patterns: readonly string[]): boolean {
  const n = normalize(text);
  return patterns.some((p) => n.includes(normalize(p)));
}

export type GroupedSeries = Record<EditorialSeriesId, Content[]>;

/** Un contenu peut apparaître dans plusieurs séries (logique collection). */
export function groupByEditorialSeries(contents: Content[]): GroupedSeries {
  const grouped: GroupedSeries = {
    coulisses: [],
    "analyse-tactique": [],
    portraits: [],
  };

  for (const item of contents) {
    const blob = `${item.title} ${(item.tags ?? []).join(" ")} ${item.content}`;
    for (const serie of EDITORIAL_SERIES) {
      if (matches(blob, serie.patterns)) grouped[serie.id].push(item);
    }
  }

  return grouped;
}
