#!/usr/bin/env node
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generatePassword() {
  return randomBytes(18).toString("base64").replace(/[+/=]/g, "").slice(0, 20) + "!2";
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "contact@thomaspalmier.fr").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "").trim() || generatePassword();
  const generated = !process.env.ADMIN_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "admin",
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      email,
      name: "Admin",
      passwordHash,
      role: "admin",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log(`[create-admin] Utilisateur admin prêt : ${user.email}`);
  console.log("");
  console.log("  Email    :", email);
  console.log("  Password :", password);
  if (generated) {
    console.log("");
    console.log("  Mot de passe genere automatiquement. Copie-le maintenant :");
    console.log("  il ne sera plus affiche.");
  }
  console.log("");
  const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  console.log("Connexion :", `${base}/login`);
  console.log("Espace   :", `${base}/monsite`);
}

main()
  .catch((err) => {
    console.error("[create-admin] Erreur inattendue :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
