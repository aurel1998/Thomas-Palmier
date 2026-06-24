import type { Subcategory } from "../types/subcategory";
import { FIXED_CATEGORY_IDS } from "./fixedCategories";

export const DEMO_SUBCATEGORY_IDS = {
  radioChroniques: "c0000002-0001-4001-8001-000000000001",
  radioInterviews: "c0000002-0001-4001-8001-000000000002",
  tvReportages: "c0000002-0001-4001-8001-000000000003",
  tvPlateaux: "c0000002-0001-4001-8001-000000000004",
  presseArticles: "c0000002-0001-4001-8001-000000000005",
  presseEnquetes: "c0000002-0001-4001-8001-000000000006",
  reseauxReels: "c0000002-0001-4001-8001-000000000007",
  reseauxPosts: "c0000002-0001-4001-8001-000000000008",
} as const;

const DEMO_SUBCATEGORIES_RAW: Subcategory[] = [
  {
    id: DEMO_SUBCATEGORY_IDS.radioChroniques,
    category_id: FIXED_CATEGORY_IDS.radio,
    name: "Chroniques",
    description: "Récits et chroniques au micro.",
    position: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: DEMO_SUBCATEGORY_IDS.radioInterviews,
    category_id: FIXED_CATEGORY_IDS.radio,
    name: "Interviews",
    description: "Entretiens et portraits audio.",
    position: 2,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: DEMO_SUBCATEGORY_IDS.tvReportages,
    category_id: FIXED_CATEGORY_IDS.tv,
    name: "Reportages",
    description: "Sujets filmés et séquences terrain.",
    position: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: DEMO_SUBCATEGORY_IDS.tvPlateaux,
    category_id: FIXED_CATEGORY_IDS.tv,
    name: "Directs & plateaux",
    description: "Sets TV, lives et débriefs.",
    position: 2,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: DEMO_SUBCATEGORY_IDS.presseArticles,
    category_id: FIXED_CATEGORY_IDS.presse,
    name: "Articles",
    description: "Textes longs, portraits et analyses.",
    position: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: DEMO_SUBCATEGORY_IDS.presseEnquetes,
    category_id: FIXED_CATEGORY_IDS.presse,
    name: "Enquêtes",
    description: "Dossiers et investigations écrites.",
    position: 2,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: DEMO_SUBCATEGORY_IDS.reseauxReels,
    category_id: FIXED_CATEGORY_IDS.reseaux,
    name: "Reels & courts",
    description: "Formats verticaux et extraits dynamiques.",
    position: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: DEMO_SUBCATEGORY_IDS.reseauxPosts,
    category_id: FIXED_CATEGORY_IDS.reseaux,
    name: "Posts & stories",
    description: "Publications courtes et séries sociales.",
    position: 2,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

export function getDemoSubcategories(): Subcategory[] {
  return [...DEMO_SUBCATEGORIES_RAW];
}

/** Rubriques démo si la base n’en contient pas encore. */
export function withDemoSubcategoriesFallback(apiSubcategories: Subcategory[]): Subcategory[] {
  if (apiSubcategories.length > 0) return apiSubcategories;
  return getDemoSubcategories();
}
