import { unstable_cache } from "next/cache";
import { AGENDA_EVENTS, type AgendaEvent } from "./agendaEvents";
import { AGENDA_CACHE_TAG } from "./agendaCache";
import { mapAgendaRow } from "./dbMappers";
import { prisma } from "./prisma";

async function fetchAgendaEventsFromDb(): Promise<AgendaEvent[]> {
  try {
    const data = await prisma.event.findMany({
      where: { status: "published" },
      orderBy: [{ isFeatured: "desc" }, { date: "asc" }],
    });
    const mapped = data.map(mapAgendaRow);
    return mapped.length > 0 ? mapped : AGENDA_EVENTS;
  } catch {
    return AGENDA_EVENTS;
  }
}

/**
 * Lit les événements depuis PostgreSQL (`events` via Prisma), avec cache taggé.
 * Invalidé via `revalidateAgendaCaches()` après mutation admin.
 */
export async function getAgendaEventsServer(): Promise<AgendaEvent[]> {
  return unstable_cache(fetchAgendaEventsFromDb, ["agenda-events-list"], {
    tags: [AGENDA_CACHE_TAG],
    revalidate: 30,
  })();
}
