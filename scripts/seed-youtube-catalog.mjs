/**
 * Importe les vidéos YouTube du portfolio dans le catalogue (catégories + rubriques).
 * Supprime aussi les anciens contenus de remplissage (seed démo).
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

/** Anciens contenus fictifs (seed soutenance / placeholders). */
const LEGACY_PLACEHOLDER_IDS = [
  "b0000001-0001-4001-8001-000000000001",
  "b0000001-0001-4001-8001-000000000002",
  "b0000001-0001-4001-8001-000000000003",
  "b0000001-0001-4001-8001-000000000004",
  "b0000001-0001-4001-8001-000000000005",
  "b0000001-0001-4001-8001-000000000006",
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

const YOUTUBE_VIDEOS = [
  {
    id: "e0000001-0001-4001-8001-000000000001",
    subcategoryId: "d0000001-0001-4001-8001-000000000001",
    youtubeId: "prDE5sRbynI",
    title:
      'Pierre Paturel après PSG-Chambéry (34-33) : "Une équipe qui bat les autres grâce à son rythme"',
    lede: "9 mars 2024 · Stade Pierre de Coubertin · Handball · Liqui Moly Starligue · J20",
    body: `Le capitaine chambérien explique à quel point il est difficile de battre le PSG. L'équipe entraînée par Raul Gonzalez impose un rythme d'enfer à ses adversaires, que n'a pas pu tenir Chambéry au début de la seconde période.

Mais les Savoyards ont résisté et ont fait trembler le leader invaincu en fin de match. Réaction de Pierre Paturel.`,
    tags: ["Handball", "Starligue", "PSG", "Chambéry", "Interview"],
    publishedAt: new Date("2024-03-09T18:00:00.000Z"),
    isFeatured: true,
  },
  {
    id: "e0000001-0001-4001-8001-000000000002",
    subcategoryId: "d0000001-0001-4001-8001-000000000001",
    youtubeId: "GF_VZ15fKVc",
    title:
      'Gustavo RODRIQUEZ : "Se qualifier aux JO, c\'est vraiment important pour le hand au Brésil"',
    lede: "9 mars 2024 · PSG-Chambéry (34-33) · J20 Liqui Moly Starligue · Handball",
    body: `Le Brésilien de Chambéry évoque le TQO auquel il va participer avec sa sélection, avec l'objectif affirmé d'obtenir un billet pour les Jeux de Paris cet été.

Interview réalisée après PSG-Chambéry (34-33), J20 de Liqui Moly Starligue.`,
    tags: ["Handball", "Starligue", "Chambéry", "Brésil", "JO Paris 2024", "Interview"],
    publishedAt: new Date("2024-03-09T18:30:00.000Z"),
    isFeatured: false,
  },
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function purgeLegacyPlaceholders() {
  const byId = await prisma.content.deleteMany({
    where: { id: { in: LEGACY_PLACEHOLDER_IDS } },
  });

  const byUrl = await prisma.content.deleteMany({
    where: {
      OR: [
        { content: { contains: "ysz5S6PUM-U" } },
        { content: { contains: "SoundHelix" } },
      ],
    },
  });

  const removed = byId.count + byUrl.count;
  if (removed > 0) {
    console.log(`[OK] ${removed} contenu(s) de remplissage supprimé(s)`);
  } else {
    console.log("[skip] Aucun contenu de remplissage à supprimer");
  }
}

async function main() {
  await purgeLegacyPlaceholders();

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
    if (video.isFeatured) {
      await prisma.content.updateMany({
        where: { isFeatured: true, NOT: { id: video.id } },
        data: { isFeatured: false },
      });
    }

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
