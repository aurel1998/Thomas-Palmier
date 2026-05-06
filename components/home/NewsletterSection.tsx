"use client";

import { FormEvent, useState } from "react";

const CONTACT_EMAIL = "contact@sportjournal.fr";

/**
 * Bloc newsletter simple : capture d'email sans friction.
 * Soumission via mailto en attendant un endpoint dédié.
 */
export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const canSubmit = email.trim().includes("@") && email.trim().length > 5;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    const subject = encodeURIComponent("Inscription newsletter");
    const body = encodeURIComponent(`Bonjour,\n\nJe souhaite m'inscrire à la newsletter avec : ${email.trim()}\n`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="home-newsletter" id="newsletter" aria-labelledby="home-newsletter-heading">
      <div className="container home-newsletter__inner">
        <div className="home-newsletter__card">
          <p className="home-sectionEyebrow">Newsletter</p>
          <h2 id="home-newsletter-heading" className="home-newsletter__title">
            Recevez les prochaines histoires
          </h2>
          <p className="muted home-newsletter__intro">
            Un email clair quand un nouveau contenu sort. Pas de spam, pas de bruit.
          </p>

          <form className="home-newsletter__form" onSubmit={onSubmit}>
            <label className="home-newsletter__label" htmlFor="newsletter-email">
              Email
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              S'abonner
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
