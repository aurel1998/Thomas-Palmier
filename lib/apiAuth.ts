import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import {
  getAdminEmailForPresentation,
  isPresentationModeEnabled,
  PRESENTATION_COOKIE,
  PRESENTATION_COOKIE_VALUE,
} from "./presentationMode";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "thomas@site.com").trim().toLowerCase();

type AuthOk = { ok: true; user: User };
type AuthFail = { ok: false; response: NextResponse };
export type AuthResult = AuthOk | AuthFail;

function unauthorized(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Verifie qu'une requete API est faite par l'admin.
 *
 * Regles :
 *  - Pas de session valide               -> 401
 *  - Session valide mais mauvais email   -> 401
 *  - DEMO_PRESENTATION sans cookie valide + Supabase absent -> 401
 *  - Variables Supabase manquantes (hors mode presentation cookie) -> 500
 *
 * Utilisation dans une route API :
 *   const auth = await requireAdmin();
 *   if (!auth.ok) return auth.response;
 *   // ... code autorise (auth.user dispo)
 */
export async function requireAdmin(): Promise<AuthResult> {
  const cookieStore = await cookies();

  if (isPresentationModeEnabled()) {
    const ok = cookieStore.get(PRESENTATION_COOKIE)?.value === PRESENTATION_COOKIE_VALUE;
    if (ok) {
      const email = getAdminEmailForPresentation();
      const synthetic = {
        id: "00000000-0000-0000-0000-000000000001",
        aud: "authenticated",
        role: "authenticated",
        email,
        email_confirmed_at: new Date().toISOString(),
        phone: "",
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {} as User["app_metadata"],
        user_metadata: {} as User["user_metadata"],
        identities: [] as User["identities"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as User;
      return { ok: true, user: synthetic };
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPresentationModeEnabled()) {
      return {
        ok: false,
        response: unauthorized("Session presentation requise ou Supabase a configurer."),
      };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Supabase non configure (variables d'environnement manquantes)." },
        { status: 500 }
      ),
    };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // pas de modification de cookies dans les routes API de protection
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, response: unauthorized("Authentification requise.") };
  }

  const email = (user.email ?? "").trim().toLowerCase();
  if (email !== ADMIN_EMAIL) {
    return { ok: false, response: unauthorized("Acces refuse.") };
  }

  return { ok: true, user };
}
