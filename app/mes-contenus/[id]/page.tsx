"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AudioPlayer } from "../../../components/media/AudioPlayer";
import { ContentImage } from "../../../components/media/ContentImage";
import { VideoPlayer } from "../../../components/media/VideoPlayer";
import { buildHybridBlocks, toParagraphs, type HybridBlock } from "../../../lib/hybridContent";
import { isLikelyAudioUrl } from "../../../lib/mediaSource";
import type { Content } from "../../../types/content";

type ContentByIdResponse = { data?: Content; error?: string };

export default function HybridContentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [resumeReady, setResumeReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/content/${id}`, { cache: "no-store" });
        const payload = (await res.json()) as ContentByIdResponse;
        if (cancelled) return;
        if (!res.ok || !payload.data) {
          setError(payload.error ?? "Contenu introuvable.");
          setItem(null);
          return;
        }
        setItem(payload.data);
      } catch {
        if (!cancelled) {
          setError("Impossible de charger ce contenu.");
          setItem(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const blocks = useMemo(() => (item ? buildHybridBlocks(item) : []), [item]);
  const textChapters = useMemo(
    () => {
      const chapters: Array<{ id: string; title: string }> = [];
      blocks.forEach((block, index) => {
        if (block.type !== "text") return;
        if (!block.title) return;
        chapters.push({ id: `chapter-${index}`, title: block.title });
      });
      return chapters;
    },
    [blocks]
  );

  useEffect(() => {
    if (!id) return;
    const key = `story-progress:${id}`;
    const saved = window.localStorage.getItem(key);
    if (!saved) return;
    const value = Number.parseFloat(saved);
    if (Number.isFinite(value) && value > 8) {
      setProgress(Math.max(0, Math.min(100, value)));
      setResumeReady(true);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const key = `story-progress:${id}`;
    let rafId = 0;
    let lastSaved = -1;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        const pct = Math.max(0, Math.min(100, (window.scrollY / max) * 100));
        setProgress(pct);
        // Evite des ecritures storage a chaque pixel de scroll.
        const rounded = Math.round(pct * 10) / 10;
        if (rounded !== lastSaved) {
          lastSaved = rounded;
          window.localStorage.setItem(key, rounded.toFixed(1));
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [id]);

  const resumeReading = () => {
    if (!id) return;
    const key = `story-progress:${id}`;
    const saved = window.localStorage.getItem(key);
    const value = Number.parseFloat(saved ?? "");
    if (!Number.isFinite(value)) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    window.scrollTo({ top: (value / 100) * max, behavior: "smooth" });
  };

  return (
    <section className="hybrid-content">
      <div className="container hybrid-content__container">
        <header className="hybrid-content__head">
          {!loading && item ? (
            <div className="hybrid-content__progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${Math.max(0.03, progress / 100)})` }} />
            </div>
          ) : null}
          <Link href="/mes-contenus" className="hybrid-content__back">
            Retour aux contenus
          </Link>
          {item ? <p className="home-sectionEyebrow">{item.tags[0] ?? "Édition"}</p> : null}
          <h1 className="hybrid-content__title">
            {loading ? "Ouverture du contenu..." : item?.title ?? "Contenu"}
          </h1>
          {!loading && item ? (
            <div className="hybrid-content__metaRow">
              <span className="hybrid-content__progressLabel">Progression: {Math.round(progress)}%</span>
              {resumeReady ? (
                <button type="button" className="hybrid-content__resume" onClick={resumeReading}>
                  Reprendre la lecture
                </button>
              ) : null}
            </div>
          ) : null}
        </header>

        {error && !loading ? (
          <p className="hybrid-content__state muted" role="status">
            Ce contenu n’est plus disponible.
          </p>
        ) : null}

        {!loading && !error && blocks.length === 0 ? (
          <p className="hybrid-content__state muted" role="status">
            Aucun module disponible pour ce contenu.
          </p>
        ) : null}

        {!loading && !error && blocks.length > 0 ? (
          <article className={`hybrid-content__storyLayout${textChapters.length === 0 ? " hybrid-content__storyLayout--noToc" : ""}`}>
            {textChapters.length > 0 ? (
              <aside className="hybrid-content__toc" aria-label="Table des chapitres">
                <p className="hybrid-content__tocTitle">Chapitres</p>
                {textChapters.map((chapter) => (
                  <a key={chapter.id} href={`#${chapter.id}`} className="hybrid-content__tocLink">
                    {chapter.title}
                  </a>
                ))}
              </aside>
            ) : null}

            <div className="hybrid-content__story">
              {blocks.map((block, index) => (
              <HybridSection
                key={`${block.type}-${index}`}
                block={block}
                defaultPoster={item?.image_url}
                fallbackTitle={item?.title}
                sectionId={block.type === "text" ? `chapter-${index}` : undefined}
              />
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function HybridSection({
  block,
  defaultPoster,
  fallbackTitle,
  sectionId,
}: {
  block: HybridBlock;
  defaultPoster?: string;
  fallbackTitle?: string;
  sectionId?: string;
}) {
  if (block.type === "video") {
    return (
      <section className="hybrid-block hybrid-block--video">
        <VideoPlayer
          src={block.src}
          poster={block.poster ?? defaultPoster}
          title={block.title ?? fallbackTitle}
          className="hybrid-block__video"
        />
      </section>
    );
  }

  if (block.type === "image") {
    return (
      <section className="hybrid-block hybrid-block--image">
        <div className="hybrid-block__imageWrap">
          <ContentImage
            src={block.src}
            alt={block.alt ?? ""}
            fill
            sizes="(max-width: 960px) 100vw, 900px"
            className="hybrid-block__image"
          />
        </div>
        {block.caption ? <p className="hybrid-block__caption muted">{block.caption}</p> : null}
      </section>
    );
  }

  if (block.type === "embed") {
    if (isLikelyAudioUrl(block.src)) {
      return (
        <section className="hybrid-block hybrid-block--embed">
          <AudioPlayer src={block.src} title={block.title ?? fallbackTitle ?? "Audio"} variant="default" />
        </section>
      );
    }
    return (
      <section className="hybrid-block hybrid-block--embed">
        <div className="hybrid-block__embedWrap">
          <iframe
            src={block.src}
            title={block.title ?? "Embed"}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </section>
    );
  }

  const paragraphs = toParagraphs(block.body);
  return (
    <section className="hybrid-block hybrid-block--text" id={sectionId}>
      {block.title ? <h2 className="hybrid-block__title">{block.title}</h2> : null}
      <div className="hybrid-block__prose">
        {paragraphs.length > 0
          ? paragraphs.map((p, i) => <p key={i}>{p}</p>)
          : <p>{block.body}</p>}
      </div>
    </section>
  );
}
