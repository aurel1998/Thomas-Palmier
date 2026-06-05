import gsap from "gsap";
import { ensureScrollTrigger, isMotionLite, isReducedMotion, motion } from "./gsapMotion";

export type AgendaParallaxTargets = {
  auraBack: HTMLElement | null;
  auraFront: HTMLElement | null;
  shell: HTMLElement | null;
  aside: HTMLElement | null;
  stage: HTMLElement | null;
};

export type MonthNavDirection = -1 | 0 | 1;

export function getEventInner(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  return el.querySelector<HTMLElement>(".agenda-cal__evInner");
}

export function getCalendarGridHarness(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null;
  return root.querySelector<HTMLElement>(".fc-view-harness");
}

/** Entrée du libellé de mois (navigation). */
export function animateAgendaMonthLabel(labelEl: HTMLElement | null, direction: MonthNavDirection): void {
  if (!labelEl || isReducedMotion()) return;
  gsap.fromTo(
    labelEl,
    { autoAlpha: 0, y: direction === 0 ? 8 : direction * -10 },
    {
      autoAlpha: 1,
      y: 0,
      duration: motion.duration.revealFast,
      ease: motion.ease.out,
      overwrite: "auto",
    }
  );
}

/** Sortie de la grille avant changement de mois. */
export function animateAgendaMonthExit(
  harness: HTMLElement | null,
  direction: MonthNavDirection,
  onDone: () => void
): void {
  if (!harness || isReducedMotion()) {
    onDone();
    return;
  }
  gsap.to(harness, {
    x: direction * -22,
    autoAlpha: 0,
    filter: "blur(6px)",
    duration: motion.duration.revealFast,
    ease: motion.ease.inOut,
    overwrite: "auto",
    onComplete: onDone,
  });
}

/** Entrée de la grille + léger stagger des jours. */
export function animateAgendaMonthEnter(
  root: HTMLElement | null,
  direction: MonthNavDirection,
  skipStagger = false
): void {
  if (!root || isReducedMotion()) return;

  const harness = getCalendarGridHarness(root);
  if (harness) {
    gsap.fromTo(
      harness,
      { x: direction * 22, autoAlpha: 0, filter: "blur(8px)" },
      {
        x: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: motion.duration.revealMed,
        ease: motion.ease.outLux,
        overwrite: "auto",
      }
    );
  }

  if (skipStagger || isMotionLite()) return;

  const days = root.querySelectorAll<HTMLElement>(".fc-daygrid-day");
  if (!days.length) return;

  gsap.fromTo(
    days,
    { autoAlpha: 0, y: 10 },
    {
      autoAlpha: 1,
      y: 0,
      duration: motion.duration.revealFast,
      ease: motion.ease.outSoft,
      stagger: { amount: 0.32, from: direction >= 0 ? "start" : "end" },
      overwrite: "auto",
      delay: 0.04,
    }
  );
}

/** Hover événement calendrier (discret, maîtrisé). */
export function animateAgendaEventHover(inner: HTMLElement | null, entering: boolean): void {
  if (!inner || isReducedMotion()) return;
  gsap.to(inner, {
    y: entering ? -2 : 0,
    scale: entering ? 1.02 : 1,
    duration: motion.duration.uiSnap,
    ease: motion.ease.outSoft,
    overwrite: "auto",
  });
}

/** Pulse élégant sur la cellule sélectionnée. */
export function animateAgendaDayPick(root: HTMLElement | null): void {
  if (!root || isReducedMotion()) return;
  const frame = root.querySelector<HTMLElement>(".agenda-cal__day--picked .fc-daygrid-day-frame");
  if (!frame) return;
  gsap.fromTo(
    frame,
    { scale: 0.96 },
    {
      scale: 1,
      duration: motion.duration.revealMed,
      ease: motion.ease.outLux,
      overwrite: "auto",
    }
  );
}

/** Pulse à l’ouverture / sélection d’un événement. */
export function animateAgendaEventOpen(inner: HTMLElement | null): gsap.core.Tween | null {
  if (!inner || isReducedMotion()) return null;
  return gsap.fromTo(
    inner,
    { scale: 1 },
    {
      scale: 1.05,
      duration: motion.duration.uiPress,
      ease: motion.ease.out,
      yoyo: true,
      repeat: 1,
      overwrite: "auto",
    }
  );
}

/** Panneau latéral : titre + cartes du jour (transition douce au changement de date). */
export function animateAgendaAsideReveal(
  aside: HTMLElement | null,
  items: HTMLElement[]
): void {
  if (!aside || isReducedMotion()) return;

  const head = aside.querySelector<HTMLElement>(".home-agenda__asideHead");

  gsap.fromTo(
    aside,
    { autoAlpha: 0.88 },
    {
      autoAlpha: 1,
      duration: motion.duration.sectionParallax,
      ease: motion.ease.inOut,
      overwrite: "auto",
    }
  );

  if (head) {
    gsap.fromTo(
      head,
      { autoAlpha: 0, y: 10 },
      {
        autoAlpha: 1,
        y: 0,
        duration: motion.duration.revealFast,
        ease: motion.ease.outSoft,
        overwrite: "auto",
      }
    );
  }

  if (!items.length) return;

  gsap.fromTo(
    items,
    { autoAlpha: 0, y: 16, scale: 0.985 },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: motion.duration.revealMed,
      ease: motion.ease.outSoft,
      stagger: motion.duration.staggerTight,
      overwrite: "auto",
      delay: 0.06,
    }
  );
}

/** Parallax léger : halos atmosphériques + calendrier / panneau latéral. */
export function animateAgendaSectionParallax(
  section: HTMLElement,
  targets: AgendaParallaxTargets
): gsap.core.Tween[] {
  if (isReducedMotion()) return [];

  ensureScrollTrigger();

  const tweens: gsap.core.Tween[] = [];
  const base = {
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    scrub: motion.parallax.scrubSmooth,
  };

  if (targets.auraBack) {
    tweens.push(
      gsap.fromTo(
        targets.auraBack,
        { yPercent: -motion.parallax.yPercent * 0.42, scale: 1.08 },
        {
          yPercent: motion.parallax.yPercent * 0.38,
          scale: 1,
          ease: motion.ease.none,
          immediateRender: false,
          scrollTrigger: base,
        }
      )
    );
  }

  if (targets.auraFront) {
    tweens.push(
      gsap.fromTo(
        targets.auraFront,
        { yPercent: motion.parallax.yPercent * 0.28, xPercent: 4 },
        {
          yPercent: -motion.parallax.yPercent * 0.32,
          xPercent: -3,
          ease: motion.ease.none,
          immediateRender: false,
          scrollTrigger: base,
        }
      )
    );
  }

  if (targets.shell) {
    tweens.push(
      gsap.fromTo(
        targets.shell,
        { yPercent: motion.parallax.yPercent * 0.12 },
        {
          yPercent: -motion.parallax.yPercent * 0.1,
          ease: motion.ease.none,
          immediateRender: false,
          scrollTrigger: base,
        }
      )
    );
  }

  if (targets.aside) {
    tweens.push(
      gsap.fromTo(
        targets.aside,
        { yPercent: motion.parallax.yPercent * 0.18 },
        {
          yPercent: -motion.parallax.yPercent * 0.14,
          ease: motion.ease.none,
          immediateRender: false,
          scrollTrigger: { ...base, scrub: motion.parallax.scrub },
        }
      )
    );
  }

  return tweens;
}

/** Reveal scroll : pont narratif + titre + scène calendrier. */
export function animateAgendaScrollReveal(
  section: HTMLElement,
  targets: {
    shell: Element | null;
    aside: Element | null;
    head: Element | null;
    bridge: Element | null;
    reveals: HTMLElement[];
  }
): gsap.Context {
  const all = [
    targets.shell,
    targets.aside,
    targets.head,
    targets.bridge,
    ...targets.reveals,
  ].filter(Boolean);

  if (isReducedMotion()) {
    gsap.set(all, { clearProps: "all" });
    return gsap.context(() => {});
  }

  ensureScrollTrigger();

  return gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: motion.scroll.startRevealTight,
        toggleActions: motion.scroll.toggleOnce,
      },
    });

    if (targets.bridge) {
      tl.fromTo(
        targets.bridge,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: motion.duration.revealFast, ease: motion.ease.outSoft },
        0
      );
    }

    if (targets.reveals.length) {
      tl.fromTo(
        targets.reveals,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: motion.duration.revealMed,
          ease: motion.ease.out,
          stagger: motion.duration.staggerTight,
        },
        targets.bridge ? 0.06 : 0
      );
    }

    if (targets.head) {
      tl.fromTo(
        targets.head,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: motion.duration.revealFast, ease: motion.ease.out },
        0.1
      );
    }

    if (targets.shell) {
      tl.fromTo(
        targets.shell,
        { autoAlpha: 0, y: 48, scale: 0.982 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: motion.duration.reveal,
          ease: motion.ease.outLux,
        },
        0.14
      );
    }

    if (targets.aside) {
      tl.fromTo(
        targets.aside,
        { autoAlpha: 0, x: 32 },
        { autoAlpha: 1, x: 0, duration: motion.duration.revealMed, ease: motion.ease.out },
        0.22
      );
    }
  }, section);
}
