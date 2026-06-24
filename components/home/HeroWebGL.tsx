"use client";

import { useEffect, useRef } from "react";
import { isReducedMotion } from "../../lib/gsapMotion";

/**
 * Canvas Three.js pour le hero — particules avec shader GLSL custom.
 * Chargement dynamique (aucun impact sur le bundle principal).
 * Réduit ou désactivé quand une vidéo de fond tourne (évite les conflits GPU).
 */
export function HeroWebGL({ videoActive = false }: { videoActive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;
    if (isReducedMotion()) return;
    if (videoActive) return;

    let disposed = false;
    let rafId = 0;

    void import("three").then((THREE) => {
      if (disposed || !canvasRef.current) return;

      const W = canvas.offsetWidth || window.innerWidth;
      const H = canvas.offsetHeight || window.innerHeight;
      const isMobile = window.innerWidth < 768;
      const COUNT = isMobile ? 700 : 2200;
      const DPR = Math.min(window.devicePixelRatio, 1.5);

      /* ── Renderer ── */
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(DPR);
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);

      /* ── Scene + Camera ── */
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 120);
      camera.position.set(0, 0, 7);

      /* ── Geometry ── */
      const positions = new Float32Array(COUNT * 3);
      const scales = new Float32Array(COUNT);
      const randoms = new Float32Array(COUNT);

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        positions[i3]     = (Math.random() - 0.5) * 24;
        positions[i3 + 1] = (Math.random() - 0.5) * 14;
        positions[i3 + 2] = (Math.random() - 0.5) * 10 - 1.5;
        scales[i]   = Math.random();
        randoms[i]  = Math.random();
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("aScale",   new THREE.BufferAttribute(scales,    1));
      geo.setAttribute("aRandom",  new THREE.BufferAttribute(randoms,   1));

      /* ── Shader material ── */
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          uTime:       { value: 0 },
          uPixelRatio: { value: DPR },
          uColorA:     { value: new THREE.Color("#d4a843") }, // amber accent
          uColorB:     { value: new THREE.Color("#5b9ecf") }, // cool blue
        },
        vertexShader: /* glsl */`
          attribute float aScale;
          attribute float aRandom;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vAlpha;
          varying float vRandom;

          void main() {
            vRandom = aRandom;

            vec4 mp = modelMatrix * vec4(position, 1.0);

            // Wave drift — chaque particule a sa propre phase via aRandom
            mp.y += sin(position.x * 0.38 + uTime * 0.55 + aRandom * 6.28) * 0.18;
            mp.x += cos(position.y * 0.30 + uTime * 0.42 + aRandom * 6.28) * 0.12;
            mp.z += sin(uTime * 0.28 + aRandom * 6.28) * 0.08;

            vec4 vp = viewMatrix * mp;
            gl_Position = projectionMatrix * vp;

            // Taille : plus grande au premier plan, pilotée par aScale
            float sz = aScale * 4.8 * uPixelRatio * (1.0 / -vp.z);
            gl_PointSize = clamp(sz, 0.4, 14.0);

            // Transparence : profondeur + scale
            vAlpha = (aScale * 0.55 + 0.2) * clamp(1.0 + vp.z * 0.12, 0.0, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying float vAlpha;
          varying float vRandom;

          void main() {
            // Dégradé circulaire doux (gaussian glow)
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float a = exp(-d * 7.0) * vAlpha;
            if (a < 0.008) discard;

            // Mix couleur chaud/froid selon position aléatoire
            vec3 color = mix(uColorA, uColorB, vRandom * 0.7);

            gl_FragColor = vec4(color, a);
          }
        `,
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);

      /* ── Mouse parallax ── */
      let targetRotX = 0;
      let targetRotY = 0;
      let curRotX = 0;
      let curRotY = 0;

      const onMove = (e: MouseEvent) => {
        targetRotY = (e.clientX / window.innerWidth  - 0.5) * 0.45;
        targetRotX = -(e.clientY / window.innerHeight - 0.5) * 0.28;
      };
      window.addEventListener("mousemove", onMove, { passive: true });

      /* ── Resize ── */
      const onResize = () => {
        if (!canvasRef.current) return;
        const w = canvasRef.current.offsetWidth;
        const h = canvasRef.current.offsetHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(canvas);

      /* ── Render loop ── */
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      let time = 0;

      const render = () => {
        if (disposed) return;
        rafId = requestAnimationFrame(render);

        time += 0.007;
        (mat.uniforms.uTime as { value: number }).value = time;

        curRotX = lerp(curRotX, targetRotX, 0.038);
        curRotY = lerp(curRotY, targetRotY, 0.038);
        points.rotation.x = curRotX;
        points.rotation.y = curRotY + time * 0.035;

        renderer.render(scene, camera);
      };
      render();

      /* ── Cleanup ── */
      const cleanup = () => {
        disposed = true;
        cancelAnimationFrame(rafId);
        window.removeEventListener("mousemove", onMove);
        ro.disconnect();
        geo.dispose();
        mat.dispose();
        renderer.dispose();
      };

      // Store ref for outer cleanup
      (canvas as HTMLCanvasElement & { _threeCleanup?: () => void })._threeCleanup = cleanup;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      const cleanup = (canvas as HTMLCanvasElement & { _threeCleanup?: () => void })._threeCleanup;
      if (cleanup) cleanup();
    };
  }, [videoActive]);

  if (videoActive) return null;

  return <canvas ref={canvasRef} className="hero-webgl" aria-hidden="true" />;
}
