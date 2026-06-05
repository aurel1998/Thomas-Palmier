import type { Category } from "../types/category";
import { mapCategoryRow } from "./dbMappers";
import { prisma } from "./prisma";
import { resolveCatalogCategories } from "./resolveCategories";

/**
 * Lit les categories depuis PostgreSQL (Prisma) cote serveur (RSC).
 * Retourne toujours les 4 catégories fixes (fusionnées avec la base si présente).
 */
export async function getAllCategoriesServer(): Promise<Category[]> {
  try {
    const data = await prisma.category.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
    return resolveCatalogCategories(data.map(mapCategoryRow));
  } catch {
    return resolveCatalogCategories([]);
  }
}
