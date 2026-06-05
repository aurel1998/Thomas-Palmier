import { PrismaAdapter } from "@auth/prisma-adapter";

import bcrypt from "bcryptjs";

import NextAuth from "next-auth";

import Credentials from "next-auth/providers/credentials";

import authConfig from "./auth.config";

import {

  getAdminEmail,

  isAllowedAdminEmail,

  isAllowedAdminRole,

} from "./lib/adminAccess";

import { isLoginRateLimited, resetLoginRateLimit } from "./lib/loginRateLimit";

import { prisma } from "./lib/prisma";



export const { handlers, auth, signIn, signOut } = NextAuth({

  ...authConfig,

  adapter: PrismaAdapter(prisma),

  providers: [

    Credentials({

      name: "Identifiants",

      credentials: {

        email: { label: "Email", type: "email" },

        password: { label: "Mot de passe", type: "password" },

      },

      async authorize(credentials) {

        const email = String(credentials?.email ?? "").trim().toLowerCase();

        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;



        if (!isAllowedAdminEmail(email)) return null;

        if (isLoginRateLimited(email)) return null;



        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.isActive) return null;

        if (!isAllowedAdminRole(user.role)) return null;



        const ok = await bcrypt.compare(password, user.passwordHash);

        if (!ok) return null;



        resetLoginRateLimit(email);



        return {

          id: user.id,

          email: user.email,

          name: user.name,

          image: user.image ?? undefined,

          role: user.role,

        };

      },

    }),

  ],

});



/** Email admin attendu (re-export pratique pour scripts). */

export { getAdminEmail };


