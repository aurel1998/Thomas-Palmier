"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const CHAPTERS = [
  { id: "acte-manifeste", label: "Manifeste" },
  { id: "acte-preuves", label: "Preuves" },
  { id: "acte-immersion", label: "Immersion" },
] as const;
type ChapterId = (typeof CHAPTERS)[number]["id"];

export function HomeChapterNav() {
  const [active, setActive] = useState<ChapterId>(CHAPTERS[0].id);
  const linksRef = useRef<Partial<Record<ChapterId, HTMLAnchorElement | null>>>({});
  const linksWrapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<HTMLSpanElement | null>(null);

  const setLinkRef = (id: ChapterId, el: HTMLAnchorElement | null) => {
    linksRef.current[id] = el;
  };

  useLayoutEffect(() => {
    const wrap = linksWrapRef.current;
    const marker = markerRef.current;
    if (!wrap || !marker) return;

    const target = linksRef.current[active] ?? null;
    if (!target) return;

    const wr = wrap.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const x = tr.left - wr.left;
    const w = Math.max(tr.width, 28);

    gsap.killTweensOf(marker);
    gsap.to(marker, {
      x,
      width: w,
      opacity: 1,
      duration: 0.42,
      ease: "power3.out",
    });
  }, [active]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    CHAPTERS.forEach((chapter) => {
      const el = document.getElementById(chapter.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setActive(chapter.id);
          }
        },
        { rootMargin: "-42% 0px -42% 0px", threshold: 0.01 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav className="home-chapters" aria-label="Chapitres narratifs">
      <div className="container home-chapters__inner">
        <span className="home-chapters__brand">Thomas Palmier</span>
        <div className="home-chapters__links" ref={linksWrapRef}>
          {CHAPTERS.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className={`home-chapters__link${active === chapter.id ? " is-active" : ""}`}
              ref={(el) => setLinkRef(chapter.id, el)}
            >
              {chapter.label}
            </a>
          ))}
          <span ref={markerRef} className="home-chapters__marker" aria-hidden />
        </div>
      </div>
    </nav>
  );
}
