import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersSaveData } from "./clientPerf";

let scrollTriggerReady = false;

/** Enregistre ScrollTrigger une seule fois (côté client). */
export function ensureScrollTrigger(): void {
  if (typeof window === "undefined" || scrollTriggerReady) return;
  gsap.registerPlugin(ScrollTrigger);
  scrollTriggerReady = true;
  ScrollTrigger.config({
    limitCallbacks: true,
    ignoreMobileResize: true,
  });
}

/** Timings & courbes : fluides, cohérents site-wide (feel « showcase »). */
export const motion = {
  ease: {
    out: "power3.out",
    outSoft: "power2.out",
    outCrisp: "power4.out",
    outExpo: "expo.out",
    /** Entrées héro / rideaux : décélération longue et mémorable */
    outLux: "power4.out",
    inOut: "power3.inOut",
    inOutExpo: "expo.inOut",
    inOutStrong: "power4.inOut",
    none: "none",
  },
  duration: {
    reveal: 0.92,
    revealMed: 0.72,
    revealFast: 0.52,
    /** Signatures "storytelling premium" */
    heroMedia: 1.14,
    heroChars: 0.6,
    heroStagger: 0.021,
    sectionParallax: 0.86,
    /** Indicateur nav / micro-mouvements UI */
    route: 0.52,
    /** Changement de page : très court — le menu doit réagir vite (overlay léger) */
    routeNav: 0.14,
    micro: 0.28,
    /** UI ponctuelle : magnetic, press, hovers « vivants » */
    uiSnap: 0.2,
    uiPress: 0.12,
    stagger: 0.082,
    staggerTight: 0.058,
  },
  scroll: {
    startReveal: "top 88%",
    startRevealTight: "top 84%",
    startCards: "top 80%",
    /** Entrée douce, retour discret au scroll vers le haut. */
    togglePlay: "play none none reverse" as const,
    /** Une seule lecture (listing / sections dynamiques). */
    toggleOnce: "play none none none" as const,
  },
  parallax: {
    /** Compromis scroll fluide / coût GPU */
    scrub: 1.35,
    scrubSmooth: 1.56,
    yPercent: 7,
  },
} as const;

export function isReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMotionLite(): boolean {
  if (typeof window === "undefined") return false;
  if (isReducedMotion()) return true;
  if (prefersSaveData()) return true;
  if (window.matchMedia("(max-width: 920px)").matches) return true;
  return false;
}

export const motionPresets = {
  hero: {
    reveal: motion.duration.heroMedia,
    text: motion.duration.heroChars,
  },
  chapter: {
    reveal: motion.duration.revealMed,
    stagger: motion.duration.stagger,
  },
  route: {
    fast: motion.duration.routeNav,
    smooth: motion.duration.route,
  },
  ui: {
    snap: motion.duration.uiSnap,
    press: motion.duration.uiPress,
  },
} as const;

type ScrollRevealOpts = {
  y?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  start?: string;
  toggleActions?: typeof motion.scroll.togglePlay | typeof motion.scroll.toggleOnce | string;
};

/**
 * Scroll reveal : fade + translateY, easing power3.
 * Retourne `null` si reduced-motion ou pas de trigger.
 */
export function scrollRevealFadeUp(
  targets: gsap.TweenTarget,
  trigger: gsap.DOMTarget | null | undefined,
  opts?: ScrollRevealOpts
): gsap.core.Tween | null {
  if (isReducedMotion() || !trigger) return null;
  ensureScrollTrigger();
  return gsap.fromTo(
    targets,
    { autoAlpha: 0, y: opts?.y ?? 40 },
    {
      autoAlpha: 1,
      y: 0,
      duration: opts?.duration ?? motion.duration.reveal,
      ease: motion.ease.out,
      stagger: opts?.stagger,
      delay: opts?.delay,
      overwrite: "auto",
      scrollTrigger: {
        trigger: trigger as Element,
        start: opts?.start ?? motion.scroll.startReveal,
        toggleActions: (opts?.toggleActions ?? motion.scroll.togglePlay) as string,
      },
    }
  );
}

/** Parallax vertical (yPercent) sur une image ou un bloc média. */
export function bindParallaxYPercent(
  target: Element | null,
  trigger: Element | null,
  yPercent: number = motion.parallax.yPercent
): ScrollTrigger | null {
  if (isReducedMotion() || !target || !trigger) return null;
  ensureScrollTrigger();
  const tw = gsap.fromTo(
    target,
    { yPercent: -yPercent },
    {
      yPercent,
      ease: motion.ease.none,
      overwrite: "auto",
      scrollTrigger: {
        trigger,
        start: "top bottom",
        end: "bottom top",
        scrub: motion.parallax.scrubSmooth,
      },
    }
  );
  return tw.scrollTrigger ?? null;
}
