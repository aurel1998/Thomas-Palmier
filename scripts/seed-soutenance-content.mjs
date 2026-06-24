/**
 * Catégories + agenda de démonstration (sans contenus catalogue fictifs).
 * Usage : node scripts/seed-soutenance-content.mjs
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

const EVENTS = [
  {
    id: "c0000001-0001-4001-8001-000000000001",
    title: "Soirée Ligue 1 — débrief plateau",
    description:
      "Analyse en direct après les matchs : temps forts, polémiques et angles éditoriaux pour la semaine.",
    date: new Date("2026-06-12T20:45:00.000Z"),
    location: "RMC Sport",
    status: "published",
    isFeatured: true,
  },
  {
    id: "c0000001-0001-4001-8001-000000000002",
    title: "Reportage terrain — activation club",
    description: "Immersion terrain : captation, interviews et contenus sociaux.",
    date: new Date("2026-06-18T18:00:00.000Z"),
    location: "Île-de-France",
    status: "published",
    isFeatured: false,
  },
  {
    id: "c0000001-0001-4001-8001-000000000003",
    title: "Table ronde — récit sportif & médias",
    description: "Discussion sur les nouvelles formes de narration sportive.",
    date: new Date("2026-06-28T19:00:00.000Z"),
    location: "Paris",
    status: "published",
    isFeatured: false,
  },
];

const { prisma, pool } = createPrisma();

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      create: cat,
      update: { name: cat.name, description: cat.description, position: cat.position },
    });
  }
  console.log("[OK] Catégories");

  const existingEvents = await prisma.event.count({ where: { status: "published" } });
  if (existingEvents === 0) {
    for (const event of EVENTS) {
      await prisma.event.upsert({
        where: { id: event.id },
        create: event,
        update: event,
      });
    }
    console.log(`[OK] ${EVENTS.length} événements agenda`);
  } else {
    console.log(`[skip] ${existingEvents} événement(s) déjà en base`);
  }

  console.log("Seed soutenance terminé (contenus catalogue : npm run seed:youtube).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
