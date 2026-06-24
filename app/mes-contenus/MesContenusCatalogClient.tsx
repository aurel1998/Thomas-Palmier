"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter, useSearchParams } from "next/navigation";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Content, ContentType } from "../../types/content";
import type { Category } from "../../types/category";
import type { Subcategory } from "../../types/subcategory";
import { CatalogHub, type CatalogLevel } from "../../components/contenus/CatalogHub";
import { FeatureContentCard } from "../../components/contenus/FeatureContentCard";
import { ContenuCard } from "../../components/contenus/ContenuCard";
import { countByContentType } from "../../lib/catalogContentCopy";
import { attachCategoryIds, resolveCatalogCategories } from "../../lib/resolveCategories";
import { ENABLE_DEV_FALLBACKS } from "../../lib/runtime";
const PAGE_SIZE = 24;
const CATALOG_STATS_LIMIT = 64;

async function withDevCatalogFallback(
  data: Content[],
  opts?: { subcategoryId?: string | null; siteUsesDemo?: boolean }
): Promise<Content[]> {
  const { withDemoCatalogFallback } = await import("../../lib/demoCatalog");
  return withDemoCatalogFallback(data, opts);
}

type ContentApiResponse = {
  data?: Content[];
  total?: number;
  hasMore?: boolean;
  error?: string;
};

function buildContentQuery(
  offset: number,
  opts?: { stats?: boolean; subcategoryId?: string | null; limit?: number }
): string {
  const params = new URLSearchParams();
  const limit = opts?.limit ?? PAGE_SIZE;
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (opts?.stats) params.set("stats", "1");
  if (opts?.subcategoryId) params.set("subcategory_id", opts.subcategoryId);
  return `/api/content?${params.toString()}`;
}

function MesContenusCatalogClient({ initialContents = [] }: { initialContents?: Content[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get("c");
  const selectedSubcategoryId = searchParams.get("s");

  const catalogLevel: CatalogLevel =
    selectedCategoryId && selectedSubcategoryId
      ? "contents"
      : selectedCategoryId
        ? "subcategories"
        : "categories";

  const [items, setItems] = useState<Content[]>(initialContents);
  const [contentsItems, setContentsItems] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(initialContents.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [, setTotal] = useState<number | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [categories, setCategories] = useState<Category[]>(() => resolveCatalogCategories([]));
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [contentTypeFilter, setContentTypeFilter] = useState<"all" | ContentType>("all");
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

  const goToCategories = useCallback(() => {
    router.replace("/mes-contenus", { scroll: false });
  }, [router]);

  const goToSubcategories = useCallback(
    (categoryId: string) => {
      router.replace(`/mes-contenus?c=${encodeURIComponent(categoryId)}`, { scroll: false });
    },
    [router]
  );

  const goToContents = useCallback(
    (categoryId: string, subcategoryId: string) => {
      router.replace(
        `/mes-contenus?c=${encodeURIComponent(categoryId)}&s=${encodeURIComponent(subcategoryId)}`,
        { scroll: false }
      );
    },
    [router]
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingSubcategories(true);
      try {
        const response = await fetch("/api/subcategories", { cache: "no-store" });
        const json = (await response.json()) as { data?: Subcategory[] };
        if (!isMounted) return;
        const apiSubs = Array.isArray(json.data) ? json.data : [];
        const { withDemoSubcategoriesFallback } = await import("../../lib/demoSubcategories");
        setSubcategories(withDemoSubcategoriesFallback(apiSubs));
      } catch {
        if (isMounted) {
          const { withDemoSubcategoriesFallback } = await import("../../lib/demoSubcategories");
          setSubcategories(withDemoSubcategoriesFallback([]));
        }
      } finally {
        if (isMounted) setLoadingSubcategories(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (initialContents.length > 0) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      let resolvedCategories = resolveCatalogCategories([]);
      try {
        const catRes = await fetch("/api/categories", { cache: "no-store" });
        const catJson = (await catRes.json()) as { data?: Category[] };
        resolvedCategories = resolveCatalogCategories(
          Array.isArray(catJson.data) ? catJson.data : []
        );
      } catch {
        /* catégories fixes en local */
      }
      if (!isMounted) return;
      setCategories(resolvedCategories);

      try {
        const response = await fetch(buildContentQuery(0, { stats: true, limit: CATALOG_STATS_LIMIT }), {
          cache: "no-store",
        });
        const result = (await response.json()) as ContentApiResponse;
        if (!isMounted) return;
        if (Array.isArray(result.data)) {
          const source = await withDevCatalogFallback(result.data, { siteUsesDemo: usingFallback });
          const merged = attachCategoryIds(source, resolvedCategories);
          setUsingFallback(ENABLE_DEV_FALLBACKS && result.data.length === 0 && merged.length > 0);
          setItems(merged);
          setTotal(typeof result.total === "number" ? result.total : merged.length);
        } else {
          const source = await withDevCatalogFallback([], { siteUsesDemo: true });
          setItems(attachCategoryIds(source, resolvedCategories));
        }
      } catch {
        const source = await withDevCatalogFallback([], { siteUsesDemo: true });
        setItems(attachCategoryIds(source, resolvedCategories));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (catalogLevel !== "contents" || !selectedSubcategoryId) {
      setContentsItems([]);
      setOffset(0);
      setHasMore(false);
      return;
    }

    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          buildContentQuery(0, { subcategoryId: selectedSubcategoryId }),
          { cache: "no-store" }
        );
        const result = (await response.json()) as ContentApiResponse;
        if (!isMounted) return;
        if (Array.isArray(result.data)) {
          const source = await withDevCatalogFallback(result.data, {
            subcategoryId: selectedSubcategoryId,
            siteUsesDemo: usingFallback,
          });
          const merged = attachCategoryIds(source, categories);
          setContentsItems(merged);
          setOffset(result.data.length);
          setHasMore(Boolean(result.hasMore) && result.data.length > 0);
        } else {
          const source = await withDevCatalogFallback([], {
            subcategoryId: selectedSubcategoryId,
            siteUsesDemo: usingFallback,
          });
          setContentsItems(attachCategoryIds(source, categories));
          setHasMore(false);
        }
      } catch {
        if (isMounted) {
          const source = await withDevCatalogFallback([], {
            subcategoryId: selectedSubcategoryId,
            siteUsesDemo: usingFallback,
          });
          setContentsItems(attachCategoryIds(source, categories));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [catalogLevel, selectedSubcategoryId, categories, usingFallback]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || usingFallback || catalogLevel !== "contents" || !selectedSubcategoryId) {
      return;
    }
    setIsLoadingMore(true);
    try {
      const response = await fetch(
        buildContentQuery(offset, { subcategoryId: selectedSubcategoryId }),
        { cache: "no-store" }
      );
      const result = (await response.json()) as ContentApiResponse;
      const batch = Array.isArray(result.data) ? result.data : [];
      if (batch.length > 0) {
        const merged = attachCategoryIds(batch, categories);
        setContentsItems((prev) => {
          const seen = new Set(prev.map((i) => i.id));
          const next = merged.filter((i) => !seen.has(i.id));
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
  }, [catalogLevel, categories, hasMore, isLoadingMore, offset, selectedSubcategoryId, usingFallback]);

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

  useEffect(() => {
    setContentTypeFilter("all");
  }, [selectedSubcategoryId]);

  const rubriqueItems = useMemo(() => {
    if (catalogLevel !== "contents" || !selectedSubcategoryId) return [];
    return contentsItems;
  }, [contentsItems, catalogLevel, selectedSubcategoryId]);

  const filteredItems = useMemo(() => {
    if (contentTypeFilter === "all") return rubriqueItems;
    return rubriqueItems.filter((item) => item.type === contentTypeFilter);
  }, [rubriqueItems, contentTypeFilter]);

  const rubriqueTypeCounts = useMemo(() => countByContentType(rubriqueItems), [rubriqueItems]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const selectedSubcategory = useMemo(
    () => subcategories.find((s) => s.id === selectedSubcategoryId) ?? null,
    [subcategories, selectedSubcategoryId]
  );

  const sortedCatalogItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredItems]);

  const catalogHero = useMemo(() => {
    if (catalogLevel !== "contents") return null;
    return (
      sortedCatalogItems.find((item) => item.is_featured && item.status === "published") ?? null
    );
  }, [sortedCatalogItems, catalogLevel]);

  const catalogGridItems = useMemo(() => {
    if (!catalogHero) return sortedCatalogItems;
    return sortedCatalogItems.filter((item) => item.id !== catalogHero.id);
  }, [sortedCatalogItems, catalogHero]);

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
        ".mes-contenus-head, .catalog-tierCard",
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: motion.duration.revealFast,
          ease: motion.ease.out,
          stagger: motion.duration.staggerTight,
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
  }, [isLoading, catalogLevel, scheduleScrollTriggerRefresh]);

  useEffect(() => {
    if (isLoading) return;
    if (isReducedMotion()) return;
    scheduleScrollTriggerRefresh();
  }, [isLoading, items.length, sortedCatalogItems.length, catalogLevel, scheduleScrollTriggerRefresh]);

  const showEmptyGlobal =
    !isLoading && !usingFallback && items.length === 0 && catalogLevel === "categories";
  const showEmptyContents =
    catalogLevel === "contents" &&
    !isLoading &&
    !hasMore &&
    rubriqueItems.length === 0;
  const showEmptyFormatFilter =
    catalogLevel === "contents" &&
    !isLoading &&
    rubriqueItems.length > 0 &&
    filteredItems.length === 0;

  return (
    <section className="mes-contenus-page contenus-page catalog-hub mes-canal-page" ref={pageRef}>
      <div className="container mes-canal__container">
        <CatalogHub
          level={catalogLevel}
          categories={categories}
          subcategories={subcategories}
          items={items}
          selectedCategoryId={selectedCategoryId}
          selectedSubcategoryId={selectedSubcategoryId}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          isLoading={catalogLevel === "categories" ? isLoading : loadingSubcategories}
          onSelectCategory={goToSubcategories}
          onSelectSubcategory={(subId) => {
            if (selectedCategoryId) goToContents(selectedCategoryId, subId);
          }}
          onBackToCategories={goToCategories}
          onBackToSubcategories={() => {
            if (selectedCategoryId) goToSubcategories(selectedCategoryId);
          }}
        >
          {showEmptyGlobal ? (
            <p className="contenus-empty muted">Les premiers contenus arrivent bientôt.</p>
          ) : null}

          {showEmptyContents ? (
            <p className="contenus-empty muted">Aucun contenu dans cette rubrique.</p>
          ) : null}

          {showEmptyFormatFilter ? (
            <p className="contenus-empty muted">Aucun contenu pour ce format dans la rubrique.</p>
          ) : null}

          {!showEmptyGlobal && !showEmptyContents && !showEmptyFormatFilter ? (
            <div className="mes-canal__main mes-canal__main--solo">
              {rubriqueItems.length > 0 ? (
                <div className="catalog-formatFilter" role="tablist" aria-label="Filtrer par format">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={contentTypeFilter === "all"}
                    className={`catalog-formatFilter__chip${contentTypeFilter === "all" ? " is-active" : ""}`}
                    onClick={() => setContentTypeFilter("all")}
                  >
                    Tous ({rubriqueItems.length})
                  </button>
                  {rubriqueTypeCounts.video > 0 ? (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={contentTypeFilter === "video"}
                      className={`catalog-formatFilter__chip${contentTypeFilter === "video" ? " is-active" : ""}`}
                      onClick={() => setContentTypeFilter("video")}
                    >
                      Vidéos ({rubriqueTypeCounts.video})
                    </button>
                  ) : null}
                  {rubriqueTypeCounts.article > 0 ? (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={contentTypeFilter === "article"}
                      className={`catalog-formatFilter__chip${contentTypeFilter === "article" ? " is-active" : ""}`}
                      onClick={() => setContentTypeFilter("article")}
                    >
                      Publications ({rubriqueTypeCounts.article})
                    </button>
                  ) : null}
                  {rubriqueTypeCounts.audio > 0 ? (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={contentTypeFilter === "audio"}
                      className={`catalog-formatFilter__chip${contentTypeFilter === "audio" ? " is-active" : ""}`}
                      onClick={() => setContentTypeFilter("audio")}
                    >
                      Audio ({rubriqueTypeCounts.audio})
                    </button>
                  ) : null}
                </div>
              ) : null}
              <section
                id="catalogue"
                className="mes-contenus-section contenus-section mes-hub__featured mes-canal__catalog"
                aria-label="Contenus de la rubrique"
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

              {!isLoading && catalogLevel === "contents" && hasMore ? (
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
          ) : null}
        </CatalogHub>
      </div>
    </section>
  );
}

export default function MesContenusCatalogClientWithSuspense({
  initialContents = [],
}: {
  initialContents?: Content[];
}) {
  return (
    <Suspense
      fallback={
        <section className="mes-contenus-page contenus-page catalog-hub mes-canal-page">
          <div className="container mes-canal__container">
            <p className="contenus-pending muted" role="status">
              Chargement du catalogue…
            </p>
          </div>
        </section>
      }
    >
      <MesContenusCatalogClient initialContents={initialContents} />
    </Suspense>
  );
}
