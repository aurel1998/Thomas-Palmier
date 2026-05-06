"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { prefersLightWebGL, prefersSaveData } from "../../lib/clientPerf";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function parseAccentRgb(): THREE.Color {
  if (typeof document === "undefined") return new THREE.Color(0x2dd4bf);
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim();
  const parts = raw.split(/\s+/).map((n) => Number.parseInt(n, 10));
  if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
    return new THREE.Color(parts[0] / 255, parts[1] / 255, parts[2] / 255);
  }
  return new THREE.Color(0x2dd4bf);
}

function parseSpectrumBlue(): THREE.Color {
  if (typeof document === "undefined") return new THREE.Color(0x60a5fa);
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--spectrum-blue-rgb").trim();
  const parts = raw.split(/\s+/).map((n) => Number.parseInt(n, 10));
  if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
    return new THREE.Color(parts[0] / 255, parts[1] / 255, parts[2] / 255);
  }
  return new THREE.Color(0x60a5fa);
}

function createSoftParticleTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.25, "rgba(255,255,255,0.35)");
  g.addColorStop(0.55, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function fillShellPositions(arr: Float32Array, radius: number, thickness: number) {
  for (let i = 0; i < arr.length; i += 3) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = radius + (Math.random() - 0.5) * thickness;
    const sinP = Math.sin(phi);
    arr[i] = r * sinP * Math.cos(theta);
    arr[i + 1] = r * sinP * Math.sin(theta);
    arr[i + 2] = r * Math.cos(phi);
  }
}

/**
 * Fond WebGL discret : particules + icosphère filaire, réaction souris (parallax).
 * Ne capte pas les événements ; pause quand l’onglet est en arrière-plan.
 */
export default function ThreeBackdrop() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (prefersReducedMotion()) return;
    if (prefersSaveData()) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const lite = prefersLightWebGL();
    const countNear = lite ? (fine ? 160 : 88) : fine ? 240 : 120;
    const countFar = lite ? (fine ? 120 : 64) : fine ? 190 : 100;
    const maxDpr = fine ? Math.min(window.devicePixelRatio || 1, lite ? 1.15 : 1.2) : 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(maxDpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const tex = createSoftParticleTexture();

    const group = new THREE.Group();
    scene.add(group);

    // Voile "aurora" shader pour donner un rendu plus premium.
    const auroraUniforms = {
      uTime: { value: 0 },
      uTheme: { value: 0 },
      uAccent: { value: new THREE.Color(0x2dd4bf) },
      uBlue: { value: new THREE.Color(0x60a5fa) },
    };
    const auroraMat = new THREE.ShaderMaterial({
      uniforms: auroraUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uTheme;
        uniform vec3 uAccent;
        uniform vec3 uBlue;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);
          float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
          vec2 u=f*f*(3.-2.*f);
          return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
        }
        void main() {
          vec2 uv = vUv;
          float t = uTime * 0.08;
          float bands = sin((uv.y * 8.0) + t * 6.0 + noise(uv * 6.0 + t) * 2.5) * 0.5 + 0.5;
          float glowA = smoothstep(0.2, 0.95, bands) * smoothstep(1.0, 0.2, uv.y);
          float glowB = smoothstep(0.18, 0.92, sin((uv.y * 9.0) - t * 4.0 + noise(uv * 8.0 - t) * 1.9) * 0.5 + 0.5);
          vec3 col = mix(uBlue, uAccent, uv.x * 0.65 + 0.2);
          float alpha = (glowA * 0.24 + glowB * 0.16) * mix(0.46, 0.22, uTheme);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    const aurora = new THREE.Mesh(new THREE.PlaneGeometry(30, 20, 1, 1), auroraMat);
    aurora.position.z = -7.8;
    scene.add(aurora);

    const posNear = new Float32Array(countNear * 3);
    fillShellPositions(posNear, 5.2, 1.8);
    const geoNear = new THREE.BufferGeometry();
    geoNear.setAttribute("position", new THREE.BufferAttribute(posNear, 3));
    const matNear = new THREE.PointsMaterial({
      map: tex,
      size: fine ? (lite ? 2.25 : 2.65) : 3.35,
      transparent: true,
      opacity: lite ? 0.48 : 0.58,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const pointsNear = new THREE.Points(geoNear, matNear);
    group.add(pointsNear);

    const posFar = new Float32Array(countFar * 3);
    fillShellPositions(posFar, 7.5, 2.4);
    const geoFar = new THREE.BufferGeometry();
    geoFar.setAttribute("position", new THREE.BufferAttribute(posFar, 3));
    const matFar = new THREE.PointsMaterial({
      map: tex,
      size: fine ? (lite ? 1.45 : 1.85) : 2.35,
      transparent: true,
      opacity: lite ? 0.3 : 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const pointsFar = new THREE.Points(geoFar, matFar);
    group.add(pointsFar);

    const icoGeo = new THREE.IcosahedronGeometry(3.2, 0);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: lite ? 0.038 : 0.058,
      depthWrite: false,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    group.add(ico);
    const ringGeo = new THREE.TorusKnotGeometry(2.35, 0.045, 128, 10);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: lite ? 0.03 : 0.045,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.set(0.3, 0.12, -0.2);
    group.add(ring);

    let theme: "light" | "dark" =
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";

    const applyTheme = () => {
      theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const accent = parseAccentRgb();
      const blue = parseSpectrumBlue();
      if (theme === "dark") {
        matNear.color.copy(accent).lerp(blue, 0.28).multiplyScalar(1.04);
        matNear.opacity = lite ? 0.52 : 0.62;
        matNear.blending = THREE.AdditiveBlending;
        matFar.color.copy(accent).lerp(blue, 0.45).multiplyScalar(0.9);
        matFar.opacity = lite ? 0.32 : 0.4;
        icoMat.color.copy(accent).lerp(blue, 0.35);
        icoMat.opacity = lite ? 0.048 : 0.07;
        ringMat.color.copy(accent).lerp(blue, 0.5);
        ringMat.opacity = lite ? 0.028 : 0.042;
        auroraUniforms.uTheme.value = 0;
      } else {
        matNear.color.setRGB(0.22, 0.2, 0.18);
        matNear.opacity = lite ? 0.2 : 0.26;
        matNear.blending = THREE.NormalBlending;
        matFar.color.setRGB(0.28, 0.24, 0.2);
        matFar.opacity = lite ? 0.12 : 0.17;
        matFar.blending = THREE.NormalBlending;
        icoMat.color.copy(accent).multiplyScalar(0.38);
        icoMat.opacity = lite ? 0.032 : 0.044;
        ringMat.color.setRGB(0.24, 0.22, 0.2);
        ringMat.opacity = lite ? 0.02 : 0.03;
        auroraUniforms.uTheme.value = 1;
      }
      auroraUniforms.uAccent.value.copy(accent);
      auroraUniforms.uBlue.value.copy(blue);
    };
    applyTheme();

    const mo = new MutationObserver(() => applyTheme());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let w = mount.clientWidth || window.innerWidth;
    let h = mount.clientHeight || window.innerHeight;

    const resize = () => {
      w = mount.clientWidth || window.innerWidth;
      h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let targetMx = 0;
    let targetMy = 0;
    let mx = 0;
    let my = 0;

    const onMove = (e: PointerEvent) => {
      targetMx = (e.clientX / window.innerWidth) * 2 - 1;
      targetMy = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      if (document.hidden) {
        raf = 0;
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      mx += (targetMx - mx) * Math.min(dt * 5.5, 0.12);
      my += (targetMy - my) * Math.min(dt * 5.5, 0.12);

      group.rotation.y = t * 0.045 + mx * 0.38;
      group.rotation.x = my * 0.22 + Math.sin(t * 0.08) * 0.04;
      group.rotation.z = mx * 0.06;
      group.position.x = mx * 0.35;
      group.position.y = my * 0.28;

      pointsNear.rotation.y = t * 0.12;
      pointsFar.rotation.y = -t * 0.08;
      ico.rotation.x = t * 0.03 + my * 0.15;
      ico.rotation.y = t * 0.05 + mx * 0.12;
      ring.rotation.x = -t * 0.06 + my * 0.12;
      ring.rotation.y = t * 0.08 + mx * 0.16;
      auroraUniforms.uTime.value = t;

      renderer.render(scene, camera);
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
      geoNear.dispose();
      geoFar.dispose();
      icoGeo.dispose();
      ringGeo.dispose();
      matNear.dispose();
      matFar.dispose();
      icoMat.dispose();
      ringMat.dispose();
      auroraMat.dispose();
      tex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="three-backdrop" aria-hidden />;
}
