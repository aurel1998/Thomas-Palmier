/**
 * Importe les vidéos YouTube du portfolio dans le catalogue (catégories + rubriques).
 * Usage : node scripts/seed-youtube-catalog.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const CATEGORY = {
  tv: "a0000001-0001-4001-8001-000000000002",
};

const SUBCATEGORIES = [
  {
    id: "d0000001-0001-4001-8001-000000000001",
    categoryId: CATEGORY.tv,
    name: "Réactions après-match",
    description: "Interviews et réactions d'après rencontre — micro trottoir et plateau.",
    position: 1,
  },
  {
    id: "d0000001-0001-4001-8001-000000000002",
    categoryId: CATEGORY.tv,
    name: "Reportages",
    description: "Sujets filmés, immersion terrain et formats TV longs.",
    position: 2,
  },
];

function youtubeWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

function youtubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function buildYouTubeVideoDocument({ youtubeId, title, lede, body }) {
  const blocks = [{ type: "video", src: youtubeWatchUrl(youtubeId), title }];
  if (lede?.trim()) {
    blocks.push({ type: "text", title: "En bref", body: lede.trim() });
  }
  if (body?.trim()) {
    blocks.push({ type: "text", title: "Contexte", body: body.trim() });
  }
  return JSON.stringify({ blocks });
}

/** Regroupez les futures vidéos par rubrique (subcategoryId). */
const YOUTUBE_VIDEOS = [
  {
    id: "e0000001-0001-4001-8001-000000000001",
    subcategoryId: "d0000001-0001-4001-8001-000000000001",
    youtubeId: "prDE5sRbynI",
    title:
      'Pierre Paturel après PSG-Chambéry (34-33) : "Une équipe qui bat les autres grâce à son rythme"',
    lede: "9 mars 2024 · Stade Pierre de Coubertin · Handball · Starligue",
    body: `Le capitaine chambérien explique à quel point il est difficile de battre le PSG. L'équipe entraînée par Raul Gonzalez impose un rythme d'enfer à ses adversaires, que n'a pas pu tenir Chambéry au début de la seconde période.

Mais les Savoyards ont résisté et ont fait trembler le leader invaincu en fin de match. Réaction de Pierre Paturel.`,
    tags: ["Handball", "Starligue", "PSG", "Chambéry", "Interview"],
    publishedAt: new Date("2024-03-09T18:00:00.000Z"),
    isFeatured: false,
  },
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const sub of SUBCATEGORIES) {
    await prisma.subcategory.upsert({
      where: { id: sub.id },
      create: {
        id: sub.id,
        categoryId: sub.categoryId,
        name: sub.name,
        description: sub.description,
        position: sub.position,
      },
      update: {
        categoryId: sub.categoryId,
        name: sub.name,
        description: sub.description,
        position: sub.position,
      },
    });
    console.log(`[OK] Rubrique : TV › ${sub.name}`);
  }

  for (const video of YOUTUBE_VIDEOS) {
    const content = buildYouTubeVideoDocument({
      youtubeId: video.youtubeId,
      title: video.title,
      lede: video.lede,
      body: video.body,
    });

    await prisma.content.upsert({
      where: { id: video.id },
      create: {
        id: video.id,
        title: video.title,
        type: "video",
        content,
        imageUrl: youtubeThumb(video.youtubeId),
        tags: video.tags,
        categoryId: CATEGORY.tv,
        subcategoryId: video.subcategoryId,
        isFeatured: video.isFeatured,
        status: "published",
        createdAt: video.publishedAt,
      },
      update: {
        title: video.title,
        type: "video",
        content,
        imageUrl: youtubeThumb(video.youtubeId),
        tags: video.tags,
        categoryId: CATEGORY.tv,
        subcategoryId: video.subcategoryId,
        isFeatured: video.isFeatured,
        status: "published",
        createdAt: video.publishedAt,
      },
    });

    const subName = SUBCATEGORIES.find((s) => s.id === video.subcategoryId)?.name ?? "—";
    console.log(`[OK] Vidéo : TV › ${subName} › ${video.title.slice(0, 56)}…`);
  }

  console.log(`\n${YOUTUBE_VIDEOS.length} vidéo(s) YouTube synchronisée(s).`);
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
