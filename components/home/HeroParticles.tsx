"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { prefersLightWebGL, prefersSaveData } from "../../lib/clientPerf";

function reduced(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function softTexture(): THREE.CanvasTexture {
  const s = 48;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(c);
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.35, "rgba(255,255,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function shellPositions(buf: Float32Array, r: number, t: number) {
  for (let i = 0; i < buf.length; i += 3) {
    const u = Math.random();
    const v = Math.random();
    const th = u * Math.PI * 2;
    const ph = Math.acos(2 * v - 1);
    const rad = r + (Math.random() - 0.5) * t;
    const sp = Math.sin(ph);
    buf[i] = rad * sp * Math.cos(th);
    buf[i + 1] = rad * sp * Math.sin(th);
    buf[i + 2] = rad * Math.cos(ph);
  }
}

/** Couche Three légère au-dessus du hero (particules, souris). */
export function HeroParticles() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (reduced()) return;
    if (prefersSaveData()) return;

    const lite = prefersLightWebGL();
    const fine = window.matchMedia("(pointer: fine)").matches;
    const n = lite ? (fine ? 48 : 32) : fine ? 96 : 60;
    const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.12);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    cam.position.z = 6.5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "home-hero__three-canvas";
    mount.appendChild(renderer.domElement);

    const tex = softTexture();
    const pos = new Float32Array(n * 3);
    shellPositions(pos, 3.8, 1.2);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      map: tex,
      size: lite ? (fine ? 1.05 : 1.35) : fine ? 1.32 : 1.72,
      transparent: true,
      opacity: lite ? 0.22 : 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    const parseAccent = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim();
      const p = raw.split(/\s+/).map((x) => Number.parseInt(x, 10));
      if (p.length >= 3 && p.every((x) => !Number.isNaN(x))) {
        return new THREE.Color(p[0] / 255, p[1] / 255, p[2] / 255);
      }
      return new THREE.Color(0x2dd4bf);
    };

    const parseBlue = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--spectrum-blue-rgb").trim();
      const p = raw.split(/\s+/).map((x) => Number.parseInt(x, 10));
      if (p.length >= 3 && p.every((x) => !Number.isNaN(x))) {
        return new THREE.Color(p[0] / 255, p[1] / 255, p[2] / 255);
      }
      return new THREE.Color(0.376, 0.647, 0.98);
    };

    const applyTheme = () => {
      const light = document.documentElement.getAttribute("data-theme") === "light";
      const a = parseAccent();
      if (light) {
        mat.color.setRGB(0.95, 0.92, 0.88);
        mat.opacity = lite ? 0.12 : 0.18;
        mat.blending = THREE.NormalBlending;
      } else {
        mat.color.copy(a).lerp(parseBlue(), 0.24).multiplyScalar(1.04);
        mat.opacity = lite ? 0.2 : 0.3;
        mat.blending = THREE.AdditiveBlending;
      }
    };
    applyTheme();
    const mo = new MutationObserver(applyTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let w = 1;
    let h = 1;
    const resize = () => {
      w = mount.clientWidth || 1;
      h = mount.clientHeight || 1;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      my = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      if (document.hidden) {
        raf = 0;
        return;
      }
      const t = clock.elapsedTime;
      pts.rotation.y = t * 0.11 + mx * 0.35;
      pts.rotation.x = my * 0.2 + Math.sin(t * 0.15) * 0.05;
      pts.position.x = mx * 0.15;
      pts.position.y = my * 0.1;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(tick);
    };

    const onVis = () => {
      if (!document.hidden && raf === 0) {
        clock.getDelta();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      mo.disconnect();
      ro.disconnect();
      geo.dispose();
      mat.dispose();
      tex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="home-hero__three" aria-hidden />;
}
