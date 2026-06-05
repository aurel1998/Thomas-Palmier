"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatAgendaEventDisplay, type AgendaEvent } from "../../lib/agendaEvents";
import { isReducedMotion, motion } from "../../lib/gsapMotion";

type AgendaEventModalProps = {
  open: boolean;
  event: AgendaEvent | null;
  onClose: () => void;
};

/**
 * Modale événement agenda : cinématique, minimaliste, thème site.
 */
export function AgendaEventModal({ open, event, onClose }: AgendaEventModalProps) {
  const [mounted, setMounted] = useState(false);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted || !event) return;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) return;

    const lines = panel.querySelectorAll<HTMLElement>("[data-agenda-modal-reveal]");

    if (open) {
      if (isReducedMotion()) {
        gsap.set(backdrop, { opacity: 1 });
        gsap.set(panel, { opacity: 1, scale: 1, y: 0 });
        gsap.set(lines, { opacity: 1, y: 0 });
        closeBtnRef.current?.focus({ preventScroll: true });
        return;
      }

      gsap.set(backdrop, { opacity: 0 });
      gsap.set(panel, { opacity: 0, scale: 0.9, y: 28, filter: "blur(8px)" });
      gsap.set(lines, { opacity: 0, y: 18 });

      const tl = gsap.timeline({
        onComplete: () => {
          closeBtnRef.current?.focus({ preventScroll: true });
        },
      });

      tl.to(backdrop, { opacity: 1, duration: motion.duration.revealFast, ease: motion.ease.outSoft })
        .to(
          panel,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            duration: motion.duration.revealMed,
            ease: motion.ease.outLux,
          },
          0.04
        )
        .to(
          lines,
          {
            opacity: 1,
            y: 0,
            duration: motion.duration.revealFast,
            ease: motion.ease.out,
            stagger: motion.duration.stagger,
          },
          0.12
        );

      return () => {
        tl.kill();
      };
    }

    if (isReducedMotion()) {
      setMounted(false);
      previousFocusRef.current?.focus?.({ preventScroll: true });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setMounted(false);
        previousFocusRef.current?.focus?.({ preventScroll: true });
      },
    });

    tl.to(lines, {
      opacity: 0,
      y: 10,
      duration: motion.duration.micro,
      ease: motion.ease.inOut,
      stagger: { each: 0.03, from: "end" },
    })
      .to(
        panel,
        {
          opacity: 0,
          scale: 0.94,
          y: 14,
          filter: "blur(6px)",
          duration: motion.duration.revealFast,
          ease: motion.ease.inOut,
        },
        0.02
      )
      .to(backdrop, { opacity: 0, duration: motion.duration.micro, ease: motion.ease.inOut }, 0.06);

    return () => {
      tl.kill();
    };
  }, [open, mounted, event]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleKey]);

  if (!mounted || !event) return null;

  const { date: dateLabel, time } = formatAgendaEventDisplay(event.date);
  const location = event.location?.trim() || "À confirmer";

  return createPortal(
    <div
      ref={backdropRef}
      className="agenda-event-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agenda-event-modal-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="agenda-event-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="agenda-event-modal__glow" aria-hidden="true" />

        <button
          ref={closeBtnRef}
          type="button"
          className="agenda-event-modal__close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <h2 id="agenda-event-modal-title" className="agenda-event-modal__title" data-agenda-modal-reveal>
          {event.title}
        </h2>

        <dl className="agenda-event-modal__meta">
          <div className="agenda-event-modal__metaRow" data-agenda-modal-reveal>
            <dt>Date</dt>
            <dd>{dateLabel}</dd>
          </div>
          <div className="agenda-event-modal__metaRow" data-agenda-modal-reveal>
            <dt>Heure</dt>
            <dd>{time}</dd>
          </div>
          <div className="agenda-event-modal__metaRow" data-agenda-modal-reveal>
            <dt>Lieu</dt>
            <dd>{location}</dd>
          </div>
        </dl>

        <p className="agenda-event-modal__description" data-agenda-modal-reveal>
          {event.description}
        </p>
      </div>
    </div>,
    document.body
  );
}
