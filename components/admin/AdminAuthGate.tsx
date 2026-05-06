"use client";



import { useRouter } from "next/navigation";

import { useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

import type { Session } from "@supabase/supabase-js";

import { supabase, signOut } from "../../lib/supabaseClient";



type GateState =

  | { status: "loading" }

  | { status: "ready"; mode: "demo"; email: string }

  | { status: "ready"; mode: "supabase"; session: Session };



/**

 * Affiche l'UI admin (bar de session + contenu) quand l'utilisateur est authentifie.

 *

 * La protection principale est assuree par `middleware.ts` : cette gate est un

 * filet de securite cote client et fournit la barre utilisateur + deconnexion.

 *

 * - Mode presentation (DEMO_PRESENTATION) : session via cookie HttpOnly (`/api/demo-auth/*`).

 * - Sinon : session Supabase comme avant.

 */

export function AdminAuthGate({ children }: { children: ReactNode }) {

  const router = useRouter();

  const [gate, setGate] = useState<GateState>({ status: "loading" });

  const [loggingOut, setLoggingOut] = useState(false);

  const manualLogoutRef = useRef(false);

  const supabaseUnsubRef = useRef<(() => void) | undefined>(undefined);



  useEffect(() => {

    let mounted = true;

    supabaseUnsubRef.current = undefined;



    void (async () => {

      const statusRes = await fetch("/api/demo-auth/status", { cache: "no-store" });

      if (!mounted) return;

      if (statusRes.ok) {

        const { demo } = (await statusRes.json()) as { demo?: boolean };

        if (demo) {

          const sessionRes = await fetch("/api/demo-auth/session", { cache: "no-store" });

          if (!mounted) return;

          if (sessionRes.ok) {

            const body = (await sessionRes.json()) as { authenticated?: boolean; email?: string };

            if (body.authenticated) {

              setGate({

                status: "ready",

                mode: "demo",

                email: body.email ?? "Admin",

              });

              return;

            }

          }

          router.replace("/login?redirect=/monsite");

          return;

        }

      }



      if (!supabase) {

        router.replace("/login?redirect=/monsite");

        return;

      }



      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!data.session) {

        router.replace("/login?redirect=/monsite");

        return;

      }

      setGate({ status: "ready", mode: "supabase", session: data.session });



      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {

        if (!mounted) return;

        if (!newSession) {

          if (manualLogoutRef.current) {

            router.replace("/");

          } else {

            router.replace("/login?redirect=/monsite");

          }

          return;

        }

        setGate({ status: "ready", mode: "supabase", session: newSession });

      });

      supabaseUnsubRef.current = () => listener.subscription.unsubscribe();

    })();



    return () => {

      mounted = false;

      supabaseUnsubRef.current?.();

      supabaseUnsubRef.current = undefined;

    };

  }, [router]);



  async function onSignOut() {

    manualLogoutRef.current = true;

    setLoggingOut(true);

    try {

      if (gate.status === "ready" && gate.mode === "demo") {

        await fetch("/api/demo-auth/logout", { method: "POST" });

      } else {

        await signOut();

      }

    } catch {

      // on redirige malgre tout

    }

    router.replace("/");

  }



  if (gate.status === "loading") {

    return (

      <section className="admin-page">

        <div className="container adminAuth-loading">

          <span className="admin-loader" aria-hidden="true" />

          <span>Verification de la session...</span>

        </div>

      </section>

    );

  }



  const displayEmail =

    gate.mode === "demo" ? gate.email : (gate.session.user.email ?? "Admin");



  return (

    <div className="adminAuth-authed">

      <div className="adminAuth-bar">

        <div className="container adminAuth-barInner">

          <div className="adminAuth-user">

            <span className="adminAuth-userDot" aria-hidden="true" />

            <span className="adminAuth-userEmail">{displayEmail}</span>

          </div>

          <button

            type="button"

            className="admin-btn admin-btn--ghost adminAuth-logout"

            onClick={onSignOut}

            disabled={loggingOut}

            aria-label="Se deconnecter"

          >

            {loggingOut ? (

              <>

                <span className="admin-loader" aria-hidden="true" />

                Deconnexion...

              </>

            ) : (

              "Deconnexion"

            )}

          </button>

        </div>

      </div>

      {children}

    </div>

  );

}


