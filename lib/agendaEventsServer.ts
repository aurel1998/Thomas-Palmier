import { unstable_cache } from "next/cache";
import { AGENDA_EVENTS, type AgendaEvent } from "./agendaEvents";
import { AGENDA_CACHE_TAG } from "./agendaCache";
import { mapAgendaRow } from "./dbMappers";
import { prisma } from "./prisma";
import { ENABLE_DEV_FALLBACKS } from "./runtime";

async function fetchAgendaEventsFromDb(): Promise<AgendaEvent[]> {
  try {
    const data = await prisma.event.findMany({
      where: { status: "published" },
      orderBy: [{ isFeatured: "desc" }, { date: "asc" }],
    });
    return data.map(mapAgendaRow);
  } catch {
    return ENABLE_DEV_FALLBACKS ? AGENDA_EVENTS : [];
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
