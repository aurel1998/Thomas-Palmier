"use client";

import gsap from "gsap";
import Link from "next/link";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";
import { editionRiverSlotClass } from "../../lib/editionRiverLayout";
import { EDITORIAL_SERIES, groupByEditorialSeries, type EditorialSeriesId } from "../../lib/editorialSeries";
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

type EditorialTypeFilter = "Analyse" | "Reportage" | "Interview";
type EditorialThemeFilter = "Football" | "Culture sport" | "Business";
type EditorialFormatFilter = "Vidéo" | "Article" | "Audio";

const TYPE_FILTERS: readonly EditorialTypeFilter[] = ["Analyse", "Reportage", "Interview"];
const THEME_FILTERS: readonly EditorialThemeFilter[] = ["Football", "Culture sport", "Business"];
const FORMAT_FILTERS: readonly EditorialFormatFilter[] = ["Vidéo", "Article", "Audio"];

function normalizeToken(v: string): string {
  return v
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function textIncludesAny(text: string, needles: readonly string[]): boolean {
  const n = normalizeToken(text);
  return needles.some((needle) => n.includes(normalizeToken(needle)));
}

function matchTypeFilter(item: Content, f: EditorialTypeFilter): boolean {
  const blob = `${item.title} ${(item.tags ?? []).join(" ")} ${item.content}`;
  switch (f) {
    case "Analyse":
      return textIncludesAny(blob, ["analyse", "decryptage", "décryptage", "tactique", "opinion"]);
    case "Reportage":
      return textIncludesAny(blob, ["reportage", "terrain", "immersion", "chronique", "coulisses"]);
    case "Interview":
      return textIncludesAny(blob, ["interview", "entretien", "portrait", "temoignage", "témoignage"]);
    default:
      return false;
  }
}

function matchThemeFilter(item: Content, f: EditorialThemeFilter): boolean {
  const blob = `${item.title} ${(item.tags ?? []).join(" ")} ${item.content}`;
  switch (f) {
    case "Football":
      return textIncludesAny(blob, ["football", "ligue", "match", "stade", "ballon"]);
    case "Culture sport":
      return textIncludesAny(blob, ["culture sport", "tribune", "supporter", "histoire", "rituel", "ambiance"]);
    case "Business":
      return textIncludesAny(blob, ["business", "economie", "économie", "sponsoring", "droits tv", "marketing"]);
    default:
      return false;
  }
}

function matchFormatFilter(item: Content, f: EditorialFormatFilter): boolean {
  if (f === "Vidéo") return item.type === "video";
  if (f === "Article") return item.type === "article";
  return item.type === "audio";
}

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
  const [selectedTypes, setSelectedTypes] = useState<EditorialTypeFilter[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<EditorialThemeFilter[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<EditorialFormatFilter[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
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

  const availableTypeFilters = useMemo(
    () => TYPE_FILTERS.filter((f) => items.some((item) => matchTypeFilter(item, f))),
    [items]
  );
  const availableThemeFilters = useMemo(
    () => THEME_FILTERS.filter((f) => items.some((item) => matchThemeFilter(item, f))),
    [items]
  );
  const availableFormatFilters = useMemo(
    () => FORMAT_FILTERS.filter((f) => items.some((item) => matchFormatFilter(item, f))),
    [items]
  );

  useEffect(() => {
    setSelectedTypes((prev) => prev.filter((f) => availableTypeFilters.includes(f)));
  }, [availableTypeFilters]);

  useEffect(() => {
    setSelectedThemes((prev) => prev.filter((f) => availableThemeFilters.includes(f)));
  }, [availableThemeFilters]);

  useEffect(() => {
    setSelectedFormats((prev) => prev.filter((f) => availableFormatFilters.includes(f)));
  }, [availableFormatFilters]);

  const filteredItems = useMemo(() => {
    const hasType = selectedTypes.length > 0;
    const hasTheme = selectedThemes.length > 0;
    const hasFormat = selectedFormats.length > 0;
    const hasCategory = selectedCategoryIds.length > 0;

    return items.filter((item) => {
      if (hasType && !selectedTypes.some((f) => matchTypeFilter(item, f))) return false;
      if (hasTheme && !selectedThemes.some((f) => matchThemeFilter(item, f))) return false;
      if (hasFormat && !selectedFormats.some((f) => matchFormatFilter(item, f))) return false;
      if (hasCategory && (!item.category_id || !selectedCategoryIds.includes(item.category_id))) return false;
      return true;
    });
  }, [items, selectedTypes, selectedThemes, selectedFormats, selectedCategoryIds]);

  const featuredLead = useMemo(() => filteredItems[0] ?? null, [filteredItems]);
  const featuredDeck = useMemo(
    () => (featuredLead ? filteredItems.slice(1, 3) : filteredItems.slice(0, 2)),
    [filteredItems, featuredLead]
  );
  const recentItems = useMemo(
    () =>
      featuredLead
        ? filteredItems.slice(1 + featuredDeck.length)
        : filteredItems.slice(featuredDeck.length),
    [filteredItems, featuredLead, featuredDeck.length]
  );
  const groupedSeries = useMemo(() => groupByEditorialSeries(filteredItems), [filteredItems]);
  const hasSeries = useMemo(
    () => EDITORIAL_SERIES.some((serie) => groupedSeries[serie.id].length > 0),
    [groupedSeries]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (!item.category_id) continue;
      counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const popularItems = useMemo(() => {
    const base = featuredLead ? filteredItems.filter((i) => i.id !== featuredLead.id) : filteredItems;
    return [...base]
      .map((item, index) => {
        const tagScore = Math.min((item.tags ?? []).length, 5) * 10;
        const featuredScore = item.is_featured ? 1000 : 0;
        const freshnessScore = Math.max(0, 200 - index * 8);
        return { item, score: featuredScore + tagScore + freshnessScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.item);
  }, [filteredItems, featuredLead]);

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
        const head = section.querySelector(".contenus-sectionHead");
        if (head) {
          gsap.fromTo(
            head,
            { autoAlpha: 0, y: 28 },
            {
              autoAlpha: 1,
              y: 0,
              duration: motion.duration.revealMed,
              ease: motion.ease.out,
              scrollTrigger: {
                trigger: section,
                start: motion.scroll.startRevealTight,
                toggleActions: motion.scroll.toggleOnce,
              },
            }
          );
        }
        const cards = section.querySelectorAll(
          ".edition-slot .contenus-card, .contenus-feature, .mes-hub__popularRail .contenus-card"
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

        const chapters = section.querySelectorAll(".mes-story__chapter");
        if (chapters.length) {
          gsap.fromTo(
            chapters,
            { autoAlpha: 0, y: 38 },
            {
              autoAlpha: 1,
              y: 0,
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
  }, [isLoading, items.length, recentItems.length, scheduleScrollTriggerRefresh]);

  const showEmptyGlobal = !isLoading && !usingFallback && items.length === 0;
  const showEmptyFiltered = !isLoading && items.length > 0 && filteredItems.length === 0;

  const toggleFilter = <T extends string>(value: T, current: T[], set: (v: T[]) => void) => {
    set(current.includes(value) ? current.filter((x) => x !== value) : [...current, value]);
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedThemes([]);
    setSelectedFormats([]);
    setSelectedCategoryIds([]);
  };

  return (
    <section className="mes-contenus-page contenus-page broadcast-hub" ref={pageRef}>
      <div className="container">
        <header className="mes-contenus-head contenus-head mes-hub__head">
          <div className="mes-hub__headMain">
            <div className="home-sectionEyebrow">Hub éditorial</div>
            <h1 className="contenus-title">Mes contenus</h1>
            <p className="muted contenus-sub mes-hub__lede">
              Une édition pensée comme un média : ouverture forte, sélection mise en avant, puis flux
              récent pour prolonger l’histoire.
            </p>
          </div>
          <div className="mes-hub__meta" aria-live="polite">
            <span className="mes-hub__metaLabel">Édition en cours</span>
            <strong className="mes-hub__metaValue">
              {typeof total === "number" && total > 0 ? total : items.length}
            </strong>
            <span className="mes-hub__metaUnit">
              {typeof total === "number" && total > 1 ? "contenus" : "contenu"}
            </span>
          </div>
        </header>

        <nav className="mes-hub__storyNav" aria-label="Navigation du récit éditorial">
          <a href="#categories">Repères</a>
          <a href="#edition">Ouverture</a>
          <a href="#histoires-recentes">Histoires récentes</a>
          <a href="#histoires-populaires">Histoires populaires</a>
          <a href="#series">Séries</a>
        </nav>

        {showEmptyGlobal ? (
          <p className="contenus-empty muted">Les premiers contenus arrivent bientôt.</p>
        ) : null}

        {!showEmptyGlobal ? (
          <section
            id="categories"
            className="contenus-nav mes-hub__filters"
            aria-label="Filtres combinables"
          >
            <div className="mes-hub__filterGroup">
              <span className="mes-hub__filterLabel">Type</span>
              <div className="contenus-filters">
                {availableTypeFilters.map((f) => {
                  const active = selectedTypes.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`contenus-filter${active ? " is-active" : ""}`}
                      onClick={() => toggleFilter(f, selectedTypes, setSelectedTypes)}
                    >
                      <span className="contenus-filter__label">{f}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mes-hub__filterGroup">
              <span className="mes-hub__filterLabel">Thème</span>
              <div className="contenus-filters">
                {availableThemeFilters.map((f) => {
                  const active = selectedThemes.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`contenus-filter${active ? " is-active" : ""}`}
                      onClick={() => toggleFilter(f, selectedThemes, setSelectedThemes)}
                    >
                      <span className="contenus-filter__label">{f}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mes-hub__filterGroup">
              <span className="mes-hub__filterLabel">Format</span>
              <div className="contenus-filters">
                {availableFormatFilters.map((f) => {
                  const active = selectedFormats.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`contenus-filter${active ? " is-active" : ""}`}
                      onClick={() => toggleFilter(f, selectedFormats, setSelectedFormats)}
                    >
                      <span className="contenus-filter__label">{f}</span>
                    </button>
                  );
                })}
                <button type="button" className="contenus-filter" onClick={clearAllFilters}>
                  <span className="contenus-filter__label">Réinitialiser</span>
                </button>
              </div>
            </div>

            {categories.length > 0 ? (
              <div className="mes-hub__filterGroup">
                <span className="mes-hub__filterLabel">Catégories</span>
                <div className="contenus-filters">
                  {categories.map((c) => {
                    const active = selectedCategoryIds.includes(c.id);
                    const count = categoryCounts.get(c.id) ?? 0;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`contenus-filter${active ? " is-active" : ""}`}
                        onClick={() => toggleFilter(c.id, selectedCategoryIds, setSelectedCategoryIds)}
                      >
                        <span className="contenus-filter__label">
                          {c.name}
                          {count > 0 ? ` (${count})` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {showEmptyFiltered ? (
          <p className="contenus-empty muted">Aucun contenu ne correspond à vos filtres.</p>
        ) : null}

        {!showEmptyGlobal && !showEmptyFiltered ? (
          <>
            <section
            id="edition"
            className="mes-contenus-section contenus-section contenus-section--catalogue mes-hub__featured"
            aria-labelledby="mes-contenus-featured-title"
            >
            <SectionHeader
              eyebrow="Ouverture"
              title="À la une"
              subtitle="Les contenus qui incarnent la ligne éditoriale du moment."
              titleId="mes-contenus-featured-title"
            />

            {isLoading ? (
              <p className="contenus-pending muted" role="status">
                Chargement des contenus…
              </p>
            ) : (
              <>
                {featuredLead ? (
                  <div className="contenus-catalogue__hero mes-hub__lead" data-filter-node>
                    <FeatureContentCard item={featuredLead} />
                  </div>
                ) : null}
                {featuredDeck.length > 0 ? (
                  <div className="mes-hub__deck" role="list">
                    {featuredDeck.map((item, index) => (
                      <div
                        key={item.id}
                        className={`edition-slot ${editionRiverSlotClass(index)}`}
                        role="listitem"
                        data-filter-node
                      >
                        <ContenuCard item={item} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
            </section>

            {!isLoading && recentItems.length > 0 ? (
              <section
                className="mes-contenus-section contenus-section mes-hub__recent"
                id="histoires-recentes"
                aria-labelledby="mes-contenus-recent-title"
              >
                <SectionHeader
                  eyebrow="Suite"
                  title="Histoires récentes"
                  subtitle="Les dernières publications du flux éditorial."
                  titleId="mes-contenus-recent-title"
                />
                <div className="mes-storyline" role="list">
                  <span className="mes-storyline__rail" aria-hidden="true">
                    <span className="mes-storyline__progress" />
                  </span>
                  {recentItems.slice(0, 6).map((item, index) => (
                    <StoryChapter
                      key={item.id}
                      item={item}
                      index={index}
                      variant={index % 2 === 0 ? "left" : "right"}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {!isLoading && popularItems.length > 0 ? (
              <section
                className="mes-contenus-section contenus-section mes-hub__popular"
                id="histoires-populaires"
                aria-labelledby="mes-contenus-popular-title"
              >
                <SectionHeader
                  eyebrow="Impact"
                  title="Histoires populaires"
                  subtitle="Les narrations qui captent le plus l’attention et la mémoire."
                  titleId="mes-contenus-popular-title"
                />
                <div className="mes-storyline mes-storyline--compact" role="list">
                  <span className="mes-storyline__rail" aria-hidden="true">
                    <span className="mes-storyline__progress" />
                  </span>
                  {popularItems.slice(0, 4).map((item, index) => (
                    <StoryChapter key={item.id} item={item} index={index} variant="left" compact />
                  ))}
                </div>
              </section>
            ) : null}

            {!isLoading && hasSeries ? (
              <section
                className="mes-contenus-section contenus-section mes-hub__series"
                id="series"
                aria-labelledby="mes-contenus-series-title"
              >
                <SectionHeader
                  eyebrow="Collections"
                  title="Séries éditoriales"
                  subtitle="Une lecture par arcs narratifs, pour retrouver les contenus dans une logique média."
                  titleId="mes-contenus-series-title"
                />

                <div className="mes-hub__seriesGrid">
                  {EDITORIAL_SERIES.map((serie) => {
                    const serieItems = groupedSeries[serie.id];
                    if (serieItems.length === 0) return null;
                    return (
                      <SeriesCollection
                        key={serie.id}
                        id={serie.id}
                        title={serie.title}
                        lede={serie.lede}
                        items={serieItems}
                      />
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {!isLoading && filteredItems.length > 0 ? (
          <div className="contenus-flux" aria-live="polite">
            {isLoadingMore ? (
              <p className="contenus-flux__loading" role="status">
                <span className="contenus-flux__spinner" aria-hidden="true" />
                Suite du parcours…
              </p>
            ) : null}

            {!hasMore && !isLoadingMore ? (
              <p className="contenus-flux__end muted">
                Fin du fil
                {typeof total === "number" && total > 0 ? (
                  <>
                    {" · "}
                    <strong>{total}</strong> {total > 1 ? "passages" : "passage"}
                  </>
                ) : null}
              </p>
            ) : null}

            <div ref={sentinelRef} className="contenus-flux__sentinel" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  titleId,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  titleId: string;
}) {
  return (
    <header className="contenus-sectionHead">
      <div>
        <p className="home-sectionEyebrow">{eyebrow}</p>
        <h2 id={titleId} className="contenus-sectionTitle">
          {title}
        </h2>
      </div>
      <p className="contenus-sectionSub muted">{subtitle}</p>
    </header>
  );
}

function SeriesCollection({
  id,
  title,
  lede,
  items,
}: {
  id: EditorialSeriesId;
  title: string;
  lede: string;
  items: Content[];
}) {
  return (
    <article className="mes-hub__seriesCard" data-series-id={id} data-filter-node>
      <header className="mes-hub__seriesHead">
        <h3 className="mes-hub__seriesTitle">{title}</h3>
        <p className="mes-hub__seriesLede muted">{lede}</p>
      </header>
      <div className="mes-hub__seriesList" role="list">
        {items.slice(0, 4).map((item, index) => (
          <div
            key={`${id}-${item.id}`}
            className={`edition-slot ${editionRiverSlotClass(index)}`}
            role="listitem"
            data-filter-node
          >
            <ContenuCard item={item} intentRail />
          </div>
        ))}
      </div>
    </article>
  );
}

function toNarrativeExcerpt(item: Content): string {
  const source = `${item.content} ${(item.tags ?? []).join(" ")}`.replace(/\s+/g, " ").trim();
  if (!source) return "Un nouveau chapitre éditorial a ete publie.";
  return source.length > 180 ? `${source.slice(0, 177)}...` : source;
}

function toStoryLabel(item: Content): string {
  if (item.type === "video") return "Chapitre video";
  if (item.type === "audio") return "Chapitre audio";
  return "Chapitre ecrit";
}

function formatStoryDate(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "Edition recente";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function StoryChapter({
  item,
  index,
  variant,
  compact,
}: {
  item: Content;
  index: number;
  variant: "left" | "right";
  compact?: boolean;
}) {
  return (
    <article
      className={`mes-story__chapter mes-story__chapter--${variant}${compact ? " is-compact" : ""}`}
      role="listitem"
      data-filter-node
    >
      <div className="mes-story__mediaWrap">
        <div
          className="mes-story__media"
          style={{
            backgroundImage: `linear-gradient(180deg, rgb(var(--media-scrim-rgb) / 0.22), rgb(var(--media-scrim-rgb) / 0.78)), url(${item.image_url})`,
          }}
          aria-hidden="true"
        />
      </div>
      <div className="mes-story__body">
        <p className="mes-story__meta">
          <span>{toStoryLabel(item)}</span>
          <span>·</span>
          <span>{formatStoryDate(item.created_at)}</span>
        </p>
        <h3 className="mes-story__title">
          {index + 1}. {item.title}
        </h3>
        <p className="mes-story__excerpt">{toNarrativeExcerpt(item)}</p>
        <Link href={`/mes-contenus/${item.id}`} className="mes-story__link">
          Lire l'histoire complete
        </Link>
      </div>
    </article>
  );
}
