"use client";

import Link from "next/link";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef } from "react";
import { CREDIBILITY_AWARDS, CREDIBILITY_MEDIA } from "../../lib/credibility";
import {
  bindParallaxYPercent,
  ensureScrollTrigger,
  isMotionLite,
  isReducedMotion,
  motion,
} from "../../lib/gsapMotion";
import { HOME_PARTNER_LOGOS } from "../../lib/partners";
import { BrandLogo } from "../media/BrandLogo";

const OFFERS = [
  { title: "Brand content", tag: "Sponsorisé · éditorial" },
  { title: "Événement", tag: "Terrain · multi-format" },
  { title: "Série", tag: "Vidéo · texte · audio" },
] as const;

const CASES = [
  {
    n: "01",
    title: "Club professionnel",
    format: "Série brand content — vidéo & réseaux sociaux",
    result: "+28 % d’interactions qualifiées",
    detail: "Par rapport à la campagne de la saison précédente",
  },
  {
    n: "02",
    title: "Marque sport & lifestyle",
    format: "Reportage terrain + déclinaisons pour le lancement",
    result: "Taux de clic publicitaire ×1,9",
    detail: "Sur la fenêtre de lancement produit",
  },
  {
    n: "03",
    title: "Institution sportive",
    format: "Dossier long format & contenus partenaires",
    result: "4 reprises médias",
    detail: "Presse et web partenaires",
  },
] as const;

const LOGO_WALL = [...CREDIBILITY_MEDIA, ...HOME_PARTNER_LOGOS];
const HERO_TITLE = "Récits sport qui servent vos objectifs.";

export function CollaborerClient() {
  const pageRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const heroMediaRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useLayoutEffect(() => {
    const hero = heroRef.current;
    const media = heroMediaRef.current;
    const title = titleRef.current;
    if (!hero || !media || !title) return;

    const eyebrow = hero.querySelector<HTMLElement>(".collab-biz__heroEyebrow");
    const sub = hero.querySelector<HTMLElement>(".collab-biz__sub");
    const cta = hero.querySelector<HTMLElement>(".collab-biz__heroCta");
    const kpis = gsap.utils.toArray<HTMLElement>(hero.querySelectorAll(".collab-biz__kpi"));
    const rule = hero.querySelector<HTMLElement>(".collab-biz__heroRule");

    if (isReducedMotion()) {
      gsap.set([media, eyebrow, sub, cta, rule, ...kpis, title], { clearProps: "all" });
      return;
    }

    let split: { revert: () => void; words: Element[] } | null = null;
    let tl: gsap.core.Timeline | null = null;
    let cancelled = false;

    gsap.set(media, { scale: 1.12, y: 48 });
    gsap.set(title, { opacity: 0.001 });
    if (eyebrow) gsap.set(eyebrow, { y: 12, autoAlpha: 0 });
    if (rule) gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });
    if (sub) gsap.set(sub, { y: 18, autoAlpha: 0 });
    if (cta) gsap.set(cta, { y: 22, autoAlpha: 0 });
    if (kpis.length) gsap.set(kpis, { y: 28, autoAlpha: 0 });

    const runFallback = () => {
      if (cancelled) return;
      gsap.set(title, { opacity: 1 });
      tl = gsap.timeline({ defaults: { ease: motion.ease.out } });
      tl.to(media, { scale: 1, y: 0, duration: motion.duration.heroMedia, ease: motion.ease.outExpo }, 0)
        .to(eyebrow, { y: 0, autoAlpha: 1, duration: motion.duration.revealFast }, 0.1)
        .to(title, { opacity: 1, y: 0, duration: motion.duration.heroChars, ease: motion.ease.outLux }, 0.14)
        .to(rule, { scaleX: 1, duration: motion.duration.revealMed, ease: motion.ease.inOut }, 0.2)
        .to(sub, { y: 0, autoAlpha: 1, duration: motion.duration.revealMed }, 0.22)
        .to(cta, { y: 0, autoAlpha: 1, duration: motion.duration.revealMed }, 0.28)
        .to(kpis, { y: 0, autoAlpha: 1, duration: motion.duration.revealMed, stagger: 0.06 }, 0.32);
    };

    if (isMotionLite()) {
      runFallback();
      return () => {
        cancelled = true;
        tl?.kill();
      };
    }

    void import("gsap/SplitText")
      .then(({ SplitText }) => {
        if (cancelled || !titleRef.current) return;
        gsap.registerPlugin(SplitText);
        split = new SplitText(titleRef.current, {
          type: "words",
          mask: "words",
          wordsClass: "collab-biz__titleWord",
          aria: "auto",
        });

        const words = split.words as HTMLElement[];
        gsap.set(title, { opacity: 1 });
        gsap.set(words, { yPercent: 108, opacity: 0 });

        tl = gsap.timeline({ defaults: { ease: motion.ease.out } });
        tl.to(media, { scale: 1, y: 0, duration: motion.duration.heroMedia, ease: motion.ease.outExpo }, 0)
          .to(eyebrow, { y: 0, autoAlpha: 1, duration: motion.duration.revealFast }, 0.08)
          .to(
            words,
            {
              yPercent: 0,
              opacity: 1,
              duration: motion.duration.heroChars,
              stagger: { each: 0.045, from: "start" },
              ease: motion.ease.outLux,
            },
            0.12
          )
          .to(rule, { scaleX: 1, duration: motion.duration.revealMed + 0.08, ease: motion.ease.inOut }, 0.18)
          .to(sub, { y: 0, autoAlpha: 1, duration: motion.duration.revealMed }, 0.24)
          .to(cta, { y: 0, autoAlpha: 1, duration: motion.duration.revealMed }, 0.3)
          .to(kpis, { y: 0, autoAlpha: 1, duration: motion.duration.revealMed, stagger: 0.07 }, 0.34);
      })
      .catch(runFallback);

    return () => {
      cancelled = true;
      tl?.kill();
      split?.revert();
    };
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    const hero = heroRef.current;
    const media = heroMediaRef.current;
    if (!root) return;

    if (isReducedMotion()) return;

    ensureScrollTrigger();
    const ctx = gsap.context(() => {
      if (hero && media && !isMotionLite()) {
        bindParallaxYPercent(media, hero, motion.parallax.yPercent * 1.1);
        const mesh = hero.querySelector<HTMLElement>(".collab-biz__heroMesh");
        if (mesh) {
          gsap.fromTo(
            mesh,
            { yPercent: -4 },
            {
              yPercent: 8,
              ease: motion.ease.none,
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: motion.parallax.scrub,
              },
            }
          );
        }
      }

      root.querySelectorAll<HTMLElement>(".collab-biz__section").forEach((section) => {
        const nodes = section.querySelectorAll<HTMLElement>("[data-collab-reveal]");
        if (!nodes.length) return;
        gsap.fromTo(
          nodes,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: motion.duration.revealMed,
            ease: motion.ease.out,
            stagger: motion.duration.staggerTight,
            scrollTrigger: {
              trigger: section,
              start: motion.scroll.startRevealTight,
              toggleActions: motion.scroll.togglePlay,
            },
          }
        );
      });

      const disposers: Array<() => void> = [];
      if (!isMotionLite()) {
        root.querySelectorAll<HTMLElement>(".collab-biz__bentoCell").forEach((cell) => {
          const onMove = (e: PointerEvent) => {
            const rect = cell.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            gsap.to(cell, {
              x: x * 10,
              y: y * 8 - 3,
              duration: motion.duration.uiSnap,
              ease: motion.ease.outSoft,
            });
          };
          const onLeave = () => {
            gsap.to(cell, { x: 0, y: 0, duration: motion.duration.revealFast, ease: motion.ease.out });
          };
          cell.addEventListener("pointermove", onMove);
          cell.addEventListener("pointerleave", onLeave);
          disposers.push(() => {
            cell.removeEventListener("pointermove", onMove);
            cell.removeEventListener("pointerleave", onLeave);
          });
        });
      }

      return () => {
        disposers.forEach((d) => d());
      };
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={pageRef} className="collab-page collab-biz">
      <header ref={heroRef} className="collab-biz__heroBleed" aria-labelledby="collab-hero-title">
        <div ref={heroMediaRef} className="collab-biz__heroMedia" aria-hidden="true">
          <div className="collab-biz__heroMesh" />
          <div className="collab-biz__heroGrain" />
          <div className="collab-biz__heroOrb collab-biz__heroOrb--a" />
          <div className="collab-biz__heroOrb collab-biz__heroOrb--b" />
        </div>
        <div className="collab-biz__heroOverlay" aria-hidden="true" />
        <div className="container collab-biz__heroInner">
          <div className="collab-biz__heroGrid">
            <div className="collab-biz__heroCopy">
              <p className="home-sectionEyebrow collab-biz__heroEyebrow">Collaborer</p>
              <span className="collab-biz__heroRule" aria-hidden="true" />
              <h1 id="collab-hero-title" ref={titleRef} className="collab-biz__title collab-biz__title--split">
                {HERO_TITLE}
              </h1>
              <p className="collab-biz__sub muted">
                Visibilité, crédibilité, engagement — sans sacrifier l’exigence éditoriale.
              </p>
              <Link href="/contact" className="btn btn-primary collab-biz__heroCta">
                Demander une proposition
              </Link>
            </div>
            <ul className="collab-biz__heroKpis" aria-label="Chiffres clés">
              <li className="collab-biz__kpi">
                <strong>40k+</strong>
                <span>lecteurs / mois</span>
              </li>
              <li className="collab-biz__kpi">
                <strong>6,2 %</strong>
                <span>engagement</span>
              </li>
              <li className="collab-biz__kpi">
                <strong>2m50</strong>
                <span>lecture dossier</span>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <div className="container collab-biz__container">
        <section className="collab-biz__section collab-biz__offers">
          <header className="collab-biz__head collab-biz__head--row" data-collab-reveal>
            <p className="home-sectionEyebrow">Formats</p>
            <h2>Ce qu’on produit</h2>
          </header>
          <div className="collab-biz__bento">
            {OFFERS.map((offer, i) => (
              <article
                key={offer.title}
                className={`collab-biz__bentoCell collab-biz__bentoCell--${i + 1}`}
                data-collab-reveal
              >
                <span className="collab-biz__bentoIndex">0{i + 1}</span>
                <h3>{offer.title}</h3>
                <p className="collab-biz__bentoTag">{offer.tag}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="collab-biz__section collab-biz__proof">
          <header className="collab-biz__head collab-biz__head--row" data-collab-reveal>
            <div>
              <p className="home-sectionEyebrow">Écosystème</p>
              <h2>Médias &amp; partenaires</h2>
            </div>
            <ul className="collab-biz__awards" aria-label="Récompenses">
              {CREDIBILITY_AWARDS.map((a) => (
                <li key={a.id}>
                  <span className="collab-biz__awardYear">{a.year}</span>
                  <span>{a.title}</span>
                </li>
              ))}
            </ul>
          </header>
          <div className="collab-biz__logoWall">
            {LOGO_WALL.map((item) => (
              <div key={item.id} className="collab-biz__logoCell">
                <BrandLogo
                  name={item.name}
                  logoSrc={item.logoSrc}
                  initials={item.initials}
                  className="brand-logo--cell"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="collab-biz__section collab-biz__cases">
          <header className="collab-biz__head" data-collab-reveal>
            <p className="home-sectionEyebrow">Résultats</p>
            <h2>Exemples de collaborations</h2>
            <p className="collab-biz__casesIntro muted">
              Objectif, format produit et bilan chiffré — pour vous projeter sur un projet similaire.
            </p>
          </header>
          <div className="collab-biz__casesTrack">
            {CASES.map((c) => (
              <article key={c.n} className="collab-biz__caseCard" data-collab-reveal>
                <span className="collab-biz__caseN">{c.n}</span>
                <h3>{c.title}</h3>
                <p className="collab-biz__caseFormat">{c.format}</p>
                <p className="collab-biz__caseResult">
                  <strong>{c.result}</strong>
                </p>
                <p className="collab-biz__caseDetail muted">{c.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="collab-biz__section collab-biz__ctaWrap">
          <div className="collab-biz__cta" data-collab-reveal>
            <h2>On structure votre prochain format.</h2>
            <Link
              id="collabCtaBtn"
              href="/contact"
              className="collab-ctaBtn is-pressable"
              aria-label="Aller au formulaire de contact"
            >
              Contact
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
