"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { prefersSaveData } from "../../lib/clientPerf";

const MicroInteractions = dynamic(
  () => import("./MicroInteractions").then((m) => ({ default: m.MicroInteractions })),
  { ssr: false, loading: () => null }
);

/**
 * Effets « luxe » non critiques : montés après idle pour ne pas concurrencer
 * hydratation / LCP (chunk séparé + requestIdleCallback).
 */
export function ClientFxBundle() {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    // Save-Data : on coupe tout. Sinon on monte (les révélations au scroll
    // doivent jouer aussi sur tactile — elles ne dépendent pas du pointeur).
    if (prefersSaveData()) return;
    const go = () => setMount(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(go, { timeout: 6000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(go, 1200);
    return () => window.clearTimeout(t);
  }, []);

  if (!mount) return null;

  return <MicroInteractions />;
}
