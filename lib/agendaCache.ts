import { revalidatePath, revalidateTag } from "next/cache";

/** Tag Next.js pour invalider le cache serveur de l'agenda. */
export const AGENDA_CACHE_TAG = "agenda-events";

/** Invalide le cache homepage + données agenda après mutation admin. */
export function revalidateAgendaCaches(): void {
  revalidateTag(AGENDA_CACHE_TAG);
  revalidatePath("/");
}
