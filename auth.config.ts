import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

const isProduction = process.env.NODE_ENV === "production";

const authConfig = {
  secret: process.env.JWT_SECRET ?? process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [],
  trustHost: true,
  useSecureCookies: isProduction,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = (user as { role?: UserRole }).role ?? "journalist";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? "";
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.role = (token.role as UserRole) ?? "journalist";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
