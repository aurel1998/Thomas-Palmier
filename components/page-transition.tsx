"use client";

import gsap from "gsap";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { prefersLightWebGL, prefersSaveData } from "../lib/clientPerf";
import { isReducedMotion, motion } from "../lib/gsapMotion";

  /**
   * Premier chargement : preloader + entrée. Ensuite, chaque changement de route
   * joue une entrée de contenu courte (fade + blur + translate) — signature fluide
   * sans rideau bloquant, pour que le menu reste réactif.
   */
  export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const preloaderRef = useRef<HTMLDivElement | null>(null);
  const isFirstRouteTransition = useRef(true);

  /** Premier chargement : preloader + entrée du contenu. */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const preloader = preloaderRef.current;
    if (!wrapper || !preloader) return;

    if (isReducedMotion() || prefersSaveData() || prefersLightWebGL()) {
      gsap.set(preloader, { autoAlpha: 0, pointerEvents: "none" });
      gsap.set(wrapper, { opacity: 1, y: 0, clearProps: "filter" });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: motion.ease.out } });
      const dLine = motion.duration.revealMed * 0.72;
      const dLabel = motion.duration.revealFast * 0.75;
      const dPre = motion.duration.reveal * 0.78;
      const dIn = motion.duration.route * 0.82 + motion.duration.revealFast * 0.38;

      tl.set(wrapper, { opacity: 0.52, y: 16, filter: "blur(2px)", scale: 0.997 })
        .fromTo(
          ".preloader__line",
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: dLine,
            ease: motion.ease.inOut,
            stagger: motion.duration.staggerTight,
          }
        )
        .to(
          ".preloader__label",
          { opacity: 1, y: 0, duration: dLabel, ease: motion.ease.outSoft },
          "-=0.38"
        )
        .to(preloader, {
          yPercent: -100,
          duration: dPre,
          ease: motion.ease.inOutStrong,
          delay: 0.03,
        })
        .to(
          wrapper,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scale: 1,
            duration: dIn,
            ease: motion.ease.outLux,
          },
          "-=0.52"
        );
    });

    return () => ctx.revert();
  }, []);

  /** Changements de route : entrée de contenu rapide (ou instantanée si reduced-motion). */
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const overlay = overlayRef.current;
    if (!wrapper || !overlay) return;

    if (isFirstRouteTransition.current) {
      isFirstRouteTransition.current = false;
      return;
    }

    gsap.killTweensOf([wrapper, overlay]);
    gsap.set(overlay, { autoAlpha: 0, yPercent: 100 });

    if (isReducedMotion() || prefersSaveData()) {
      gsap.set(wrapper, { opacity: 1, y: 0, scale: 1, filter: "none", clearProps: "filter" });
      return;
    }

    gsap.fromTo(
      wrapper,
      { opacity: 0.72, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: motion.duration.route * 0.85,
        ease: motion.ease.out,
        overwrite: "auto",
      }
    );

    // Remonte en haut de la nouvelle page (comportement attendu d'une navigation).
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <main className="page-transition">
      <div className="preloader" ref={preloaderRef} aria-hidden="true">
        <div className="preloader__center">
          <div className="preloader__lines">
            <span className="preloader__line" />
            <span className="preloader__line" />
          </div>
          <p className="preloader__label">THOMAS PALMIER</p>
        </div>
      </div>
      <div className="route-overlay route-overlay--page" ref={overlayRef} aria-hidden="true" />
      <div ref={wrapperRef} className="page-transition__content">
        {children}
      </div>
    </main>
  );
}
