"use client";

import gsap from "gsap";
import { FormEvent, useEffect, useRef, useState } from "react";
import { SocialLinks } from "../SocialLinks";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";

export function ContactPageClient() {
  const pageRef = useRef<HTMLElement | null>(null);
  const [requestType, setRequestType] = useState<"partenariat" | "sujet">("partenariat");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const canSubmit = name.trim().length > 1 && email.trim().length > 4 && message.trim().length > 8;

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    let revertCtx: (() => void) | undefined;

    if (isReducedMotion()) {
      gsap.set(root.querySelectorAll(".contact-reveal"), { autoAlpha: 1, y: 0 });
    } else {
      ensureScrollTrigger();
      const ctx = gsap.context(() => {
        gsap.fromTo(
          root.querySelectorAll(".contact-reveal"),
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: motion.duration.revealMed,
            ease: motion.ease.out,
            stagger: motion.duration.stagger,
            scrollTrigger: {
              trigger: root.querySelector(".contact-card"),
              start: motion.scroll.startReveal,
              toggleActions: motion.scroll.togglePlay,
            },
          }
        );
      }, root);
      revertCtx = () => ctx.revert();
    }

    return () => {
      revertCtx?.();
    };
  }, []);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    const subject = encodeURIComponent(
      requestType === "partenariat" ? "Demande de partenariat" : "Proposition de sujet"
    );
    const body = encodeURIComponent(
      [
        `Type de demande : ${requestType === "partenariat" ? "Partenariat" : "Sujet"}`,
        `Nom : ${name.trim()}`,
        `Email : ${email.trim()}`,
        "",
        "Message :",
        message.trim(),
      ].join("\n")
    );
    window.location.href = `mailto:contact@sportjournal.fr?subject=${subject}&body=${body}`;
  };

  return (
    <section ref={pageRef} className="contact-page">
      <div className="contact-bg" aria-hidden="true" />
      <div className="contact-overlay" aria-hidden="true" />

      <div className="container contact-wrap">
        <article className="contact-card">
          <p className="home-sectionEyebrow contact-reveal">Contact</p>
          <h1 className="contact-title contact-reveal">Thomas Palmier</h1>
          <p className="contact-role contact-reveal">Journaliste sportif</p>
          <p className="contact-intro contact-reveal">
            Expliquez votre demande en quelques lignes. Réponse rapide et cadrage clair.
          </p>

          <div className="contact-meta contact-reveal">
            <div className="contact-metaItem">
              <span>Email</span>
              <a href="mailto:contact@sportjournal.fr">contact@sportjournal.fr</a>
            </div>
            <div className="contact-metaItem">
              <span>Réseaux sociaux</span>
              <div className="contact-socials">
                <SocialLinks />
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={onSubmit}>
            <fieldset className="contact-requestType contact-reveal">
              <legend>Type de demande</legend>
              <div className="contact-requestType__options">
                <label>
                  <input
                    type="radio"
                    name="request-type"
                    value="partenariat"
                    checked={requestType === "partenariat"}
                    onChange={() => setRequestType("partenariat")}
                  />
                  <span>Partenariat</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="request-type"
                    value="sujet"
                    checked={requestType === "sujet"}
                    onChange={() => setRequestType("sujet")}
                  />
                  <span>Sujet</span>
                </label>
              </div>
            </fieldset>

            <div className="contact-field contact-reveal">
              <label htmlFor="contact-name">Nom</label>
              <input
                id="contact-name"
                name="name"
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="contact-field contact-reveal">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="contact@sportjournal.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="contact-field contact-reveal">
              <label htmlFor="contact-message">
                {requestType === "partenariat" ? "Message (objectif business)" : "Message (angle proposé)"}
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={6}
                placeholder={
                  requestType === "partenariat"
                    ? "Contexte, objectif, timing, budget indicatif..."
                    : "Sujet, angle, sources, pourquoi maintenant..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              id="contactSubmitBtn"
              type="submit"
              disabled={!canSubmit}
              className="contact-submit contact-reveal is-pressable"
            >
              Envoyer la demande
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
