"use client";

import { useEffect, useRef } from "react";
import { isReducedMotion } from "../../lib/gsapMotion";

const HOVER_SELECTOR =
  "a, button, [role='button'], .is-magnetic, label, select, input, textarea, summary, " +
  ".btn, .btn-primary, .btn-secondary, .admin-btn, .theme-toggle, .site-header__navItem";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (isReducedMotion()) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = -200;
    let mouseY = -200;
    let ringX = -200;
    let ringY = -200;
    let rafId = 0;
    let visible = false;
    let hovering = false;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    /* ── Animation loop ── */
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      dot.style.transform = `translate3d(${mouseX - 3}px,${mouseY - 3}px,0)`;
      ringX = lerp(ringX, mouseX, 0.1);
      ringY = lerp(ringY, mouseY, 0.1);
      ring.style.transform = `translate3d(${ringX - 22}px,${ringY - 22}px,0)`;
    };
    tick();

    /* ── Visibility ── */
    const show = () => {
      if (visible) return;
      visible = true;
      dot.dataset.visible = "1";
      ring.dataset.visible = "1";
    };
    const hide = () => {
      visible = false;
      delete dot.dataset.visible;
      delete ring.dataset.visible;
    };

    /* ── Hover state detection ── */
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest(HOVER_SELECTOR);
      if (interactive && !hovering) {
        hovering = true;
        dot.dataset.hover = "1";
        ring.dataset.hover = "1";
        const label = (interactive as HTMLElement).dataset.cursor;
        if (label) ring.dataset.label = label;
      } else if (!interactive && hovering) {
        hovering = false;
        delete dot.dataset.hover;
        delete ring.dataset.hover;
        delete ring.dataset.label;
      }
    };

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) show();
    };

    const onDown = () => {
      dot.dataset.press = "1";
      ring.dataset.press = "1";
    };
    const onUp = () => {
      delete dot.dataset.press;
      delete ring.dataset.press;
    };

    document.documentElement.classList.add("cursor-custom");
    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", hide);
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mousedown", onDown, { passive: true });
    document.addEventListener("mouseup", onUp, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.classList.remove("cursor-custom");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", hide);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
