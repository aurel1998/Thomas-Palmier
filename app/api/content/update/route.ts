import { NextResponse } from "next/server";
import type { Content, ContentType } from "../../../../types/content";
import { mapContentRow } from "../../../../lib/dbMappers";
import { requireAdmin } from "../../../../lib/apiAuth";
import { prisma } from "../../../../lib/prisma";
import { extractYouTubeId, getYouTubeThumbnail, isYouTubeUrl } from "../../../../lib/youtube";
import { unsetOtherFeaturedContent } from "../../../../lib/featuredContent";
import { parsePublicationStatus } from "../../../../lib/publicationStatus";
import { revalidateContentCaches } from "../../../../lib/contentCache";
import { isMailerConfigured } from "../../../../lib/mailer";
import { notifyNewContent } from "../../../../lib/newsletter";
import { categoryIdFromSubcategory } from "../../../../lib/subcategoryResolve";

const allowedTypes: ContentType[] = ["video", "article", "audio"];

type UpdateContentBody = {
  id?: unknown;
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

function normalizeTags(tags: unknown): string[] | undefined {
  if (tags === undefined) return undefined;
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
 * PUT /api/content/update
 * Body JSON : { id, title?, type?, content?, image_url?, tags? }
 * Met a jour uniquement les champs fournis.
 */
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as UpdateContentBody;
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json({ error: "Le champ 'id' est obligatoire." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { error: "Le champ 'title' doit etre un texte non vide." },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if (body.type !== undefined) {
      if (typeof body.type !== "string" || !allowedTypes.includes(body.type as ContentType)) {
        return NextResponse.json(
          { error: "Le champ 'type' doit etre video, article ou audio." },
          { status: 400 }
        );
      }
      updates.type = body.type;
    }

    let incomingContent: string | null = null;
    if (body.content !== undefined) {
      incomingContent = typeof body.content === "string" ? body.content : "";
      updates.content = incomingContent;
    }

    let incomingImageUrl: string | null = null;
    if (body.image_url !== undefined) {
      incomingImageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
      updates.image_url = incomingImageUrl;
    }

    const tags = normalizeTags(body.tags);
    if (tags !== undefined) updates.tags = tags;

    if (body.subcategory_id !== undefined) {
      const subcategoryId =
        typeof body.subcategory_id === "string" && body.subcategory_id.trim()
          ? body.subcategory_id.trim()
          : null;
      updates.subcategory_id = subcategoryId;
      if (subcategoryId) {
        const parentId = await categoryIdFromSubcategory(subcategoryId);
        if (parentId) updates.category_id = parentId;
      }
    }

    if (body.category_id !== undefined && body.subcategory_id === undefined) {
      updates.category_id = typeof body.category_id === "string" ? body.category_id : null;
    }

    if (body.is_featured !== undefined) {
      if (typeof body.is_featured !== "boolean") {
        return NextResponse.json(
          { error: "Le champ 'is_featured' doit etre un booleen." },
          { status: 400 }
        );
      }
      updates.is_featured = body.is_featured;
    }

    if (body.status !== undefined) {
      updates.status = parsePublicationStatus(body.status);
      if (updates.status === "draft") {
        updates.is_featured = false;
      }
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    // Validation stricte selon le type final (video/article/audio).
    if (updates.type === "video" || updates.type === "article" || updates.type === "audio" || incomingContent !== null) {
      let effectiveType = updates.type as ContentType | undefined;
      let effectiveContent = incomingContent;
      if (effectiveType === undefined || effectiveContent === null) {
        const existingRow = await prisma.content.findUnique({
          where: { id },
          select: { type: true, content: true },
        });
        if (effectiveType === undefined) effectiveType = existingRow?.type as ContentType | undefined;
        if (effectiveContent === null) effectiveContent = existingRow?.content ?? "";
      }
      if (effectiveType) {
        const validationError = validateContentByType(effectiveType, effectiveContent ?? "");
        if (validationError) {
          return NextResponse.json({ error: validationError }, { status: 400 });
        }
      }
    }

    const nextType = (updates.type as ContentType | undefined) ?? null;
    const shouldAutoThumb = (nextType === "video" || nextType === null) && (incomingImageUrl ?? "") === "";
    if (shouldAutoThumb) {
      let sourceForThumb = (incomingContent ?? "").trim();
      if (!sourceForThumb) {
        const existingRow = await prisma.content.findUnique({
          where: { id },
          select: { type: true, content: true },
        });
        if (existingRow?.type === "video") {
          sourceForThumb = existingRow.content.trim();
        }
      }
      if (sourceForThumb) {
        const ytId = extractYouTubeId(sourceForThumb);
        if (ytId) updates.image_url = getYouTubeThumbnail(ytId, "hq");
      }
    }

    const existingRow = await prisma.content.findUnique({
      where: { id },
      select: { status: true, isFeatured: true, subcategoryId: true },
    });
    if (!existingRow) {
      return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
    }

    const nextStatus =
      (updates.status as ReturnType<typeof parsePublicationStatus> | undefined) ?? existingRow.status;
    const nextFeatured =
      updates.is_featured !== undefined ? (updates.is_featured as boolean) : existingRow.isFeatured;

    if (nextStatus === "published") {
      const effectiveSubcategoryId =
        updates.subcategory_id !== undefined
          ? (updates.subcategory_id as string | null)
          : existingRow.subcategoryId;
      if (!effectiveSubcategoryId) {
        return NextResponse.json(
          { error: "Une rubrique est obligatoire pour un contenu publié." },
          { status: 400 }
        );
      }
    }

    if (nextFeatured && nextStatus !== "published") {
      return NextResponse.json(
        { error: "Seul un contenu publié peut être mis à la une." },
        { status: 400 }
      );
    }

    if (updates.is_featured === true) {
      await unsetOtherFeaturedContent(id);
    }

    const wasDraft = existingRow.status === "draft";
    const publishingNow = wasDraft && nextStatus === "published";

    const data = await prisma.content.update({
      where: { id },
      data: {
        ...(updates.title !== undefined ? { title: updates.title as string } : {}),
        ...(updates.type !== undefined ? { type: updates.type as ContentType } : {}),
        ...(updates.content !== undefined ? { content: updates.content as string } : {}),
        ...(updates.image_url !== undefined ? { imageUrl: updates.image_url as string } : {}),
        ...(updates.tags !== undefined ? { tags: updates.tags as string[] } : {}),
        ...(updates.category_id !== undefined ? { categoryId: updates.category_id as string | null } : {}),
        ...(updates.subcategory_id !== undefined
          ? { subcategoryId: updates.subcategory_id as string | null }
          : {}),
        ...(updates.is_featured !== undefined ? { isFeatured: updates.is_featured as boolean } : {}),
        ...(updates.status !== undefined
          ? { status: updates.status as ReturnType<typeof parsePublicationStatus> }
          : {}),
      },
    });

    const updated = mapContentRow(data) as Content;

    const shouldNotify = publishingNow && body.notify === true;
    if (shouldNotify && isMailerConfigured()) {
      void notifyNewContent(updated).catch((error) => {
        console.error("[newsletter] notification publication contenu:", (error as Error).message);
      });
    }

    revalidateContentCaches();
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Contenu introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
