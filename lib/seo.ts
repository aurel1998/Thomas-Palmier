import type { Metadata } from "next";
import { getPublicAppUrl, getSiteName } from "./siteConfig";

export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
  "Thomas Palmier, journaliste sportif : analyses, reportages terrain, vidéos et formats courts. Le sport raconté au plus près.";

const DEFAULT_OG_IMAGE = "/logos/thomas.png";

export function getMetadataBase(): URL {
  return new URL(getPublicAppUrl());
}

export function absoluteUrl(path: string): string {
  const base = getPublicAppUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function resolveOgImageUrl(ogImage?: string | null): string {
  if (!ogImage?.trim()) return absoluteUrl(DEFAULT_OG_IMAGE);
  if (ogImage.startsWith("http://") || ogImage.startsWith("https://")) return ogImage;
  return absoluteUrl(ogImage.startsWith("/") ? ogImage : `/${ogImage}`);
}

export function buildRootMetadata(): Metadata {
  const siteName = getSiteName();
  const base = getMetadataBase();
  const title = `${siteName} — Journaliste sportif`;
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase: base,
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description: SITE_DESCRIPTION,
    keywords: [
      "journaliste sportif",
      "Thomas Palmier",
      "reportage sport",
      "analyse sportive",
      "média sport",
      "football",
      "journalisme",
    ],
    authors: [{ name: siteName, url: base.href }],
    creator: siteName,
    publisher: siteName,
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: base.href,
      siteName,
      title,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1024,
          height: 374,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    icons: {
      icon: DEFAULT_OG_IMAGE,
      apple: DEFAULT_OG_IMAGE,
    },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  };
}

export function buildPageMetadata(opts: {
  title: string;
  description?: string;
  path: string;
  ogImage?: string | null;
  noIndex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const siteName = getSiteName();
  const title = opts.title;
  const description = opts.description ?? SITE_DESCRIPTION;
  const canonical = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const ogImage = resolveOgImageUrl(opts.ogImage);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: opts.type ?? "website",
      locale: "fr_FR",
      url: absoluteUrl(canonical),
      siteName,
      title,
      description,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    ...(opts.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
