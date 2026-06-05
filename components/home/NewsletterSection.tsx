"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Bloc newsletter : capture d'email sans friction, inscription via
 * POST /api/newsletter/subscribe (Nodemailer + DB Prisma).
 */
type NewsletterSectionProps = {
  eyebrow?: string;
  title?: string;
};

export function NewsletterSection({
  eyebrow = "Newsletter",
  title = "Recevez les prochaines histoires",
}: NewsletterSectionProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const emailTrimmed = email.trim();
  const canSubmit =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed) && status !== "loading";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(result.error ?? "Inscription impossible.");
        return;
      }
      setStatus("success");
      setMessage(result.message ?? "Inscription confirmée. Merci !");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Erreur réseau. Réessayez dans un instant.");
    }
  };

  return (
    <section className="home-newsletter" id="newsletter" aria-labelledby="home-newsletter-heading">
      <div className="container home-newsletter__inner">
        <div className="home-newsletter__card">
          <p className="home-sectionEyebrow">{eyebrow}</p>
          <h2 id="home-newsletter-heading" className="home-newsletter__title">
            {title}
          </h2>

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
              disabled={status === "loading"}
            />
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {status === "loading" ? "Envoi…" : "S'abonner"}
            </button>
          </form>

          <p className="home-newsletter__legal muted" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.5 }}>
            En vous inscrivant, vous acceptez de recevoir la newsletter de Thomas Palmier. Désinscription
            possible à tout moment depuis chaque email.
          </p>

          {message ? (
            <p
              className="home-newsletter__feedback"
              role="status"
              aria-live="polite"
              style={{
                marginTop: 14,
                fontSize: 14,
                color: status === "error" ? "#e2596b" : "#54c79a",
              }}
            >
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
