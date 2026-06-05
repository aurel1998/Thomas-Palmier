import { articleExcerpt, plainBodyTeaser } from "../../lib/articleExcerpt";
import { absoluteUrl } from "../../lib/seo";
import { getSiteName } from "../../lib/siteConfig";
import type { Content } from "../../types/content";

function contentDescription(content: Content): string {
  return (
    plainBodyTeaser(content.content, 200) ||
    articleExcerpt(content.content, 200) ||
    content.title
  );
}

function contentImage(content: Content): string {
  if (!content.image_url?.trim()) return absoluteUrl("/logos/thomas.png");
  if (content.image_url.startsWith("http://") || content.image_url.startsWith("https://")) {
    return content.image_url;
  }
  return absoluteUrl(content.image_url);
}

export function ContentJsonLd({ content }: { content: Content }) {
  const url = absoluteUrl(`/mes-contenus/${content.id}`);
  const author = { "@type": "Person", name: getSiteName() };
  const image = contentImage(content);
  const description = contentDescription(content);

  if (content.type === "video") {
    const data = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: content.title,
      description,
      thumbnailUrl: image,
      uploadDate: content.created_at,
      url,
      author,
    };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
  }

  if (content.type === "audio") {
    const data = {
      "@context": "https://schema.org",
      "@type": "AudioObject",
      name: content.title,
      description,
      contentUrl: /^https?:\/\//i.test(content.content.trim()) ? content.content.trim() : undefined,
      image,
      datePublished: content.created_at,
      author,
      url,
    };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
  }

  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    description,
    image,
    datePublished: content.created_at,
    author,
    mainEntityOfPage: url,
    url,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
