import type { AgendaEvent } from "./agendaEvents";
import { mapAgendaRow } from "./dbMappers";
import { prisma } from "./prisma";

/** Charge l'événement mis en avant pour l'accueil (publié uniquement). */
export async function getFeaturedEventServer(): Promise<AgendaEvent | null> {
  try {
    const row = await prisma.event.findFirst({
      where: { isFeatured: true, status: "published" },
      orderBy: { updatedAt: "desc" },
    });
    return row ? mapAgendaRow(row) : null;
  } catch {
    return null;
  }
}

/** Un seul à l'affiche : retire le flag sur tous les autres événements. */
export async function unsetOtherFeaturedEvents(excludeId?: string): Promise<void> {
  await prisma.event.updateMany({
    where: {
      isFeatured: true,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    data: { isFeatured: false },
  });
}
