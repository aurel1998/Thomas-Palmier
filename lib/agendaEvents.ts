import type { PublicationStatus } from "./publicationStatus";

export type AgendaEvent = {
  id: string;
  title: string;
  description: string;
  /** ISO 8601 — date/heure de l'événement (colonne `date`). */
  date: string;
  location: string;
  status: PublicationStatus;
  is_featured?: boolean;
  reminder_enabled?: boolean;
  reminder_sent_at?: string | null;
  created_at?: string;
};

/** Données de secours si la base n'est pas encore accessible. */
export const AGENDA_EVENTS: AgendaEvent[] = [
  {
    id: "fallback-1",
    date: "2026-06-12T20:45:00",
    title: "Soirée Ligue 1 — débrief plateau",
    location: "RMC Sport",
    status: "published",
    is_featured: true,
    description:
      "Analyse en direct après les matchs : temps forts, polémiques et angles éditoriaux pour la semaine.",
  },
  {
    id: "fallback-2",
    date: "2026-06-18T18:00:00",
    title: "Reportage terrain — activation club",
    location: "Île-de-France",
    status: "published",
    description: "Immersion terrain : captation, interviews et contenus sociaux.",
  },
  {
    id: "fallback-3",
    date: "2026-06-22T12:30:00",
    title: "Live — mercato & coulisses",
    location: "En ligne",
    status: "published",
    description: "Échange en direct avec la communauté sur le mercato et les coulisses du métier.",
  },
  {
    id: "fallback-4",
    date: "2026-06-28T19:00:00",
    title: "Table ronde — récit sportif & médias",
    location: "Paris",
    status: "published",
    description: "Discussion sur les nouvelles formes de narration sportive.",
  },
  {
    id: "fallback-5",
    date: "2026-07-05T15:00:00",
    title: "Finale — couverture multi-formats",
    location: "Stade",
    status: "published",
    description: "Couverture complète : terrain, live social et débrief.",
  },
];

/** Événement publié actuellement mis en avant (un seul attendu en base). */
export function resolveFeaturedEvent(events: AgendaEvent[]): AgendaEvent | null {
  return events.find((e) => e.is_featured && e.status === "published") ?? null;
}

export function getUpcomingAgendaEvents(
  events: AgendaEvent[] = AGENDA_EVENTS,
  now: Date = new Date()
): AgendaEvent[] {
  const t = now.getTime();
  return [...events]
    .filter((e) => {
      const start = new Date(e.date).getTime();
      return !Number.isNaN(start) && start >= t - 12 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getAgendaEventsOnDay(events: AgendaEvent[], day: Date): AgendaEvent[] {
  return events
    .filter((e) => {
      const d = new Date(e.date);
      return !Number.isNaN(d.getTime()) && isSameCalendarDay(d, day);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function formatAgendaEventDisplay(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: "—", time: "—" };
  }
  const rawDate = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return {
    date: rawDate.charAt(0).toUpperCase() + rawDate.slice(1),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function getAgendaEventById(events: AgendaEvent[], id: string): AgendaEvent | undefined {
  return events.find((e) => e.id === id);
}

export function formatAgendaDateParts(iso: string): {
  day: string;
  month: string;
  time: string;
  weekday: string;
  dateLabel: string;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { day: "—", month: "", time: "", weekday: "", dateLabel: "—" };
  }
  const rawLabel = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return {
    day: d.toLocaleDateString("fr-FR", { day: "2-digit" }),
    month: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    weekday: d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
    dateLabel: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
  };
}
