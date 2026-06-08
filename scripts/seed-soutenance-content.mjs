/**
 * Contenus et agenda de démonstration pour la soutenance.
 * Usage : node scripts/seed-soutenance-content.mjs
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

const CONTENTS = [
  {
    id: "b0000001-0001-4001-8001-000000000001",
    title: "Dans les travées : le match vu depuis les tribunes",
    type: "article",
    content:
      "Un récit en chapitres : ambiance, bascule tactique et séquences décisives. Pensé pour une lecture fluide sur écran.",
    imageUrl: "/src/stade/im1.jpg",
    tags: ["Dossier", "Terrain"],
    categoryId: "a0000001-0001-4001-8001-000000000001",
    isFeatured: true,
    status: "published",
    createdAt: new Date("2026-06-01T10:00:00.000Z"),
  },
  {
    id: "b0000001-0001-4001-8001-000000000002",
    title: "Portrait : l'instant qui bascule la rencontre",
    type: "article",
    content: "Focus sur un joueur, un geste, une décision — le sport vu comme récit éditorial.",
    imageUrl: "/src/stade/im2.jpg",
    tags: ["Portrait"],
    categoryId: "a0000001-0001-4001-8001-000000000001",
    isFeatured: false,
    status: "published",
    createdAt: new Date("2026-05-28T09:00:00.000Z"),
  },
  {
    id: "b0000001-0001-4001-8001-000000000003",
    title: "Notes de terrain : ambiance et rythme du groupe",
    type: "article",
    content: "Carnet de bord court, entre observation et analyse légère.",
    imageUrl: "/src/stade/im3.jpg",
    tags: ["Terrain"],
    categoryId: "a0000001-0001-4001-8001-000000000001",
    isFeatured: false,
    status: "published",
    createdAt: new Date("2026-05-25T08:00:00.000Z"),
  },
  {
    id: "b0000001-0001-4001-8001-000000000004",
    title: "Plongée immersive au cœur du stade",
    type: "video",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    imageUrl: "/src/stade/im4.jpg",
    tags: ["Immersion"],
    categoryId: "a0000001-0001-4001-8001-000000000002",
    isFeatured: false,
    status: "published",
    createdAt: new Date("2026-05-27T11:00:00.000Z"),
  },
  {
    id: "b0000001-0001-4001-8001-000000000005",
    title: "Lecture du tempo en pleine intensité",
    type: "video",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    imageUrl: "/src/stade/im5.jpg",
    tags: ["Action"],
    categoryId: "a0000001-0001-4001-8001-000000000002",
    isFeatured: false,
    status: "published",
    createdAt: new Date("2026-05-24T10:30:00.000Z"),
  },
  {
    id: "b0000001-0001-4001-8001-000000000006",
    title: "Séquence animée : trajectoire et impact",
    type: "video",
    content: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    imageUrl: "/src/joueurs/joueur10.webp",
    tags: ["Motion"],
    categoryId: "a0000001-0001-4001-8001-000000000003",
    isFeatured: false,
    status: "published",
    createdAt: new Date("2026-05-26T12:00:00.000Z"),
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

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      create: cat,
      update: { name: cat.name, description: cat.description, position: cat.position },
    });
  }
  console.log("[OK] Catégories");

  const existingContents = await prisma.content.count({ where: { status: "published" } });
  if (existingContents === 0) {
    for (const item of CONTENTS) {
      await prisma.content.upsert({
        where: { id: item.id },
        create: item,
        update: item,
      });
    }
    console.log(`[OK] ${CONTENTS.length} contenus publiés`);
  } else {
    console.log(`[skip] ${existingContents} contenu(s) déjà publié(s)`);
  }

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

  console.log("Seed soutenance terminé.");
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
