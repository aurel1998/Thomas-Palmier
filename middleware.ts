import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { isAllowedAdminUser } from "./lib/adminAccess";

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

  const session = request.auth;
  if (!isAllowedAdminUser(session?.user)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(ADMIN_SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
});

export const config = {
  matcher: ["/monsite", "/monsite/:path*", "/api/demo-auth", "/api/demo-auth/:path*"],
};
