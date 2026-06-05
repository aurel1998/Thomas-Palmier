import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ContentJsonLd } from "../../../components/seo/ContentJsonLd";
import { articleExcerpt, plainBodyTeaser } from "../../../lib/articleExcerpt";
import { mapContentRow } from "../../../lib/dbMappers";
import { prisma } from "../../../lib/prisma";
import { buildPageMetadata } from "../../../lib/seo";

type ContentTypeLabel = "Vidéo" | "Audio" | "Article";

function typeLabel(type: "video" | "article" | "audio"): ContentTypeLabel {
  if (type === "video") return "Vidéo";
  if (type === "audio") return "Audio";
  return "Article";
}

async function loadContent(id: string) {
  try {
    const row = await prisma.content.findFirst({
      where: { id, status: "published" },
    });
    return row ? mapContentRow(row) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const content = await loadContent(id);

  if (!content) {
    return buildPageMetadata({
      title: "Contenu introuvable",
      path: `/mes-contenus/${id}`,
      noIndex: true,
    });
  }

  const description =
    plainBodyTeaser(content.content, 160) ||
    articleExcerpt(content.content, 160) ||
    `${typeLabel(content.type)} par Thomas Palmier : ${content.title}.`;

  return buildPageMetadata({
    title: content.title,
    description,
    path: `/mes-contenus/${id}`,
    ogImage: content.image_url || undefined,
    type: content.type === "article" ? "article" : "website",
  });
}

export default async function ContentDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const content = await loadContent(id);

  return (
    <>
      {content ? <ContentJsonLd content={content} /> : null}
      {children}
    </>
  );
}
