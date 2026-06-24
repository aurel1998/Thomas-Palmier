/**
 * Initialise les 4 catégories fixes et un catalogue démo.
 * Usage : node scripts/seed-catalog.mjs
 */
import "dotenv/config";
import { createPrisma } from "./lib/create-prisma.mjs";

const CATEGORIES = [
  {
    id: "a0000001-0001-4001-8001-000000000001",
    name: "Radio",
    description: "Chroniques, interviews et magazines — explorez par rubrique.",
    position: 1,
  },
  {
    id: "a0000001-0001-4001-8001-000000000002",
    name: "TV",
    description: "Reportages, directs et formats télévisuels — classés par rubrique.",
    position: 2,
  },
  {
    id: "a0000001-0001-4001-8001-000000000003",
    name: "Presse écrite/web",
    description: "Articles, enquêtes et publications numériques — par rubrique.",
    position: 3,
  },
  {
    id: "a0000001-0001-4001-8001-000000000004",
    name: "Réseaux sociaux",
    description: "Reels, stories et formats courts — organisés par rubrique.",
    position: 4,
  },
];

const { prisma, pool } = createPrisma();

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
  console.log("\nCatégories prêtes. Ajoutez des rubriques via /monsite puis assignez les contenus.");
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
