"use client";

import {
  formatAgendaDateParts,
  formatAgendaEventDisplay,
  type AgendaEvent,
} from "../../lib/agendaEvents";

type FeaturedAgendaEventCardProps = {
  event: AgendaEvent;
  onOpen: (id: string) => void;
  className?: string;
};

function excerpt(text: string, max = 160): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

/**
 * Carte événement premium — mise en avant éditoriale (accueil + admin).
 */
export function FeaturedAgendaEventCard({
  event,
  onOpen,
  className = "",
}: FeaturedAgendaEventCardProps) {
  const { day, month, time, weekday } = formatAgendaDateParts(event.date);
  const { date: fullDate } = formatAgendaEventDisplay(event.date);
  const teaser = excerpt(event.description);

  const rootClass = `agenda-feature-card${className ? ` ${className}` : ""}`.trim();

  return (
    <article className={rootClass} data-agenda-featured>
      <div className="agenda-feature-card__glow" aria-hidden="true" />
      <div className="agenda-feature-card__frame" aria-hidden="true" />

      <button
        type="button"
        className="agenda-feature-card__inner interactive"
        onClick={() => onOpen(event.id)}
      >
        <div className="agenda-feature-card__dateBlock" aria-hidden="true">
          <span className="agenda-feature-card__day">{day}</span>
          <span className="agenda-feature-card__month">{month}</span>
        </div>

        <div className="agenda-feature-card__body">
          <div className="agenda-feature-card__meta">
            <span className="agenda-feature-card__badge">À l&apos;affiche</span>
            <span className="agenda-feature-card__time">
              {weekday} · {time}
            </span>
          </div>
          <h3 className="agenda-feature-card__title">{event.title}</h3>
          {event.location ? (
            <p className="agenda-feature-card__location">{event.location}</p>
          ) : null}
          {teaser ? <p className="agenda-feature-card__teaser muted">{teaser}</p> : null}
          <span className="agenda-feature-card__cta">Voir le détail</span>
        </div>

        <div className="agenda-feature-card__aside">
          <p className="agenda-feature-card__fullDate muted">{fullDate}</p>
        </div>
      </button>
    </article>
  );
}
