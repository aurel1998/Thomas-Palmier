"use client";

import dynamic from "next/dynamic";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatAgendaDateParts,
  getAgendaEventById,
  getAgendaEventsOnDay,
  getUpcomingAgendaEvents,
  type AgendaEvent,
} from "../../lib/agendaEvents";
import {
  animateAgendaAsideReveal,
  animateAgendaScrollReveal,
  animateAgendaSectionParallax,
} from "../../lib/agendaCalendarMotion";
import { useAgendaEvents } from "../../lib/hooks/useAgendaEvents";
import { ensureScrollTrigger, isMotionLite, isReducedMotion } from "../../lib/gsapMotion";
import { AgendaEventModal } from "./AgendaEventModal";
import { FeaturedAgendaEventCard } from "./FeaturedAgendaEventCard";

const EditorialCalendar = dynamic(
  () => import("./EditorialCalendar").then((m) => ({ default: m.EditorialCalendar })),
  {
    ssr: false,
    loading: () => <div className="agenda-cal agenda-cal--loading" aria-busy="true" />,
  }
);

type AgendaSectionProps = {
  events?: AgendaEvent[];
  featuredEvent?: AgendaEvent | null;
};

function pickInitialDay(events: AgendaEvent[]): Date {
  const upcoming = getUpcomingAgendaEvents(events);
  if (upcoming[0]) return new Date(upcoming[0].date);
  return new Date();
}

function DayDetailCard({ event, onOpen }: { event: AgendaEvent; onOpen: (id: string) => void }) {
  const { time, weekday, dateLabel } = formatAgendaDateParts(event.date);

  return (
    <li className="home-agenda__detailItem" data-agenda-detail>
      <button
        type="button"
        className="home-agenda__detailCard home-agenda__detailCard--btn interactive"
        onClick={() => onOpen(event.id)}
      >
        <span className="home-agenda__detailRail" aria-hidden="true" />
        <div className="home-agenda__detailBody">
          <div className="home-agenda__detailMeta">
            <span className="home-agenda__detailTime">{time}</span>
            <span className="home-agenda__detailWeekday">{weekday}</span>
          </div>
          <h3 className="home-agenda__detailTitle">{event.title}</h3>
          {event.location ? <p className="home-agenda__detailLoc muted">{event.location}</p> : null}
          <span className="home-agenda__detailCta">Voir le détail</span>
        </div>
        <span className="home-agenda__detailDate muted">{dateLabel}</span>
      </button>
    </li>
  );
}

/**
 * Agenda éditorial : calendrier mensuel FullCalendar + panneau du jour + modale événement.
 * Intégré dans le récit homepage (espacement, parallax, transitions fluides).
 */
export function AgendaSection({
  events: initialEvents = [],
  featuredEvent = null,
}: AgendaSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const auraBackRef = useRef<HTMLDivElement | null>(null);
  const auraFrontRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  const headRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const { events, syncing } = useAgendaEvents({ initialEvents });
  const source = useMemo(() => {
    const valid = events.filter((e) => !Number.isNaN(new Date(e.date).getTime()));
    const upcoming = getUpcomingAgendaEvents(valid);
    return upcoming.length > 0 ? upcoming : valid;
  }, [events]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => pickInitialDay(source));
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<AgendaEvent | null>(null);

  const openEventModal = (eventId: string) => {
    const ev = getAgendaEventById(source, eventId);
    if (ev) setModalEvent(ev);
  };

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 720px)").matches) return;
    requestAnimationFrame(() => {
      asideRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  useEffect(() => {
    setSelectedDate(pickInitialDay(source));
  }, [source]);

  const dayEvents = useMemo(
    () => (selectedDate ? getAgendaEventsOnDay(source, selectedDate) : []),
    [source, selectedDate]
  );

  const nextHighlight = useMemo(() => {
    if (featuredEvent) return null;
    return getUpcomingAgendaEvents(source)[0] ?? null;
  }, [source, featuredEvent]);

  const selectedLabel = useMemo(() => {
    if (!selectedDate) return "";
    const raw = selectedDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [selectedDate]);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    if (isReducedMotion()) return;

    ensureScrollTrigger();

    const revealCtx = animateAgendaScrollReveal(root, {
      bridge: bridgeRef.current,
      head: headRef.current,
      shell: shellRef.current,
      aside: asideRef.current,
      reveals: [],
    });

    let parallaxCtx: gsap.Context | null = null;
    if (!isMotionLite()) {
      parallaxCtx = gsap.context(() => {
        animateAgendaSectionParallax(root, {
          auraBack: auraBackRef.current,
          auraFront: auraFrontRef.current,
          shell: shellRef.current,
          aside: asideRef.current,
          stage: stageRef.current,
        });
      }, root);
    }

    return () => {
      parallaxCtx?.revert();
      revealCtx.revert();
    };
  }, []);

  useEffect(() => {
    const aside = asideRef.current;
    if (!aside || isReducedMotion()) return;

    const items = Array.from(aside.querySelectorAll<HTMLElement>("[data-agenda-detail]"));
    animateAgendaAsideReveal(aside, items);
  }, [selectedDate, dayEvents, activeEventId]);

  return (
    <section
      ref={sectionRef}
      className="home-agenda"
      id="agenda"
      aria-labelledby="home-agenda-heading"
      aria-busy={syncing}
    >
      <div className="home-agenda__atmosphere" aria-hidden="true">
        <div ref={auraBackRef} className="home-agenda__aura home-agenda__aura--back" />
        <div ref={auraFrontRef} className="home-agenda__aura home-agenda__aura--front" />
      </div>

      <div className="container home-agenda__container">
        <div ref={bridgeRef} className="home-agenda__bridge">
          <span className="home-agenda__chapter">Chronologie</span>
          <span className="home-agenda__bridgeLine" aria-hidden="true" />
        </div>

        <header className="home-agenda__head" ref={headRef}>
          <div className="home-agenda__headCopy">
            <p className="home-sectionEyebrow">Agenda</p>
            <h2 id="home-agenda-heading" className="home-sectionTitle">
              Prochains <em>rendez-vous</em>
            </h2>
            {source.length > 0 ? (
              <p className="home-agenda__stat" aria-live="polite">
                <span className="home-agenda__statMark" aria-hidden="true" />
                {source.length} rendez-vous programmés
              </p>
            ) : null}
            {syncing ? (
              <p className="home-agenda__syncHint muted" aria-live="polite">
                Mise à jour de l&apos;agenda…
              </p>
            ) : null}
          </div>
          <div className="home-sectionRule" aria-hidden="true" />
        </header>

        {featuredEvent ? (
          <FeaturedAgendaEventCard
            event={featuredEvent}
            onOpen={openEventModal}
            className="home-agenda__featured"
          />
        ) : nextHighlight ? (
          <button
            type="button"
            className="home-agenda__spotlight interactive"
            onClick={() => openEventModal(nextHighlight.id)}
          >
            <span className="home-agenda__spotlightEyebrow">Prochain signal</span>
            <span className="home-agenda__spotlightTitle">{nextHighlight.title}</span>
            <span className="home-agenda__spotlightMeta muted">
              {formatAgendaDateParts(nextHighlight.date).dateLabel}
              {nextHighlight.location ? ` · ${nextHighlight.location}` : ""}
            </span>
          </button>
        ) : null}

        <div ref={stageRef} className="home-agenda__stage">
          <div className="home-agenda__shell" ref={shellRef}>
            <div className="home-agenda__shellAura" aria-hidden="true" />
            <div className="home-agenda__shellGrain" aria-hidden="true" />
            <div className="home-agenda__shellFrame" aria-hidden="true" />
            <EditorialCalendar
              events={source}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onEventActivate={setActiveEventId}
              onEventOpen={openEventModal}
            />
          </div>

          <aside
            id="home-agenda-day-panel"
            className="home-agenda__aside"
            ref={asideRef}
            aria-labelledby="home-agenda-day-heading"
          >
            <header className="home-agenda__asideHead">
              <p className="home-agenda__asideEyebrow">Édition du jour</p>
              <h3 id="home-agenda-day-heading" className="home-agenda__asideTitle">
                {selectedLabel || "—"}
              </h3>
              {dayEvents.length > 0 ? (
                <p className="home-agenda__asideCount muted">
                  {dayEvents.length} rendez-vous
                </p>
              ) : null}
            </header>

            {dayEvents.length ? (
              <ol className="home-agenda__detailList" role="list">
                {dayEvents.map((event) => (
                  <DayDetailCard key={event.id} event={event} onOpen={openEventModal} />
                ))}
              </ol>
            ) : (
              <p className="home-agenda__asideEmpty muted" data-agenda-detail>
                Aucun rendez-vous ce jour-là. Parcourez le mois pour explorer le parcours.
              </p>
            )}
          </aside>
        </div>
      </div>

      <AgendaEventModal
        open={modalEvent !== null}
        event={modalEvent}
        onClose={() => setModalEvent(null)}
      />
    </section>
  );
}
