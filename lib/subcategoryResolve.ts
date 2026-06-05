import { prisma } from "./prisma";

/** Déduit la catégorie parente à partir d'une sous-catégorie. */
export async function categoryIdFromSubcategory(
  subcategoryId: string | null | undefined
): Promise<string | null> {
  if (!subcategoryId?.trim()) return null;
  try {
    const row = await prisma.subcategory.findUnique({
      where: { id: subcategoryId.trim() },
      select: { categoryId: true },
    });
    return row?.categoryId ?? null;
  } catch {
    return null;
  }
}
