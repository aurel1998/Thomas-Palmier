"use client";

import { useEffect } from "react";
import { isReducedMotion } from "../../lib/gsapMotion";

/**
 * Initialise Lenis (smooth scroll physique) et le branche sur le ticker GSAP
 * pour rester synchronisé avec ScrollTrigger. Rendu nul — effets uniquement.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isReducedMotion()) return;

    let rafId = 0;

    void import("lenis").then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.18,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.88,
        touchMultiplier: 1.8,
      });

      /* Synchronise ScrollTrigger avec Lenis */
      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        lenis.on("scroll", () => ScrollTrigger.update());
      });

      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      return () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
      };
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
