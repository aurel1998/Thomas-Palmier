"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { prefersLightWebGL, prefersSaveData } from "../../lib/clientPerf";

const ThreeBackdrop = dynamic(() => import("./ThreeBackdrop"), {
  ssr: false,
  loading: () => null,
});

/**
 * Monte Three.js après le premier idle (ou timeout) pour ne pas concurrencer
 * le rendu initial / hydratation. Désactivé si « Économie de données ».
 */
export function ThreeBackdropGate() {
  const pathname = usePathname() ?? "/";
  const [mount, setMount] = useState(false);

  useEffect(() => {
    if (prefersSaveData() || prefersLightWebGL()) return;
    /* Un seul canvas WebGL sur l’accueil : /mes-contenus reste plus léger au scroll. */
    const eligible = pathname === "/";
    if (!eligible) {
      setMount(false);
      return;
    }
    const go = () => setMount(true);
    if (typeof window.requestIdleCallback === "function") {
      /* Timeout plus long : laisse LCP / hydratation respirer (perception « site rapide »). */
      const id = window.requestIdleCallback(go, { timeout: 4800 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(go, 520);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!mount) return null;
  return <ThreeBackdrop />;
}
