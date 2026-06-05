import { revalidatePath, revalidateTag } from "next/cache";

export const EDITORIAL_CACHE_TAG = "editorial-bundle";

/** Invalide le cache profil / réglages / liens après mutation CMS. */
export function revalidateEditorialCaches(): void {
  revalidateTag(EDITORIAL_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/a-propos");
  revalidatePath("/collaborer");
  revalidatePath("/contact");
}
