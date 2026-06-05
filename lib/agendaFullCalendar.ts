import type { EventInput } from "@fullcalendar/core";
import type { AgendaEvent } from "./agendaEvents";

const DEFAULT_DURATION_HOURS = 2;

function defaultEndIso(dateIso: string): string {
  const end = new Date(dateIso);
  if (Number.isNaN(end.getTime())) return dateIso;
  end.setHours(end.getHours() + DEFAULT_DURATION_HOURS);
  return end.toISOString();
}

/** Convertit les événements au format FullCalendar. */
export function agendaEventsToFullCalendar(events: AgendaEvent[]): EventInput[] {
  return events
    .filter((e) => !Number.isNaN(new Date(e.date).getTime()))
    .map((e) => ({
      id: e.id,
      title: e.title,
      start: e.date,
      end: defaultEndIso(e.date),
      classNames: [
        "agenda-cal__ev",
        ...(e.status === "draft" ? ["agenda-cal__ev--draft"] : []),
        ...(e.is_featured ? ["agenda-cal__ev--featured"] : []),
      ],
      extendedProps: {
        location: e.location ?? "",
        description: e.description,
        status: e.status,
        isFeatured: Boolean(e.is_featured),
      },
    }));
}
