"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { prefersCoarsePointer, prefersSaveData } from "../../lib/clientPerf";

const CustomCursor = dynamic(
  () => import("./CustomCursor").then((m) => ({ default: m.CustomCursor })),
  { ssr: false, loading: () => null }
);

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
    if (prefersSaveData() || prefersCoarsePointer()) return;
    const go = () => setMount(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(go, { timeout: 4200 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(go, 720);
    return () => window.clearTimeout(t);
  }, []);

  if (!mount) return null;

  return (
    <>
      <MicroInteractions />
      <CustomCursor />
    </>
  );
}
