/**
 * Client Prisma pour les scripts Node ESM (.mjs).
 * Import compatible CommonJS (évite l'erreur Named export 'PrismaClient' not found).
 */
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { PrismaClient } = prismaPkg;

export function createPrisma() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}
