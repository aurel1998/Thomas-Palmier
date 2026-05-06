"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { ensureScrollTrigger, isReducedMotion, motion } from "../lib/gsapMotion";
import { SocialLinks } from "./SocialLinks";

export function SiteFooter() {
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    if (isReducedMotion()) return;

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: motion.duration.revealMed,
          ease: motion.ease.out,
          scrollTrigger: {
            trigger: el,
            start: motion.scroll.startReveal,
            toggleActions: motion.scroll.togglePlay,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <footer className="site-footer" ref={footerRef}>
      <div className="container site-footer__inner">
        <div className="site-footer__meta">
          <span className="muted">Journaliste sportif freelance - analyse, reportage, formats courts</span>
          <span className="muted">© {new Date().getFullYear()} Sport Journal</span>
        </div>
        <div className="site-footer__socialWrap">
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
