import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "../lib/siteConfig";
import { prisma } from "../lib/prisma";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/mes-contenus", priority: 0.9, changeFrequency: "daily" },
  { path: "/a-propos", priority: 0.7, changeFrequency: "monthly" },
  { path: "/collaborer", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicAppUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let contentEntries: MetadataRoute.Sitemap = [];
  try {
    const contents = await prisma.content.findMany({
      where: { status: "published" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    contentEntries = contents.map((item) => ({
      url: `${base}/mes-contenus/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    /* DB indisponible au build : pages statiques uniquement */
  }

  return [...staticEntries, ...contentEntries];
}
