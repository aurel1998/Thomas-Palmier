"use client";

import gsap from "gsap";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "../../lib/gsapMotion";
import { ADMIN_EMAIL_HINT } from "../../lib/sitePublic";

type SessionUser = { email?: string | null; role?: string };

type AdminLoginFormProps = {
  onSuccess: (user: SessionUser) => void;
};

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 18, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }
      );

      gsap.fromTo(
        ".login-field",
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: motion.duration.revealMed,
          ease: motion.ease.out,
          stagger: motion.duration.stagger,
          delay: 0.1,
        }
      );
    });

    return () => ctx.revert();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email et mot de passe sont obligatoires.");
      return;
    }

    setSubmitting(true);
    const result = await signIn("credentials", {
      email: trimmedEmail,
      password,
      redirect: false,
      callbackUrl: "/monsite",
    });

    if (!result || result.error) {
      setSubmitting(false);
      setError("Email ou mot de passe incorrect.");
      return;
    }

    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    if (sessionRes.ok) {
      const body = (await sessionRes.json()) as { user?: SessionUser } | null;
      if (body?.user) {
        onSuccess(body.user);
        return;
      }
    }

    setSubmitting(false);
    setError("Connexion impossible. Reessaie.");
  }

  return (
    <section className="login-page">
      <div className="container login-shell">
        <div ref={cardRef} className="login-card">
          <p className="home-sectionEyebrow login-field">Acces reserve</p>
          <h1 className="login-title login-field">Connexion</h1>
          <p className="login-sub login-field">Identifie-toi pour acceder a ton espace de publication.</p>

          <form className="login-form" onSubmit={onSubmit} noValidate>
            <div className="admin-field login-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ADMIN_EMAIL_HINT}
                disabled={submitting}
              />
            </div>

            <div className="admin-field login-field">
              <label htmlFor="login-password">Mot de passe</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
              />
            </div>

            {error ? (
              <p className="admin-status admin-status--error login-field" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="admin-btn login-field" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="admin-loader" aria-hidden="true" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <p className="login-back login-field">
            <Link href="/">← Retour au site</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
