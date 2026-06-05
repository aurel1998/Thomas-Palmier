"use client";

import type { DateSelectArg, DatesSetArg, EventClickArg, EventContentArg, EventMountArg } from "@fullcalendar/core";
import frLocale from "@fullcalendar/core/locales/fr";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { isSameCalendarDay, type AgendaEvent } from "../../lib/agendaEvents";
import { agendaEventsToFullCalendar } from "../../lib/agendaFullCalendar";
import {
  animateAgendaDayPick,
  animateAgendaEventHover,
  animateAgendaEventOpen,
  animateAgendaMonthEnter,
  animateAgendaMonthExit,
  animateAgendaMonthLabel,
  getCalendarGridHarness,
  getEventInner,
  type MonthNavDirection,
} from "../../lib/agendaCalendarMotion";
import { attachAgendaMonthSwipe } from "../../lib/agendaTouchSwipe";
import { useMediaQuery } from "../../lib/hooks/useMediaQuery";
import { isReducedMotion } from "../../lib/gsapMotion";

export type EditorialCalendarProps = {
  events: AgendaEvent[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onEventActivate?: (eventId: string) => void;
  onEventOpen?: (eventId: string) => void;
};

function formatMonthLabel(date: Date): string {
  const raw = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function splitMonthLabel(label: string): { month: string; year: string } {
  const parts = label.trim().split(/\s+/);
  const year = parts.length > 1 ? (parts.pop() ?? "") : "";
  const month = parts.join(" ");
  return { month, year };
}

function NavChevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg className="agenda-cal__navIcon" viewBox="0 0 24 24" aria-hidden="true">
      {direction === "prev" ? (
        <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

function dayHasEvents(events: AgendaEvent[], date: Date): boolean {
  return events.some((e) => {
    const d = new Date(e.date);
    return !Number.isNaN(d.getTime()) && isSameCalendarDay(d, date);
  });
}

function renderEventContent(arg: EventContentArg) {
  const time = arg.timeText;
  const featured = Boolean(arg.event.extendedProps.isFeatured);

  return (
    <div
      className={`agenda-cal__evInner${featured ? " agenda-cal__evInner--featured" : ""}`}
      data-agenda-ev-inner
    >
      <span className="agenda-cal__evAccent" aria-hidden="true" />
      {featured ? <span className="agenda-cal__evFeaturedMark" aria-hidden="true">★</span> : null}
      {time ? <span className="agenda-cal__evTime">{time}</span> : null}
      <span className="agenda-cal__evTitle">{arg.event.title}</span>
    </div>
  );
}

/**
 * Calendrier mensuel FullCalendar — chrome éditorial + motion GSAP.
 */
export function EditorialCalendar({
  events,
  selectedDate,
  onSelectDate,
  onEventActivate,
  onEventOpen,
}: EditorialCalendarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fcGridRef = useRef<HTMLDivElement>(null);
  const monthLabelRef = useRef<HTMLParagraphElement>(null);
  const fcRef = useRef<FullCalendar>(null);
  const monthNavDir = useRef<MonthNavDirection>(0);
  const skipNextEnter = useRef(true);
  const monthBusy = useRef(false);

  const [monthLabel, setMonthLabel] = useState(() => formatMonthLabel(new Date()));
  const isTouchLayout = useMediaQuery("(max-width: 720px)");
  const fcEvents = agendaEventsToFullCalendar(events);

  const api = () => fcRef.current?.getApi();

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    const label = formatMonthLabel(arg.view.currentStart);
    setMonthLabel(label);

    const dir = monthNavDir.current;
    animateAgendaMonthLabel(monthLabelRef.current, dir);

    if (skipNextEnter.current) {
      skipNextEnter.current = false;
      monthNavDir.current = 0;
      monthBusy.current = false;
      return;
    }

    requestAnimationFrame(() => {
      animateAgendaMonthEnter(fcGridRef.current, dir);
      monthNavDir.current = 0;
      monthBusy.current = false;
    });
  }, []);

  const changeMonth = useCallback((direction: MonthNavDirection) => {
    if (monthBusy.current) return;
    const cal = api();
    if (!cal) return;

    if (isReducedMotion()) {
      direction > 0 ? cal.next() : cal.prev();
      return;
    }

    monthBusy.current = true;
    monthNavDir.current = direction;

    const harness = getCalendarGridHarness(fcGridRef.current);
    animateAgendaMonthExit(harness, direction, () => {
      direction > 0 ? cal.next() : cal.prev();
    });
  }, []);

  const goToday = useCallback(() => {
    if (monthBusy.current) return;
    const cal = api();
    if (!cal) return;

    const viewDate = cal.getDate();
    const today = new Date();
    const dir: MonthNavDirection =
      viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth()
        ? 0
        : viewDate > today
          ? -1
          : 1;

    if (isReducedMotion()) {
      cal.today();
      onSelectDate(today);
      return;
    }

    monthBusy.current = true;
    monthNavDir.current = dir;

    const harness = getCalendarGridHarness(fcGridRef.current);
    animateAgendaMonthExit(harness, dir || -1, () => {
      cal.today();
      onSelectDate(today);
    });
  }, [onSelectDate]);

  useEffect(() => {
    if (!isTouchLayout) return;
    return attachAgendaMonthSwipe(fcGridRef.current, {
      onSwipeLeft: () => changeMonth(1),
      onSwipeRight: () => changeMonth(-1),
    });
  }, [isTouchLayout, changeMonth]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || isReducedMotion() || isTouchLayout) return;

    const onOver = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-agenda-ev-inner]");
      if (!target || !root.contains(target)) return;
      animateAgendaEventHover(target, true);
    };

    const onOut = (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-agenda-ev-inner]");
      if (!target || !root.contains(target)) return;
      animateAgendaEventHover(target, false);
    };

    root.addEventListener("mouseover", onOver);
    root.addEventListener("mouseout", onOut);
    return () => {
      root.removeEventListener("mouseover", onOver);
      root.removeEventListener("mouseout", onOut);
    };
  }, [isTouchLayout]);

  const handleDateClick = useCallback(
    (info: { date: Date }) => {
      onSelectDate(info.date);
      requestAnimationFrame(() => animateAgendaDayPick(rootRef.current));
    },
    [onSelectDate]
  );

  const handleSelect = useCallback(
    (arg: DateSelectArg) => {
      onSelectDate(arg.start);
      arg.view.calendar.unselect();
    },
    [onSelectDate]
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      arg.jsEvent.preventDefault();

      const inner = getEventInner(arg.el);
      animateAgendaEventOpen(inner);

      const id = arg.event.id;
      if (id) {
        onEventActivate?.(id);
        onEventOpen?.(id);
      }
      if (arg.event.start) onSelectDate(arg.event.start);
    },
    [onSelectDate, onEventActivate, onEventOpen]
  );

  const handleEventMount = useCallback((arg: EventMountArg) => {
    if (isReducedMotion()) return;
    const inner = getEventInner(arg.el);
    if (!inner) return;
    gsap.set(inner, { transformOrigin: "50% 50%" });
  }, []);

  const dayCellClassNames = useCallback(
    (arg: { date: Date }) => {
      const classes: string[] = [];
      const today = new Date();
      if (
        arg.date.getFullYear() === today.getFullYear() &&
        arg.date.getMonth() === today.getMonth() &&
        arg.date.getDate() === today.getDate()
      ) {
        classes.push("agenda-cal__day--today");
      }
      if (
        selectedDate &&
        arg.date.getFullYear() === selectedDate.getFullYear() &&
        arg.date.getMonth() === selectedDate.getMonth() &&
        arg.date.getDate() === selectedDate.getDate()
      ) {
        classes.push("agenda-cal__day--picked");
      }
      if (dayHasEvents(events, arg.date)) {
        classes.push("agenda-cal__day--has-events");
      }
      return classes;
    },
    [selectedDate, events]
  );

  const { month: monthName, year: monthYear } = splitMonthLabel(monthLabel);
  const eventCount = events.length;

  return (
    <div
      className={`agenda-cal${isTouchLayout ? " agenda-cal--touch" : ""}`}
      ref={rootRef}
    >
      <div className="agenda-cal__toolbar">
        <div className="agenda-cal__monthBlock" aria-live="polite">
          <p className="agenda-cal__month" ref={monthLabelRef}>
            <span className="agenda-cal__monthName">{monthName}</span>
            {monthYear ? (
              <span className="agenda-cal__monthYear">{monthYear}</span>
            ) : null}
          </p>
          {!isTouchLayout && eventCount > 0 ? (
            <p className="agenda-cal__density">
              <span className="agenda-cal__densityDot" aria-hidden="true" />
              {eventCount} rendez-vous ce mois
            </p>
          ) : null}
        </div>
        <div className="agenda-cal__nav">
          <button
            type="button"
            className="agenda-cal__navBtn interactive"
            onClick={() => changeMonth(-1)}
            aria-label="Mois précédent"
          >
            <NavChevron direction="prev" />
          </button>
          <button type="button" className="agenda-cal__todayBtn interactive" onClick={goToday}>
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            className="agenda-cal__navBtn interactive"
            onClick={() => changeMonth(1)}
            aria-label="Mois suivant"
          >
            <NavChevron direction="next" />
          </button>
        </div>
      </div>
      {isTouchLayout ? (
        <p className="agenda-cal__swipeHint muted" aria-hidden="true">
          Glissez horizontalement pour changer de mois
        </p>
      ) : null}

      <div className="agenda-cal__fcRoot" ref={fcGridRef}>
        <FullCalendar
          ref={fcRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          locale={frLocale}
          initialDate={selectedDate ?? undefined}
          initialView="dayGridMonth"
          headerToolbar={false}
          fixedWeekCount={false}
          showNonCurrentDates
          firstDay={1}
          height="auto"
          events={fcEvents}
          selectable={!isTouchLayout}
          selectMirror={!isTouchLayout}
          unselectAuto
          dayMaxEvents={isTouchLayout ? 0 : 2}
          moreLinkClassNames="agenda-cal__more"
          moreLinkContent={(arg) => `+${arg.num}`}
          eventDisplay="block"
          displayEventTime
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayCellClassNames={dayCellClassNames}
          eventContent={renderEventContent}
          eventDidMount={handleEventMount}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          select={handleSelect}
          eventClick={handleEventClick}
        />
      </div>
    </div>
  );
}
