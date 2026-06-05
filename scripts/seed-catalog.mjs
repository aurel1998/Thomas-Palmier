/**
 * Initialise les 4 catégories fixes et un catalogue démo.
 * Usage : node scripts/seed-catalog.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const CATEGORIES = [
  {
    id: "a0000001-0001-4001-8001-000000000001",
    name: "Webcontenus",
    description: "Articles, dossiers et formats pensés pour le web.",
    position: 1,
  },
  {
    id: "a0000001-0001-4001-8001-000000000002",
    name: "Média",
    description: "Vidéos, audio et formats broadcast au catalogue.",
    position: 2,
  },
  {
    id: "a0000001-0001-4001-8001-000000000003",
    name: "Animations",
    description: "Motion, séquences animées et formats courts dynamiques.",
    position: 3,
  },
  {
    id: "a0000001-0001-4001-8001-000000000004",
    name: "Éléments",
    description: "Modules, vignettes et fragments éditoriaux.",
    position: 4,
  },
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      create: cat,
      update: {
        name: cat.name,
        description: cat.description,
        position: cat.position,
      },
    });
    console.log(`[OK] Catégorie : ${cat.name}`);
  }
  console.log("\nCatégories prêtes. Ajoutez des contenus via /monsite et assignez-les à ces catégories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
