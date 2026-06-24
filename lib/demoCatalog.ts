import type { Content } from "../types/content";
import { FIXED_CATEGORY_IDS } from "./fixedCategories";
import { DEMO_SUBCATEGORY_IDS } from "./demoSubcategories";

type DemoContentInput = Omit<Content, "status">;

function asPublished(items: DemoContentInput[]): Content[] {
  return items.map((item) => ({ ...item, status: "published" as const }));
}

/**
 * Catalogue démo — affiché quand aucun contenu publié n'est en base.
 * Images : `/public/src/stade/im1.jpg` … `im5.jpg`.
 */
const DEMO_CATALOG_RAW: DemoContentInput[] = [
  {
    id: "demo-pr-1",
    type: "article",
    title: "Dans les travées : le match vu depuis les tribunes",
    content:
      "Un récit en chapitres : ambiance, bascule tactique et séquences décisives. Pensé pour une lecture fluide sur écran.",
    image_url: "/src/stade/im1.jpg",
    tags: ["Dossier", "Terrain"],
    category_id: FIXED_CATEGORY_IDS.presse,
    subcategory_id: DEMO_SUBCATEGORY_IDS.presseArticles,
    is_featured: true,
    created_at: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "demo-pr-2",
    type: "article",
    title: "Portrait : l'instant qui bascule la rencontre",
    content: "Focus sur un joueur, un geste, une décision — le sport vu comme récit éditorial.",
    image_url: "/src/stade/im2.jpg",
    tags: ["Portrait"],
    category_id: FIXED_CATEGORY_IDS.presse,
    subcategory_id: DEMO_SUBCATEGORY_IDS.presseArticles,
    created_at: "2026-05-28T09:00:00.000Z",
  },
  {
    id: "demo-pr-3",
    type: "article",
    title: "Notes de terrain : ambiance et rythme du groupe",
    content: "Carnet de bord court, entre observation et analyse légère.",
    image_url: "/src/stade/im3.jpg",
    tags: ["Terrain"],
    category_id: FIXED_CATEGORY_IDS.presse,
    subcategory_id: DEMO_SUBCATEGORY_IDS.presseEnquetes,
    created_at: "2026-05-25T08:00:00.000Z",
  },
  {
    id: "demo-tv-1",
    type: "video",
    title: "Plongée immersive au cœur du stade",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    image_url: "/src/stade/im4.jpg",
    tags: ["Immersion"],
    category_id: FIXED_CATEGORY_IDS.tv,
    subcategory_id: DEMO_SUBCATEGORY_IDS.tvReportages,
    created_at: "2026-05-27T11:00:00.000Z",
  },
  {
    id: "demo-tv-2",
    type: "video",
    title: "Lecture du tempo en pleine intensité",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    image_url: "/src/stade/im5.jpg",
    tags: ["Action"],
    category_id: FIXED_CATEGORY_IDS.tv,
    subcategory_id: DEMO_SUBCATEGORY_IDS.tvPlateaux,
    created_at: "2026-05-24T10:30:00.000Z",
  },
  {
    id: "demo-ra-1",
    type: "audio",
    title: "Chronique tribunes et émotion brute",
    content: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    image_url: "/src/stade/stade1.webp",
    tags: ["Chronique"],
    category_id: FIXED_CATEGORY_IDS.radio,
    subcategory_id: DEMO_SUBCATEGORY_IDS.radioChroniques,
    created_at: "2026-05-22T09:45:00.000Z",
  },
  {
    id: "demo-rs-1",
    type: "video",
    title: "Séquence animée : trajectoire et impact",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    image_url: "/src/joueurs/joueur10.webp",
    tags: ["Motion", "Reel"],
    category_id: FIXED_CATEGORY_IDS.reseaux,
    subcategory_id: DEMO_SUBCATEGORY_IDS.reseauxReels,
    created_at: "2026-05-26T12:00:00.000Z",
  },
  {
    id: "demo-rs-2",
    type: "video",
    title: "Boucle graphique : rythme d'un contre rapide",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    image_url: "/src/stade/im3.jpg",
    tags: ["Loop", "Social"],
    category_id: FIXED_CATEGORY_IDS.reseaux,
    subcategory_id: DEMO_SUBCATEGORY_IDS.reseauxReels,
    created_at: "2026-05-23T14:00:00.000Z",
  },
  {
    id: "demo-rs-3",
    type: "article",
    title: "Carte éditoriale : chiffre clé du match",
    content: "Un module court, une statistique, une lecture immédiate.",
    image_url: "/src/stade/im5.jpg",
    tags: ["Data", "Social"],
    category_id: FIXED_CATEGORY_IDS.reseaux,
    subcategory_id: DEMO_SUBCATEGORY_IDS.reseauxPosts,
    created_at: "2026-05-21T07:00:00.000Z",
  },
  {
    id: "demo-ra-2",
    type: "audio",
    title: "Ambiance avant coup d'envoi",
    content: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    image_url: "/src/stade/im1.jpg",
    tags: ["Ambiance"],
    category_id: FIXED_CATEGORY_IDS.radio,
    subcategory_id: DEMO_SUBCATEGORY_IDS.radioInterviews,
    created_at: "2026-05-19T08:00:00.000Z",
  },
  {
    id: "demo-rs-4",
    type: "article",
    title: "Citation du vestiaire",
    content: "Une phrase, un contexte — format minimal à fort impact.",
    image_url: "/src/joueurs/joueur9.webp",
    tags: ["Citation", "Story"],
    category_id: FIXED_CATEGORY_IDS.reseaux,
    subcategory_id: DEMO_SUBCATEGORY_IDS.reseauxPosts,
    created_at: "2026-05-17T06:00:00.000Z",
  },
];

export const DEMO_CATALOG = asPublished(DEMO_CATALOG_RAW);

function sortByDate(items: Content[]): Content[] {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** Contenu phare pour la feature story. */
export function pickFeaturedStory(contents: Content[]): Content | null {
  const sorted = sortByDate(contents);
  return sorted.find((c) => c.is_featured) ?? sorted[0] ?? null;
}

export function getDemoCatalog(): Content[] {
  return sortByDate([...DEMO_CATALOG]);
}

/** Catalogue démo si la base est vide. */
export function withDemoCatalogFallback(
  apiContents: Content[],
  opts?: { subcategoryId?: string | null; siteUsesDemo?: boolean }
): Content[] {
  if (apiContents.length > 0) return apiContents;
  if (!opts?.siteUsesDemo) return [];

  const demo = getDemoCatalog();
  if (opts?.subcategoryId) {
    return demo.filter((item) => item.subcategory_id === opts.subcategoryId);
  }
  return demo;
}
