import type { Content } from "../types/content";
import { FIXED_CATEGORY_IDS } from "./fixedCategories";

type DemoContentInput = Omit<Content, "status">;

function asPublished(items: DemoContentInput[]): Content[] {
  return items.map((item) => ({ ...item, status: "published" as const }));
}

/**
 * Catalogue démo — développement uniquement (`ENABLE_DEV_FALLBACKS` dans `lib/runtime.ts`).
 * En production, utiliser `npm run seed:catalog` ou publier via `/monsite`.
 */
const DEMO_CATALOG_RAW: DemoContentInput[] = [
  {
    id: "demo-wc-1",
    type: "article",
    title: "Le match raconté comme un long format web",
    content:
      "Un récit en chapitres : contexte, bascule tactique et séquences décisives. Pensé pour une lecture fluide sur écran.",
    image_url: "/src/joueurs/joueur9.webp",
    tags: ["Dossier"],
    category_id: FIXED_CATEGORY_IDS.webcontenus,
    is_featured: true,
    created_at: "2026-03-22T10:00:00.000Z",
  },
  {
    id: "demo-wc-2",
    type: "article",
    title: "Portrait : l’instant qui bascule la rencontre",
    content: "Focus sur un joueur, un geste, une décision — le sport vu comme récit éditorial.",
    image_url: "/src/stade/stade4.webp",
    tags: ["Portrait"],
    category_id: FIXED_CATEGORY_IDS.webcontenus,
    created_at: "2026-03-20T09:00:00.000Z",
  },
  {
    id: "demo-wc-3",
    type: "article",
    title: "Notes de terrain : ambiance et rythme du groupe",
    content: "Carnet de bord court, entre observation et analyse légère.",
    image_url: "/src/joueurs/joueur6.jpeg",
    tags: ["Terrain"],
    category_id: FIXED_CATEGORY_IDS.webcontenus,
    created_at: "2026-03-17T08:00:00.000Z",
  },
  {
    id: "demo-md-1",
    type: "video",
    title: "Lecture du tempo en pleine intensité",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    image_url: "/src/stade/stade4.webp",
    tags: ["Action"],
    category_id: FIXED_CATEGORY_IDS.media,
    created_at: "2026-03-19T11:00:00.000Z",
  },
  {
    id: "demo-md-2",
    type: "video",
    title: "Plongée immersive au cœur du stade",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    image_url: "/src/stade/stade1.webp",
    tags: ["Immersion"],
    category_id: FIXED_CATEGORY_IDS.media,
    created_at: "2026-03-16T10:30:00.000Z",
  },
  {
    id: "demo-md-3",
    type: "audio",
    title: "Chronique tribunes et émotion brute",
    content: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    image_url: "/src/stade/stade6.jpg",
    tags: ["Chronique"],
    category_id: FIXED_CATEGORY_IDS.media,
    created_at: "2026-03-14T09:45:00.000Z",
  },
  {
    id: "demo-an-1",
    type: "video",
    title: "Séquence animée : trajectoire et impact",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    image_url: "/src/stade/stade4.webp",
    tags: ["Motion"],
    category_id: FIXED_CATEGORY_IDS.animations,
    created_at: "2026-03-18T12:00:00.000Z",
  },
  {
    id: "demo-an-2",
    type: "video",
    title: "Boucle graphique : rythme d’un contre rapide",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    image_url: "/src/joueurs/joueur10.webp",
    tags: ["Loop"],
    category_id: FIXED_CATEGORY_IDS.animations,
    created_at: "2026-03-15T14:00:00.000Z",
  },
  {
    id: "demo-el-1",
    type: "article",
    title: "Carte éditoriale : chiffre clé du match",
    content: "Un module court, une statistique, une lecture immédiate.",
    image_url: "/src/stade/stade6.jpg",
    tags: ["Data"],
    category_id: FIXED_CATEGORY_IDS.elements,
    created_at: "2026-03-13T07:00:00.000Z",
  },
  {
    id: "demo-el-2",
    type: "audio",
    title: "Ambiance avant coup d’envoi",
    content: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    image_url: "/src/joueurs/joueur10.webp",
    tags: ["Ambiance"],
    category_id: FIXED_CATEGORY_IDS.elements,
    created_at: "2026-03-11T08:00:00.000Z",
  },
  {
    id: "demo-el-3",
    type: "article",
    title: "Citation du vestiaire",
    content: "Une phrase, un contexte — format minimal à fort impact.",
    image_url: "/src/joueurs/joueur9.webp",
    tags: ["Citation"],
    category_id: FIXED_CATEGORY_IDS.elements,
    created_at: "2026-03-09T06:00:00.000Z",
  },
];

export const DEMO_CATALOG = asPublished(DEMO_CATALOG_RAW);

/** Vidéo YouTube démo pour la bande « récentes » si aucune URL YouTube en base. */
const DEMO_YOUTUBE_RAW: DemoContentInput[] = [
  {
    id: "demo-yt-1",
    type: "video",
    title: "Récit sport — format broadcast",
    content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    image_url: "/src/stade/stade1.webp",
    tags: ["YouTube"],
    category_id: FIXED_CATEGORY_IDS.media,
    created_at: "2026-03-21T10:00:00.000Z",
  },
  {
    id: "demo-yt-2",
    type: "video",
    title: "Analyse en direct — séquence clé",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    image_url: "/src/stade/stade4.webp",
    tags: ["YouTube"],
    category_id: FIXED_CATEGORY_IDS.media,
    created_at: "2026-03-19T10:00:00.000Z",
  },
];

export const DEMO_YOUTUBE = asPublished(DEMO_YOUTUBE_RAW);

function sortByDate(items: Content[]): Content[] {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Fusionne les contenus API avec le catalogue démo (sans doublons d’id).
 * Si l’API est vide, retourne uniquement le démo.
 */
export function enrichCatalogContents(apiContents: Content[] | undefined | null): Content[] {
  const api = Array.isArray(apiContents) ? apiContents : [];
  const map = new Map<string, Content>();
  for (const item of api) map.set(item.id, item);
  for (const item of DEMO_CATALOG) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return sortByDate(Array.from(map.values()));
}

/** Contenu phare pour la feature story. */
export function pickFeaturedStory(contents: Content[]): Content | null {
  const sorted = sortByDate(contents);
  return sorted.find((c) => c.is_featured) ?? sorted[0] ?? null;
}

export function getDemoCatalog(): Content[] {
  return sortByDate([...DEMO_CATALOG]);
}
