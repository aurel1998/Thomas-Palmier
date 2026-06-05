import { NextResponse } from "next/server";
import type { Content, ContentType } from "../../../../types/content";
import { mapContentRow } from "../../../../lib/dbMappers";
import { requireAdmin } from "../../../../lib/apiAuth";
import { prisma } from "../../../../lib/prisma";
import { extractYouTubeId, getYouTubeThumbnail, isYouTubeUrl } from "../../../../lib/youtube";
import { isMailerConfigured } from "../../../../lib/mailer";
import { unsetOtherFeaturedContent } from "../../../../lib/featuredContent";
import { notifyNewContent } from "../../../../lib/newsletter";
import { parsePublicationStatus } from "../../../../lib/publicationStatus";
import { revalidateContentCaches } from "../../../../lib/contentCache";
import { categoryIdFromSubcategory } from "../../../../lib/subcategoryResolve";

const allowedTypes: ContentType[] = ["video", "article", "audio"];

type CreateContentBody = {
  title?: unknown;
  type?: unknown;
  content?: unknown;
  image_url?: unknown;
  tags?: unknown;
  category_id?: unknown;
  subcategory_id?: unknown;
  is_featured?: unknown;
  status?: unknown;
  notify?: unknown;
};

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function validateContentByType(type: ContentType, content: string): string | null {
  const normalized = content.trim();
  if (type === "video" && !isYouTubeUrl(normalized)) {
    return "Le contenu video doit etre un lien YouTube valide.";
  }
  if (type === "article" && normalized.length < 80) {
    return "Le contenu article doit contenir au moins 80 caracteres.";
  }
  if (type === "audio") {
    if (!normalized) return "Le contenu audio est obligatoire.";
    const audioOk = /^https?:\/\//i.test(normalized) || normalized.startsWith("/uploads/audio/");
    if (!audioOk) {
      return "Le contenu audio doit etre une URL publique ou /uploads/audio/...";
    }
  }
  return null;
}

/**
 * POST /api/content/create
 * Body JSON : { title, type, content?, image_url?, tags? }
 * Validations : title obligatoire, type in (video|article|audio).
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as CreateContentBody;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Le champ 'title' est obligatoire." }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: "Le champ 'type' est obligatoire." }, { status: 400 });
    }
    if (!allowedTypes.includes(type as ContentType)) {
      return NextResponse.json(
        { error: "Le champ 'type' doit etre video, article ou audio." },
        { status: 400 }
      );
    }

    const rawContent = typeof body.content === "string" ? body.content : "";
    const rawImageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";

    const validationError = validateContentByType(type as ContentType, rawContent);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const ytId = type === "video" ? extractYouTubeId(rawContent.trim()) : null;
    const computedImageUrl = rawImageUrl || (ytId ? getYouTubeThumbnail(ytId, "hq") : "");

    const subcategoryId =
      typeof body.subcategory_id === "string" && body.subcategory_id.trim()
        ? body.subcategory_id.trim()
        : null;
    const categoryFromSub = await categoryIdFromSubcategory(subcategoryId);
    const explicitCategoryId =
      typeof body.category_id === "string" && body.category_id.trim() ? body.category_id.trim() : null;

    if (!subcategoryId) {
      return NextResponse.json(
        { error: "Choisissez une rubrique (sous-catégorie) avant de publier." },
        { status: 400 }
      );
    }

    const payload = {
      title,
      type: type as ContentType,
      content: rawContent,
      image_url: computedImageUrl,
      tags: normalizeTags(body.tags),
      category_id: categoryFromSub ?? explicitCategoryId,
      subcategory_id: subcategoryId,
      is_featured: typeof body.is_featured === "boolean" ? body.is_featured : false,
      status: parsePublicationStatus(body.status, "draft"),
    };

    if (payload.is_featured && payload.status !== "published") {
      return NextResponse.json(
        { error: "Seul un contenu publié peut être mis à la une." },
        { status: 400 }
      );
    }

    if (payload.is_featured) {
      await unsetOtherFeaturedContent();
    }

    const data = await prisma.content.create({
      data: {
        title: payload.title,
        type: payload.type,
        content: payload.content,
        imageUrl: payload.image_url,
        tags: payload.tags,
        categoryId: payload.category_id,
        subcategoryId: payload.subcategory_id,
        isFeatured: payload.is_featured,
        status: payload.status,
        createdById: auth.session.user.id,
      },
    });
    const created = mapContentRow(data) as Content;

    // Notification des abonnes : publie + case cochée (fire-and-forget).
    const shouldNotify = payload.status === "published" && body.notify === true;
    if (shouldNotify && isMailerConfigured()) {
      void notifyNewContent(created).catch((error) => {
        console.error("[newsletter] notification nouveau contenu echouee:", (error as Error).message);
      });
    }

    revalidateContentCaches();
    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
