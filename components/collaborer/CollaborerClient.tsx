"use client";

import Link from "next/link";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { CREDIBILITY_AWARDS, CREDIBILITY_MEDIA } from "../../lib/credibility";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";
import { HOME_PARTNER_LOGOS } from "../../lib/partners";
import { BrandLogo } from "../media/BrandLogo";

const OFFERS = [
  { title: "Brand content", tag: "Sponsorisé · éditorial" },
  { title: "Événement", tag: "Terrain · multi-format" },
  { title: "Série", tag: "Vidéo · texte · audio" },
] as const;

const CASES = [
  { n: "01", title: "Activation club", result: "+28 % d’engagement qualifié" },
  { n: "02", title: "Lancement produit", result: "CTR ×1,9" },
  { n: "03", title: "Institution", result: "Reprise médias partenaires" },
] as const;

const LOGO_WALL = [...CREDIBILITY_MEDIA, ...HOME_PARTNER_LOGOS];

export function CollaborerClient() {
  const pageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root || isReducedMotion()) return;

    ensureScrollTrigger();
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>(".collab-biz__section").forEach((section) => {
        const nodes = section.querySelectorAll<HTMLElement>("[data-collab-reveal]");
        if (!nodes.length) return;
        gsap.fromTo(
          nodes,
          { autoAlpha: 0, y: 20 },
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
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={pageRef} className="collab-page collab-biz">
      <div className="container collab-biz__container">
        <section className="collab-biz__section collab-biz__hero">
          <div className="collab-biz__heroCopy" data-collab-reveal>
            <div className="home-sectionEyebrow">Collaborer</div>
            <h1 className="collab-biz__title">Récits sport qui servent vos objectifs.</h1>
            <p className="collab-biz__sub muted">
              Visibilité, crédibilité, engagement — sans sacrifier l’exigence éditoriale.
            </p>
            <Link href="/contact" className="btn btn-primary collab-biz__heroCta">
              Demander une proposition
            </Link>
          </div>
          <ul className="collab-biz__heroKpis" data-collab-reveal aria-label="Chiffres clés">
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
        </section>

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
          <div className="collab-biz__logoWall" data-collab-reveal>
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
            <h2>Cas repères</h2>
          </header>
          <div className="collab-biz__casesTrack">
            {CASES.map((c) => (
              <article key={c.n} className="collab-biz__caseCard" data-collab-reveal>
                <span className="collab-biz__caseN">{c.n}</span>
                <h3>{c.title}</h3>
                <p>{c.result}</p>
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
