"use client";

import gsap from "gsap";
import { FormEvent, useEffect, useRef, useState } from "react";
import { SocialLinks } from "../SocialLinks";
import { ensureScrollTrigger, isReducedMotion, motion } from "../../lib/gsapMotion";
import { CONTACT_EMAIL } from "../../lib/sitePublic";
import type { SocialLinkDto } from "../../types/editorial";

type ContactPageClientProps = {
  displayName?: string;
  contactRole?: string;
  contactIntro?: string;
  socialLinks?: SocialLinkDto[];
};

type SubmitStatus = "idle" | "loading" | "success" | "error";

export function ContactPageClient({
  displayName = "",
  contactRole = "",
  contactIntro = "",
  socialLinks,
}: ContactPageClientProps) {
  const pageRef = useRef<HTMLElement | null>(null);
  const [requestType, setRequestType] = useState<"partenariat" | "sujet">("partenariat");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const canSubmit =
    name.trim().length > 1 &&
    email.trim().length > 4 &&
    message.trim().length > 8 &&
    status !== "loading";

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

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      const result = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setStatus("error");
        setFeedback(result.error ?? "Envoi impossible.");
        return;
      }

      setStatus("success");
      setFeedback(result.message ?? "Message envoyé. Merci !");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("Erreur réseau. Réessayez dans un instant.");
    }
  };

  return (
    <section ref={pageRef} className="contact-page">
      <div className="contact-bg" aria-hidden="true" />
      <div className="contact-overlay" aria-hidden="true" />

      <div className="container contact-wrap">
        <article className="contact-card">
          <p className="home-sectionEyebrow contact-reveal">Contact</p>
          {displayName ? <h1 className="contact-title contact-reveal">{displayName}</h1> : null}
          {contactRole ? <p className="contact-role contact-reveal">{contactRole}</p> : null}
          {contactIntro ? <p className="contact-intro contact-reveal">{contactIntro}</p> : null}

          <div className="contact-meta contact-reveal">
            <div className="contact-metaItem">
              <span>Email</span>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </div>
            <div className="contact-metaItem">
              <span>Réseaux sociaux</span>
              <div className="contact-socials">
                <SocialLinks links={socialLinks} />
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
                    disabled={status === "loading"}
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
                    disabled={status === "loading"}
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
                disabled={status === "loading"}
                required
              />
            </div>

            <div className="contact-field contact-reveal">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
                required
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
                disabled={status === "loading"}
                required
              />
            </div>

            {feedback ? (
              <p
                className={`contact-feedback contact-reveal${status === "success" ? " is-success" : ""}${status === "error" ? " is-error" : ""}`}
                role={status === "error" ? "alert" : "status"}
              >
                {feedback}
              </p>
            ) : null}

            <button
              id="contactSubmitBtn"
              type="submit"
              disabled={!canSubmit}
              className="contact-submit contact-reveal is-pressable"
            >
              {status === "loading" ? "Envoi en cours…" : "Envoyer la demande"}
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
