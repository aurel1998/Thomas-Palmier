import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

const ADMIN_SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export default auth((request) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/demo-auth")) {
    return NextResponse.json({ error: "Non disponible." }, { status: 404 });
  }

  // Connexion admin uniquement via /monsite — pas de page /login publique
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(ADMIN_SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
});

export const config = {
  matcher: [
    "/monsite",
    "/monsite/:path*",
    "/login",
    "/login/:path*",
    "/api/demo-auth",
    "/api/demo-auth/:path*",
  ],
};
