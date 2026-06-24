/**
 * Importe les vidéos YouTube du portfolio dans le catalogue (catégories + rubriques).
 * Supprime aussi les anciens contenus de remplissage (seed démo).
 * Données : scripts/youtube-catalog.data.json (généré via build-youtube-catalog-data.mjs)
 * Usage : node scripts/seed-youtube-catalog.mjs
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPrisma } from "./lib/create-prisma.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  {
    id: "d0000001-0001-4001-8001-000000000003",
    categoryId: CATEGORY.tv,
    name: "Entretiens",
    description: "Interviews, déclarations et portraits d'athlètes ou personnalités du sport.",
    position: 3,
  },
  {
    id: "d0000001-0001-4001-8001-000000000004",
    categoryId: CATEGORY.tv,
    name: "Résumés sportifs",
    description: "Résumés commentés de rencontres et compétitions.",
    position: 4,
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

const { videos: YOUTUBE_VIDEOS } = JSON.parse(
  readFileSync(join(__dirname, "youtube-catalog.data.json"), "utf8"),
);

const { prisma, pool } = createPrisma();

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

    const publishedAt = new Date(video.publishedAt);

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
        createdAt: publishedAt,
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
        createdAt: publishedAt,
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
