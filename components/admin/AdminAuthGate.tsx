"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { isAllowedAdminUser } from "../../lib/adminAccess";
import { AdminLoginForm } from "./AdminLoginForm";

type SessionUser = { email?: string | null; role?: string };
type GateState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "ready"; user: SessionUser };

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [gate, setGate] = useState<GateState>({ status: "loading" });
  const [loggingOut, setLoggingOut] = useState(false);
  const manualLogoutRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const statusRes = await fetch("/api/auth/session", { cache: "no-store" });
        if (!mounted) return;
        if (!statusRes.ok) {
          setGate({ status: "unauthenticated" });
          return;
        }
        const body = (await statusRes.json()) as { user?: SessionUser } | null;
        if (!body?.user || !isAllowedAdminUser(body.user)) {
          setGate({ status: "unauthenticated" });
          return;
        }
        setGate({ status: "ready", user: body.user });
      } catch {
        if (mounted) setGate({ status: "unauthenticated" });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function onSignOut() {
    manualLogoutRef.current = true;
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
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

  if (gate.status === "unauthenticated") {
    return (
      <AdminLoginForm
        onSuccess={(user) => {
          if (isAllowedAdminUser(user)) {
            setGate({ status: "ready", user });
          } else {
            setGate({ status: "unauthenticated" });
          }
        }}
      />
    );
  }

  const displayEmail = gate.user.email ?? "Admin";

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
            aria-label="Se déconnecter"
          >
            {loggingOut ? (
              <>
                <span className="admin-loader" aria-hidden="true" />
                Déconnexion…
              </>
            ) : (
              "Déconnexion"
            )}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

