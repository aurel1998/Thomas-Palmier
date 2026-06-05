"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { ensureScrollTrigger, isReducedMotion, motion } from "../lib/gsapMotion";
import { SITE_NAME } from "../lib/sitePublic";
import type { SocialLinkDto } from "../types/editorial";
import { SocialLinks } from "./SocialLinks";

type SiteFooterProps = {
  tagline?: string;
  socialLinks?: SocialLinkDto[];
};

export function SiteFooter({ tagline = "", socialLinks }: SiteFooterProps) {
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
          {tagline ? <span className="muted">{tagline}</span> : null}
          <span className="muted">© {new Date().getFullYear()} {SITE_NAME}</span>
        </div>
        <div className="site-footer__socialWrap">
          <SocialLinks links={socialLinks} />
        </div>
      </div>
    </footer>
  );
}
