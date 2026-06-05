"use client";

import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { useCallback, useRef, useState } from "react";
import { isSameCalendarDay, type AgendaEvent } from "../../lib/agendaEvents";
import { agendaEventsToFullCalendar } from "../../lib/agendaFullCalendar";

export type AdminAgendaCalendarProps = {
  events: AgendaEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: AgendaEvent) => void;
};

function formatMonthLabel(date: Date): string {
  const raw = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function renderEventContent(arg: EventContentArg) {
  const time = arg.timeText;
  const featured = Boolean(arg.event.extendedProps.isFeatured);
  return (
    <div className={`admin-agenda-cal__ev${featured ? " admin-agenda-cal__ev--featured" : ""}`}>
      {featured ? <span className="admin-agenda-cal__evStar" aria-hidden="true">★</span> : null}
      {time ? <span className="admin-agenda-cal__evTime">{time}</span> : null}
      <span className="admin-agenda-cal__evTitle">{arg.event.title}</span>
    </div>
  );
}

/**
 * Calendrier mensuel admin — clic jour / clic événement.
 */
export function AdminAgendaCalendar({ events, onDateClick, onEventClick }: AdminAgendaCalendarProps) {
  const fcRef = useRef<FullCalendar>(null);
  const [monthLabel, setMonthLabel] = useState(() => formatMonthLabel(new Date()));
  const fcEvents = agendaEventsToFullCalendar(events);
  const eventsById = new Map(events.map((e) => [e.id, e]));

  const handleDateClick = useCallback(
    (info: DateClickArg) => {
      onDateClick(info.date);
    },
    [onDateClick]
  );

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      info.jsEvent.preventDefault();
      const id = info.event.id;
      const found = id ? eventsById.get(id) : undefined;
      if (found) onEventClick(found);
    },
    [eventsById, onEventClick]
  );

  const dayCellClassNames = useCallback(
    (arg: { date: Date }) => {
      const hasEvents = events.some((e) => {
        const d = new Date(e.date);
        return !Number.isNaN(d.getTime()) && isSameCalendarDay(d, arg.date);
      });
      return hasEvents ? ["admin-agenda-cal__day--busy"] : [];
    },
    [events]
  );

  return (
    <div className="admin-agenda-cal">
      <div className="admin-agenda-cal__toolbar">
        <div className="admin-agenda-cal__nav">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => fcRef.current?.getApi().prev()}
            aria-label="Mois précédent"
          >
            ←
          </button>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => fcRef.current?.getApi().today()}>
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => fcRef.current?.getApi().next()}
            aria-label="Mois suivant"
          >
            →
          </button>
        </div>
        <p className="admin-agenda-cal__month">{monthLabel}</p>
      </div>

      <p className="admin-field__hint admin-agenda-cal__hint">
        Clique sur un <strong>jour</strong> pour ajouter un rendez-vous, ou sur un <strong>événement</strong> pour le
        modifier.
      </p>

      <div className="admin-agenda-cal__grid">
        <FullCalendar
          ref={fcRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          locale={frLocale}
          initialView="dayGridMonth"
          headerToolbar={false}
          fixedWeekCount={false}
          showNonCurrentDates
          firstDay={1}
          height="auto"
          events={fcEvents}
          eventDisplay="block"
          displayEventTime
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayMaxEvents={3}
          moreLinkContent={(arg) => `+${arg.num}`}
          eventContent={renderEventContent}
          dayCellClassNames={dayCellClassNames}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          datesSet={(arg) => setMonthLabel(formatMonthLabel(arg.view.currentStart))}
        />
      </div>
    </div>
  );
}
