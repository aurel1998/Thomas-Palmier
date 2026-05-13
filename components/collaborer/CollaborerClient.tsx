"use client";

import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";
import { CREDIBILITY_MEDIA, type CredibilityLogoItem } from "../../lib/credibility";
import { HOME_PARTNER_LOGOS, type PartnerLogo } from "../../lib/partners";
import { SocialProofBand } from "../social-proof-band";

function CollabLogoMark({ item }: { item: CredibilityLogoItem | PartnerLogo }) {
  const hasLogo = Boolean(item.logoSrc);

  return (
    <div className="collab-biz__logo collab-biz__logo--mark" data-collab-reveal>
      {hasLogo && item.logoSrc ? (
        <div className="collab-biz__logoVisual">
          <Image src={item.logoSrc} alt="" fill className="collab-biz__logoImg" sizes="200px" />
          <span className="u-visuallyHidden">{item.name}</span>
        </div>
      ) : (
        <>
          <span>{item.initials ?? item.name.slice(0, 2).toUpperCase()}</span>
          <small>{item.name}</small>
        </>
      )}
    </div>
  );
}

const OFFERS = [
  {
    title: "Brand content éditorial",
    text: "Formats sponsorisés qui gardent une exigence journalistique et une vraie valeur de lecture.",
  },
  {
    title: "Couverture événementielle",
    text: "Matchs, salons, activations : dispositif terrain + diffusion multi-format rapide.",
  },
  {
    title: "Série de contenus",
    text: "Programme en épisodes (vidéo, texte, audio) pour installer votre message dans le temps.",
  },
] as const;

const AUDIENCE = [
  { metric: "40k+", label: "lecteurs/mois", note: "principalement 18-39 ans, mobile-first" },
  { metric: "6.2%", label: "engagement moyen", note: "sur les formats narratifs longs" },
  { metric: "2m50", label: "temps de lecture", note: "sur les dossiers approfondis" },
] as const;

const CASES = [
  {
    title: "Activation partenaire club",
    challenge: "Rendre lisible une opération de sponsoring locale.",
    result: "Série de 3 contenus terrain, +28% d’interactions qualifiées.",
  },
  {
    title: "Lancement produit sport",
    challenge: "Éviter le ton publicitaire classique.",
    result: "Traitement éditorial en angle usage + interview, CTR x1.9.",
  },
  {
    title: "Valorisation institution",
    challenge: "Transformer un sujet institutionnel en récit clair.",
    result: "Dossier pédagogique + vidéo, reprise par médias partenaires.",
  },
] as const;

export function CollaborerClient() {
  const pageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    if (!isReducedMotion()) {
      ensureScrollTrigger();
      const ctx = gsap.context(() => {
        const sections = root.querySelectorAll<HTMLElement>(".collab-biz__section");
        sections.forEach((section) => {
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
      }, root);
      return () => {
        ctx.revert();
      };
    }
    return undefined;
  }, []);

  return (
    <section ref={pageRef} className="collab-page collab-biz">
      <div className="container">
        <section className="collab-biz__section collab-biz__hero">
          <div className="collab-biz__heroCopy" data-collab-reveal>
            <div className="home-sectionEyebrow">Collaborer</div>
            <h1 className="collab-biz__title">Un dispositif éditorial qui convertit.</h1>
            <p className="collab-biz__sub muted">
              Nous produisons des récits sport qui servent vos objectifs business : visibilité, crédibilité
              et engagement qualifié.
            </p>
          </div>
          <div className="collab-biz__heroKpis" data-collab-reveal>
            <div className="collab-biz__kpi">
              <strong>+40k</strong>
              <span>lecteurs/mois</span>
            </div>
            <div className="collab-biz__kpi">
              <strong>6.2%</strong>
              <span>engagement moyen</span>
            </div>
            <div className="collab-biz__kpi">
              <strong>2m50</strong>
              <span>temps de lecture</span>
            </div>
          </div>
        </section>

        <SocialProofBand title="Preuves de crédibilité" className="social-proof--collab" />

        <section className="collab-biz__section">
          <header className="collab-biz__head" data-collab-reveal>
            <p className="home-sectionEyebrow">Offres</p>
            <h2>Ce que nous mettons en place</h2>
          </header>
          <div className="collab-biz__grid collab-biz__grid--3">
            {OFFERS.map((offer) => (
              <article key={offer.title} className="collab-biz__card" data-collab-reveal>
                <h3>{offer.title}</h3>
                <p>{offer.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="collab-biz__section">
          <header className="collab-biz__head" data-collab-reveal>
            <p className="home-sectionEyebrow">Audience</p>
            <h2>Des signaux utiles pour vos campagnes</h2>
          </header>
          <div className="collab-biz__grid collab-biz__grid--3">
            {AUDIENCE.map((a) => (
              <article key={a.metric + a.label} className="collab-biz__card collab-biz__card--metric" data-collab-reveal>
                <strong>{a.metric}</strong>
                <h3>{a.label}</h3>
                <p>{a.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="collab-biz__section">
          <header className="collab-biz__head" data-collab-reveal>
            <p className="home-sectionEyebrow">Partenaires</p>
            <h2>Écosystème média & marques</h2>
          </header>
          <div className="collab-biz__partners">
            {CREDIBILITY_MEDIA.map((m) => (
              <CollabLogoMark key={m.id} item={m} />
            ))}
            {HOME_PARTNER_LOGOS.slice(0, 4).map((p) => (
              <CollabLogoMark key={p.id} item={p} />
            ))}
          </div>
        </section>

        <section className="collab-biz__section">
          <header className="collab-biz__head" data-collab-reveal>
            <p className="home-sectionEyebrow">Cas concrets</p>
            <h2>De l’objectif au résultat</h2>
          </header>
          <div className="collab-biz__grid collab-biz__grid--3">
            {CASES.map((c) => (
              <article key={c.title} className="collab-biz__card" data-collab-reveal>
                <h3>{c.title}</h3>
                <p>
                  <strong>Enjeu :</strong> {c.challenge}
                </p>
                <p>
                  <strong>Résultat :</strong> {c.result}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="collab-biz__section collab-biz__ctaWrap">
          <div className="collab-biz__cta" data-collab-reveal>
            <div>
              <p className="collab-biz__ctaEyebrow">Prêt à lancer un format ?</p>
              <h2>Parlons de votre prochain dispositif éditorial.</h2>
            </div>
            <Link
              id="collabCtaBtn"
              href="/contact"
              className="collab-ctaBtn is-pressable"
              aria-label="Aller au formulaire de contact"
            >
              Demander une proposition
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
