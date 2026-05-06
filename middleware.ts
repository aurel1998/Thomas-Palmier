import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isPresentationModeEnabled,
  PRESENTATION_COOKIE,
  PRESENTATION_COOKIE_VALUE,
} from "./lib/presentationMode";

/**
 * Middleware Next.js - protection de /monsite.
 *
 * Regles :
 *   - DEMO_PRESENTATION + cookie session demo -> acces (sans Supabase possible)
 *   - Sinon : session Supabase + email = ADMIN_EMAIL
 *
 * L'email admin est configurable via ADMIN_EMAIL (defaut : thomas@site.com).
 */

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "thomas@site.com").trim().toLowerCase();

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const presentation = isPresentationModeEnabled();
  const presentationCookieOk =
    request.cookies.get(PRESENTATION_COOKIE)?.value === PRESENTATION_COOKIE_VALUE;

  if (presentation && presentationCookieOk) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const email = (user.email ?? "").trim().toLowerCase();
  if (email !== ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/monsite", "/monsite/:path*"],
};
