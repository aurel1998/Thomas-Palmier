"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Content } from "../../types/content";
import { FeatureContentCard } from "../../components/contenus/FeatureContentCard";
import { ContenuCard } from "../../components/contenus/ContenuCard";

const fallbackItems: Content[] = [
  {
    id: "v1",
    type: "video",
    title: "Lecture du tempo en pleine intensité",
    content: "/src/video/video9.mp4",
    image_url: "/src/stade/stade4.jpg",
    tags: ["Action"],
    created_at: "2026-03-20T10:00:00.000Z",
  },
  {
    id: "a1",
    type: "article",
    title: "Duel décisif et bascule tactique",
    content: "Analyse des séquences clés et des ajustements collectifs.",
    image_url: "/src/joueurs/joueur9.jpg",
    tags: ["Action"],
    created_at: "2026-03-18T08:30:00.000Z",
  },
  {
    id: "au1",
    type: "audio",
    title: "Chronique tribunes et émotion brute",
    content: "https://example.com/audio/chronique-tribunes",
    image_url: "/src/stade/stade6.jpg",
    tags: ["Reportage"],
    created_at: "2026-03-16T09:45:00.000Z",
  },
  {
    id: "v2",
    type: "video",
    title: "Plongée immersive au cœur du stade",
    content: "/src/video/video9.mp4",
    image_url: "/src/stade/stade1.jpg",
    tags: ["Immersion"],
    created_at: "2026-03-14T11:20:00.000Z",
  },
];

const PAGE_SIZE = 24;

type Category = {
  id: string;
  name: string;
};

type ContentApiResponse = {
  data?: Content[];
  total?: number;
  hasMore?: boolean;
  error?: string;
};

function buildContentQuery(offset: number, stats: boolean): string {
  const params = new URLSearchParams();
  params.set("limit", String(PAGE_SIZE));
  params.set("offset", String(offset));
  if (stats) params.set("stats", "1");
  return `/api/content?${params.toString()}`;
}

export default function MesContenusPage() {
  const [items, setItems] = useState<Content[]>(fallbackItems);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [usingFallback, setUsingFallback] = useState(true);
  /** `null` = tous les contenus ; sinon filtre une catégorie (comportement type hub streaming). */
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const stRefreshRaf = useRef<number | null>(null);
  const prevFilteredIdsRef = useRef<string>("");

  const scheduleScrollTriggerRefresh = useCallback(() => {
    if (typeof window === "undefined" || isReducedMotion()) return;
    if (stRefreshRaf.current != null) cancelAnimationFrame(stRefreshRaf.current);
    stRefreshRaf.current = requestAnimationFrame(() => {
      stRefreshRaf.current = null;
      ensureScrollTrigger();
      ScrollTrigger.refresh();
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const response = await fetch(buildContentQuery(0, true), { cache: "no-store" });
        const result = (await response.json()) as ContentApiResponse;
        if (!isMounted) return;
        if (Array.isArray(result.data)) {
          setUsingFallback(false);
          if (result.data.length) {
            setItems(result.data);
            setOffset(result.data.length);
            setHasMore(Boolean(result.hasMore));
            setTotal(typeof result.total === "number" ? result.total : null);
          } else {
            setItems([]);
            setOffset(0);
            setHasMore(false);
            setTotal(0);
          }
        }
      } catch {
        /* fallback démo */
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await fetch("/api/categories", { cache: "no-store" });
        const result = (await response.json()) as { data?: Category[] };
        if (!isMounted) return;
        setCategories(Array.isArray(result.data) ? result.data : []);
      } catch {
        if (isMounted) setCategories([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || usingFallback) return;
    setIsLoadingMore(true);
    try {
      const response = await fetch(buildContentQuery(offset, false), { cache: "no-store" });
      const result = (await response.json()) as ContentApiResponse;
      const batch = Array.isArray(result.data) ? result.data : [];
      if (batch.length > 0) {
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id));
          const next = batch.filter((i) => !seen.has(i.id));
          return next.length ? [...prev, ...next] : prev;
        });
        setOffset((prev) => prev + batch.length);
        setHasMore(Boolean(result.hasMore));
        if (typeof result.total === "number") setTotal(result.total);
      } else {
        setHasMore(false);
      }
    } catch {
      /* retry */
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, offset, usingFallback]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (isLoading || usingFallback || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, usingFallback, loadMore]);

  const filteredItems = useMemo(() => {
    if (!selectedCategoryId) return items;
    return items.filter((item) => item.category_id === selectedCategoryId);
  }, [items, selectedCategoryId]);

  const sortedCatalogItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const fa = a.is_featured ? 1 : 0;
      const fb = b.is_featured ? 1 : 0;
      if (fb !== fa) return fb - fa;
      const tb = new Date(b.created_at).getTime();
      const ta = new Date(a.created_at).getTime();
      return tb - ta;
    });
  }, [filteredItems]);

  /** Pas de carte « héros » pleine largeur quand une catégorie est active : grille uniforme (vidéos côte à côte). */
  const catalogHero = useMemo(() => {
    if (selectedCategoryId != null) return null;
    return sortedCatalogItems.find((item) => item.is_featured) ?? null;
  }, [sortedCatalogItems, selectedCategoryId]);

  const catalogGridItems = useMemo(() => {
    if (!catalogHero) return sortedCatalogItems;
    return sortedCatalogItems.filter((item) => item.id !== catalogHero.id);
  }, [sortedCatalogItems, catalogHero]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (!item.category_id) continue;
      counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const initialRevealDoneRef = useRef(false);
  const prevItemCountRef = useRef(0);

  useEffect(() => {
    if (isLoading || usingFallback) {
      prevItemCountRef.current = items.length;
      return;
    }
    if (!initialRevealDoneRef.current) {
      initialRevealDoneRef.current = true;
      prevItemCountRef.current = items.length;
      return;
    }
    const prev = prevItemCountRef.current;
    const curr = items.length;
    prevItemCountRef.current = curr;
    if (curr <= prev) return;

    if (isReducedMotion()) return;

    const newItems = items.slice(prev);
    const nodes: Element[] = [];
    newItems.forEach((item) => {
      const el = pageRef.current?.querySelector(`[data-content-id="${CSS.escape(item.id)}"]`);
      if (el) nodes.push(el);
    });
    if (nodes.length === 0) return;

    gsap.set(nodes, { opacity: 0, y: 28, scale: 0.97 });

    gsap.to(nodes, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: motion.duration.revealMed,
      ease: motion.ease.outExpo,
      stagger: {
        each: motion.duration.staggerTight,
        from: "start",
      },
      clearProps: "transform",
    });
  }, [items, isLoading, usingFallback]);

  useLayoutEffect(() => {
    if (isLoading || isReducedMotion()) return;
    const root = pageRef.current;
    if (!root) return;

    const ids = filteredItems.map((i) => i.id).join("|");
    if (prevFilteredIdsRef.current === "") {
      prevFilteredIdsRef.current = ids;
      return;
    }
    if (prevFilteredIdsRef.current === ids) return;
    prevFilteredIdsRef.current = ids;

    const nodes = root.querySelectorAll<HTMLElement>("[data-filter-node]");
    if (!nodes.length) return;

    gsap.killTweensOf(nodes);
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, y: 18, scale: 0.99 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: motion.duration.revealFast,
        ease: motion.ease.out,
        stagger: motion.duration.staggerTight,
        clearProps: "transform",
      }
    );
  }, [filteredItems, isLoading]);

  useLayoutEffect(() => {
    if (isLoading) return;
    if (isReducedMotion()) return;

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".mes-contenus-head",
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: motion.duration.revealFast,
          ease: motion.ease.out,
        }
      );

      gsap.utils.toArray<HTMLElement>(".mes-contenus-section").forEach((section) => {
        const cards = section.querySelectorAll(
          ".contenus-feature, .mes-hub__catalogGrid .contenus-card"
        );
        if (cards.length) {
          gsap.fromTo(
            cards,
            { autoAlpha: 0, y: 32, scale: 0.98 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: motion.duration.revealMed,
              ease: motion.ease.out,
              stagger: motion.duration.stagger,
              scrollTrigger: {
                trigger: section,
                start: motion.scroll.startCards,
                toggleActions: motion.scroll.toggleOnce,
              },
            }
          );
        }

        const progress = section.querySelector(".mes-storyline__progress");
        if (progress) {
          gsap.fromTo(
            progress,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: motion.ease.none,
              transformOrigin: "top center",
              scrollTrigger: {
                trigger: section,
                start: "top 75%",
                end: "bottom 35%",
                scrub: true,
              },
            }
          );
        }
      });

      gsap.utils.toArray<HTMLElement>(".contenus-feature__img").forEach((img) => {
        const wrap = img.closest(".contenus-feature");
        if (!wrap) return;
        gsap.fromTo(
          img,
          { yPercent: -motion.parallax.yPercent * 0.75 },
          {
            yPercent: motion.parallax.yPercent * 0.75,
            ease: motion.ease.none,
            scrollTrigger: {
              trigger: wrap,
              start: "top bottom",
              end: "bottom top",
              scrub: motion.parallax.scrub,
            },
          }
        );
      });

      scheduleScrollTriggerRefresh();
    }, pageRef);

    return () => {
      if (stRefreshRaf.current != null) {
        cancelAnimationFrame(stRefreshRaf.current);
        stRefreshRaf.current = null;
      }
      ctx.revert();
    };
  }, [isLoading, scheduleScrollTriggerRefresh]);

  useEffect(() => {
    if (isLoading) return;
    if (isReducedMotion()) return;
    scheduleScrollTriggerRefresh();
  }, [isLoading, items.length, sortedCatalogItems.length, scheduleScrollTriggerRefresh]);

  const showEmptyGlobal = !isLoading && !usingFallback && items.length === 0;
  const showEmptyFiltered = !isLoading && items.length > 0 && filteredItems.length === 0;

  return (
    <section className="mes-contenus-page contenus-page broadcast-hub mes-canal-page" ref={pageRef}>
      <div className="container mes-canal__container">
        <header className="mes-contenus-head mes-canal__top">
          <h1 className="mes-canal__title">Contenus</h1>
          {!isLoading && !showEmptyGlobal ? (
            <p className="mes-canal__count muted" aria-live="polite">
              {typeof total === "number" && total > 0 ? total : filteredItems.length}{" "}
              {typeof total === "number" && total > 1 ? "titres" : "titre"}
              {selectedCategoryId ? " dans cette catégorie" : ""}
            </p>
          ) : null}
        </header>

        {showEmptyGlobal ? (
          <p className="contenus-empty muted">Les premiers contenus arrivent bientôt.</p>
        ) : null}

        {showEmptyFiltered ? (
          <p className="contenus-empty muted">Aucun contenu dans cette catégorie.</p>
        ) : null}

        {!showEmptyGlobal && !showEmptyFiltered ? (
          <div
            className={`mes-canal__layout${categories.length === 0 ? " mes-canal__layout--solo" : ""}`}
          >
            {categories.length > 0 ? (
              <aside className="mes-canal__sidebar" aria-label="Filtrer par catégorie">
                <p className="mes-canal__sidebarLabel">Catégories</p>
                <div className="mes-canal__chips" role="tablist" aria-orientation="vertical">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedCategoryId === null}
                    className={`mes-canal__chip${selectedCategoryId === null ? " is-active" : ""}`}
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    Tous
                  </button>
                  {categories.map((c) => {
                    const active = selectedCategoryId === c.id;
                    const count = categoryCounts.get(c.id) ?? 0;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`mes-canal__chip${active ? " is-active" : ""}`}
                        onClick={() => setSelectedCategoryId(c.id)}
                      >
                        <span className="mes-canal__chipName">{c.name}</span>
                        {count > 0 ? <span className="mes-canal__chipCount">{count}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </aside>
            ) : null}

            <div className="mes-canal__main">
              <section
                id="catalogue"
                className="mes-contenus-section contenus-section mes-hub__featured mes-canal__catalog"
                aria-label="Catalogue de contenus"
              >
                {isLoading ? (
                  <p className="contenus-pending muted" role="status">
                    Chargement…
                  </p>
                ) : (
                  <>
                    {catalogHero ? (
                      <div className="contenus-catalogue__hero mes-hub__lead" data-filter-node>
                        <FeatureContentCard item={catalogHero} />
                      </div>
                    ) : null}
                    {catalogGridItems.length > 0 ? (
                      <div className="contenus-rowGrid mes-hub__catalogGrid" role="list">
                        {catalogGridItems.map((item) => (
                          <div key={item.id} role="listitem" data-filter-node>
                            <ContenuCard item={item} />
                          </div>
                        ))}
                      </div>
                    ) : !catalogHero ? (
                      <p className="muted contenus-empty">Aucun contenu à afficher.</p>
                    ) : null}
                  </>
                )}
              </section>

              {!isLoading && filteredItems.length > 0 ? (
                <div className="contenus-flux" aria-live="polite">
                  {isLoadingMore ? (
                    <p className="contenus-flux__loading" role="status">
                      <span className="contenus-flux__spinner" aria-hidden="true" />
                      Chargement…
                    </p>
                  ) : null}
                  <div ref={sentinelRef} className="contenus-flux__sentinel" aria-hidden="true" />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
