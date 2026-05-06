"use client";



import gsap from "gsap";
import { motion } from "../../lib/gsapMotion";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";

import { Suspense, useEffect, useRef, useState } from "react";

import type { FormEvent } from "react";

import { isSupabaseConfigured, supabase, signInWithEmail } from "../../lib/supabaseClient";



export default function LoginPage() {

  return (

    <Suspense

      fallback={

        <section className="login-page">

          <div className="container login-loading">

            <span className="admin-loader" aria-hidden="true" />

            <span>Chargement...</span>

          </div>

        </section>

      }

    >

      <LoginInner />

    </Suspense>

  );

}



function LoginInner() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/monsite";



  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [checkingSession, setCheckingSession] = useState(true);

  /** Connexion via cookie demo (sans Supabase). */

  const [presentationLogin, setPresentationLogin] = useState(false);



  const cardRef = useRef<HTMLDivElement | null>(null);

  const supabaseUnsubRef = useRef<(() => void) | undefined>(undefined);



  useEffect(() => {

    let mounted = true;

    supabaseUnsubRef.current = undefined;



    void (async () => {

      const statusRes = await fetch("/api/demo-auth/status", { cache: "no-store" });

      if (!mounted) return;

      let demo = false;

      if (statusRes.ok) {

        const body = (await statusRes.json()) as { demo?: boolean };

        demo = Boolean(body.demo);

      }



      if (demo) {

        const sessionRes = await fetch("/api/demo-auth/session", { cache: "no-store" });

        if (!mounted) return;

        if (sessionRes.ok) {

          const sess = (await sessionRes.json()) as { authenticated?: boolean };

          if (sess.authenticated) {

            router.replace(redirectTo);

            return;

          }

        }

        setPresentationLogin(true);

        setCheckingSession(false);

        return;

      }



      if (!supabase) {

        setError(

          "Supabase n'est pas configure. Renseigne .env.local ou active DEMO_PRESENTATION=true pour une demo locale."

        );

        setCheckingSession(false);

        return;

      }



      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {

        router.replace(redirectTo);

        return;

      }

      setCheckingSession(false);



      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {

        if (!mounted) return;

        if (newSession) router.replace(redirectTo);

      });

      supabaseUnsubRef.current = () => listener.subscription.unsubscribe();

    })();



    return () => {

      mounted = false;

      supabaseUnsubRef.current?.();

      supabaseUnsubRef.current = undefined;

    };

  }, [redirectTo, router]);



  useEffect(() => {

    if (checkingSession || !cardRef.current) return;

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

  }, [checkingSession]);



  async function onSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setError(null);



    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {

      setError("Email et mot de passe sont obligatoires.");

      return;

    }



    if (presentationLogin) {

      setSubmitting(true);

      try {

        const res = await fetch("/api/demo-auth/login", {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({ email: trimmedEmail, password }),

        });

        const payload = (await res.json().catch(() => ({}))) as { error?: string };

        if (!res.ok) {

          setError(payload.error ?? "Connexion impossible.");

          setSubmitting(false);

          return;

        }

        router.replace(redirectTo);

      } catch {

        setError("Connexion impossible.");

        setSubmitting(false);

      }

      return;

    }



    if (!isSupabaseConfigured) {

      setError("Supabase n'est pas configure.");

      return;

    }



    setSubmitting(true);

    try {

      await signInWithEmail(trimmedEmail, password);

      // le listener onAuthStateChange redirige automatiquement

    } catch (err) {

      const message = err instanceof Error ? err.message : "Connexion impossible.";

      if (/invalid login credentials/i.test(message)) {

        setError("Email ou mot de passe incorrect.");

      } else if (/email not confirmed/i.test(message)) {

        setError("Email non confirme. Verifie ta boite mail.");

      } else {

        setError(message);

      }

      setSubmitting(false);

    }

  }



  if (checkingSession) {

    return (

      <section className="login-page">

        <div className="container login-loading">

          <span className="admin-loader" aria-hidden="true" />

          <span>Verification de la session...</span>

        </div>

      </section>

    );

  }



  return (

    <section className="login-page">

      <div className="container login-shell">

        <div ref={cardRef} className="login-card">

          <p className="home-sectionEyebrow login-field">Acces reserve</p>

          <h1 className="login-title login-field">Connexion</h1>

          <p className="login-sub login-field">

            {presentationLogin

              ? "Mode presentation : connexion locale sans Supabase (demo uniquement)."

              : "Identifie-toi pour acceder a ton espace de publication."}

          </p>



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

                placeholder="thomas@site.com"

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


