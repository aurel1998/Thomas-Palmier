"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * Passe a `true` une seule fois quand l'element intersecte le viewport.
 * Utile pour lazy-load video / demarrer animations lourdes seulement si visibles.
 */
export function useInViewOnce<T extends Element>(
  ref: RefObject<T | null>,
  rootMargin = "120px",
  threshold = 0
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, inView, rootMargin, threshold]);

  return inView;
}
