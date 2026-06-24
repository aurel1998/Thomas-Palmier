import type { Content } from "../../types/content";
import { attachCategoryIds, resolveCatalogCategories } from "../../lib/resolveCategories";
import { getCatalogContentsServer } from "../../lib/contentsServer";
import MesContenusCatalogClient from "./MesContenusCatalogClient";

const CATALOG_STATS_LIMIT = 64;

export default async function MesContenusPage() {
  let initialContents: Content[] = [];
  try {
    const raw = await getCatalogContentsServer(CATALOG_STATS_LIMIT);
    const categories = resolveCatalogCategories([]);
    initialContents = attachCategoryIds(raw, categories);
  } catch {
    initialContents = [];
  }

  return <MesContenusCatalogClient initialContents={initialContents} />;
}
