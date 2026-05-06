"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const CONTACT_EMAIL = "contact@sportjournal.fr";

/**
 * Bloc plateforme : collecte simple de propositions de sujets.
 * Envoi via `mailto:` (sans backend dédié).
 */
export function PitchSubjectSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");

  const canSubmit = name.trim().length > 1 && email.trim().length > 4 && topic.trim().length > 6;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    const subject = encodeURIComponent(`Proposition de sujet — ${name.trim()}`);
    const body = encodeURIComponent(
      [
        `Nom : ${name.trim()}`,
        `Email : ${email.trim()}`,
        "",
        "Sujet proposé :",
        topic.trim(),
      ].join("\n")
    );

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="pitch-subject" id="proposer-sujet" aria-labelledby="pitch-subject-heading">
      <div className="container pitch-subject__inner">
        <header className="pitch-subject__head">
          <div className="home-sectionEyebrow">Plateforme</div>
          <h2 id="pitch-subject-heading" className="pitch-subject__title">
            Proposer un sujet
          </h2>
          <p className="muted pitch-subject__intro">
            Une idée forte, un angle local ou un dossier à creuser ? Soumettez votre sujet en quelques
            lignes.
          </p>
        </header>

        <div className="pitch-subject__card">
          <form className="pitch-subject__form" onSubmit={onSubmit}>
            <label className="pitch-subject__field">
              <span>Nom</span>
              <input
                name="name"
                autoComplete="name"
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="pitch-subject__field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="pitch-subject__field pitch-subject__field--full">
              <span>Sujet</span>
              <textarea
                name="topic"
                rows={4}
                placeholder="Titre, contexte, angle journalistique..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>

            <div className="pitch-subject__actions pitch-subject__field--full">
              <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                Envoyer le sujet
              </button>
              <Link href="/collaborer" className="pitch-subject__link">
                Voir la page Collaborer
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
