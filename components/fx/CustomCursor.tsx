"use client";



import { usePathname } from "next/navigation";

import { useEffect, useRef } from "react";

import { isReducedMotion } from "../../lib/gsapMotion";



/**

 * Atténuation globale du canvas chaque frame (plus haut = traînée plus courte).

 */

const FADE_STEP = 0.054;

/** Distance mini entre deux échantillons (px). */

const MIN_DIST = 0.85;

/** Ruban : épaisseur (px). */

const RIBBON_W = 2.35;

/** Halos intermédiaires le long du segment (curseur natif inchangé). */

const SEGMENT_SAMPLES = 3;

/** Rayon des halos intermédiaires (px). */

const MINI_R = 5.65;

/** Halo à la pointe (px). */

const TIP_R = 10.5;

/** Arrêt du raf après N frames sans nouveau dessin. */

const IDLE_FRAMES_MAX = 120;



function parseAccentRgb(): [number, number, number] {

  if (typeof document === "undefined") return [142, 188, 255];

  const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim();

  const parts = raw.split(/\s+/).map((n) => Number.parseInt(n, 10));

  if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {

    return [parts[0], parts[1], parts[2]];

  }

  return [142, 188, 255];

}



/**

 * Curseur **système** : inchangé (pas de `cursor: none`).

 * Seule une **traînée** accent sur canvas s’efface progressivement (`destination-out`).

 */

export function CustomCursor() {

  const pathname = usePathname();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const lastRef = useRef({ x: -9999, y: -9999 });

  const rafRef = useRef(0);

  const idleFramesRef = useRef(0);

  const dimsRef = useRef({ cssW: 0, cssH: 0, dpr: 1 });



  useEffect(() => {

    lastRef.current = { x: -9999, y: -9999 };

  }, [pathname]);



  useEffect(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    if (typeof window === "undefined") return;

    const fine = window.matchMedia("(pointer: fine)").matches;

    if (!fine || isReducedMotion()) return;



    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) return;

    let theme: "light" | "dark" =
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    let accentRgb = parseAccentRgb();
    const updateThemeState = () => {
      theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      accentRgb = parseAccentRgb();
    };
    const mo = new MutationObserver(updateThemeState);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });



    const resize = () => {

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const cssW = window.innerWidth;

      const cssH = window.innerHeight;

      dimsRef.current = { cssW, cssH, dpr };

      canvas.style.width = `${cssW}px`;

      canvas.style.height = `${cssH}px`;

      canvas.width = Math.floor(cssW * dpr);

      canvas.height = Math.floor(cssH * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    };



    resize();

    window.addEventListener("resize", resize);



    const fadeStep = () => {

      ctx.globalCompositeOperation = "destination-out";

      ctx.fillStyle = `rgba(0, 0, 0, ${FADE_STEP})`;

      ctx.fillRect(0, 0, dimsRef.current.cssW, dimsRef.current.cssH);

      ctx.globalCompositeOperation = "source-over";

    };



    const drawRibbon = (x0: number, y0: number, x1: number, y1: number, strokeAlpha: number) => {
      const [r, g, b] = accentRgb;

      const base = theme === "light" ? 0.14 : 0.26;

      const a = base * strokeAlpha;

      ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;

      ctx.globalCompositeOperation = theme === "light" ? "source-over" : "lighter";

      ctx.lineWidth = RIBBON_W;

      ctx.lineJoin = "round";

      ctx.lineCap = "round";

      ctx.beginPath();

      ctx.moveTo(x0, y0);

      ctx.lineTo(x1, y1);

      ctx.stroke();

      ctx.globalCompositeOperation = "source-over";

    };



    const drawMiniBlob = (x: number, y: number, strength: number) => {
      const [r, g, b] = accentRgb;

      const rad = ctx.createRadialGradient(x, y, 0, x, y, MINI_R);

      if (theme === "light") {

        rad.addColorStop(0, `rgba(${r},${g},${b},${0.22 * strength})`);

        rad.addColorStop(0.5, `rgba(${r},${g},${b},${0.08 * strength})`);

        rad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.globalCompositeOperation = "source-over";

      } else {

        rad.addColorStop(0, `rgba(${r},${g},${b},${0.42 * strength})`);

        rad.addColorStop(0.35, `rgba(255,255,255,${0.08 * strength})`);

        rad.addColorStop(0.55, `rgba(${r},${g},${b},${0.16 * strength})`);

        rad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.globalCompositeOperation = "lighter";

      }

      ctx.fillStyle = rad;

      ctx.beginPath();

      ctx.arc(x, y, MINI_R, 0, Math.PI * 2);

      ctx.fill();

      ctx.globalCompositeOperation = "source-over";

    };



    const drawTipBlob = (x: number, y: number) => {
      const [r, g, b] = accentRgb;

      const rad = ctx.createRadialGradient(x, y, 0, x, y, TIP_R);



      if (theme === "light") {

        rad.addColorStop(0, `rgba(${r},${g},${b},0.28)`);

        rad.addColorStop(0.45, `rgba(${r},${g},${b},0.11)`);

        rad.addColorStop(0.78, `rgba(${r},${g},${b},0.04)`);

        rad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.globalCompositeOperation = "source-over";

      } else {

        rad.addColorStop(0, `rgba(${r},${g},${b},0.52)`);

        rad.addColorStop(0.25, `rgba(255,255,255,0.12)`);

        rad.addColorStop(0.45, `rgba(${r},${g},${b},0.22)`);

        rad.addColorStop(0.7, `rgba(${r},${g},${b},0.08)`);

        rad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.globalCompositeOperation = "lighter";

      }



      ctx.fillStyle = rad;

      ctx.beginPath();

      ctx.arc(x, y, TIP_R, 0, Math.PI * 2);

      ctx.fill();

      ctx.globalCompositeOperation = "source-over";

    };



    const traceSegment = (x0: number, y0: number, x1: number, y1: number) => {

      const dx = x1 - x0;

      const dy = y1 - y0;

      const len = Math.hypot(dx, dy) || 1;

      const strokeAlpha = Math.min(1, 0.55 + len * 0.04);

      drawRibbon(x0, y0, x1, y1, strokeAlpha);



      for (let s = 1; s <= SEGMENT_SAMPLES; s++) {

        const t = s / (SEGMENT_SAMPLES + 1);

        const x = x0 + dx * t;

        const y = y0 + dy * t;

        const w = 0.35 + 0.65 * t;

        drawMiniBlob(x, y, w * strokeAlpha);

      }

    };



    const tick = () => {

      fadeStep();

      idleFramesRef.current += 1;

      if (idleFramesRef.current < IDLE_FRAMES_MAX) {

        rafRef.current = requestAnimationFrame(tick);

      } else {

        rafRef.current = 0;

      }

    };



    const ensureLoop = () => {

      idleFramesRef.current = 0;

      if (!rafRef.current) {

        rafRef.current = requestAnimationFrame(tick);

      }

    };



    const onMove = (e: PointerEvent) => {

      const { x: lx, y: ly } = lastRef.current;

      const dx = e.clientX - lx;

      const dy = e.clientY - ly;

      if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) return;



      if (lx > -9000) {

        traceSegment(lx, ly, e.clientX, e.clientY);

      }

      lastRef.current = { x: e.clientX, y: e.clientY };

      drawTipBlob(e.clientX, e.clientY);

      ensureLoop();

    };



    window.addEventListener("pointermove", onMove, { passive: true });



    return () => {

      window.removeEventListener("resize", resize);

      window.removeEventListener("pointermove", onMove);
      mo.disconnect();

      cancelAnimationFrame(rafRef.current);

      rafRef.current = 0;

    };

  }, []);



  useEffect(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const { dpr } = dimsRef.current;

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  }, [pathname]);



  return <canvas ref={canvasRef} className="cursor-trail-canvas" aria-hidden />;

}


