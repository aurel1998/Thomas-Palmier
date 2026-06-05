import { unstable_cache } from "next/cache";
import { EDITORIAL_CACHE_TAG } from "./editorialCache";
import { mapCaseRow, mapCredibilityRow, mapOfferRow, mapProfileRow, mapSiteRow, mapSocialRow, mapTimelineRow } from "./editorialMappers";
import { prisma } from "./prisma";
import type {
  CollaborationCaseDto,
  CollaborationOfferDto,
  CredibilityItemDto,
  CredibilityKind,
  EditorialBundle,
  JournalistProfileDto,
  SiteSettingsDto,
  SocialLinkDto,
  TimelineStepDto,
} from "../types/editorial";

const EMPTY_PROFILE: JournalistProfileDto = {
  image_url: "",
  display_name: "",
  job_title: "",
  tagline: "",
  bio: "",
  bio_short: "",
  specialties: [],
  hero_video_url: "",
  hero_poster_url: "",
  photo_caption: "",
  editorial_line: "",
  updated_at: null,
};

const EMPTY_SITE: SiteSettingsDto = {
  footer_tagline: "",
  contact_intro: "",
  contact_role: "",
  newsletter_eyebrow: "",
  newsletter_title: "",
  home_about_eyebrow: "",
  home_about_title: "",
  collaborer_eyebrow: "",
  collaborer_hero_title: "",
  collaborer_hero_subtitle: "",
  collaborer_cta_label: "",
  collaborer_cta_href: "/contact",
  collaborer_closing_title: "",
  updated_at: null,
};

function profileFromRow(row: ReturnType<typeof mapProfileRow>): JournalistProfileDto {
  return {
    image_url: row.image_url ?? "",
    display_name: row.display_name ?? "",
    job_title: row.job_title ?? "",
    tagline: row.tagline ?? "",
    bio: row.bio ?? "",
    bio_short: row.bio_short ?? "",
    specialties: row.specialties ?? [],
    hero_video_url: row.hero_video_url ?? "",
    hero_poster_url: row.hero_poster_url ?? "",
    photo_caption: row.photo_caption ?? "",
    editorial_line: row.editorial_line ?? "",
    updated_at: row.updated_at,
  };
}

function siteFromRow(row: ReturnType<typeof mapSiteRow>): SiteSettingsDto {
  return {
    footer_tagline: row.footer_tagline ?? "",
    contact_intro: row.contact_intro ?? "",
    contact_role: row.contact_role ?? "",
    newsletter_eyebrow: row.newsletter_eyebrow ?? "",
    newsletter_title: row.newsletter_title ?? "",
    home_about_eyebrow: row.home_about_eyebrow ?? "",
    home_about_title: row.home_about_title ?? "",
    collaborer_eyebrow: row.collaborer_eyebrow ?? "",
    collaborer_hero_title: row.collaborer_hero_title ?? "",
    collaborer_hero_subtitle: row.collaborer_hero_subtitle ?? "",
    collaborer_cta_label: row.collaborer_cta_label ?? "",
    collaborer_cta_href: row.collaborer_cta_href || "/contact",
    collaborer_closing_title: row.collaborer_closing_title ?? "",
    updated_at: row.updated_at,
  };
}

async function fetchJournalistProfile(): Promise<JournalistProfileDto> {
  try {
    const row = await prisma.journalistProfile.findFirst();
    return row ? profileFromRow(mapProfileRow(row)) : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

export async function getJournalistProfileServer(): Promise<JournalistProfileDto> {
  return unstable_cache(fetchJournalistProfile, ["editorial-profile"], {
    tags: [EDITORIAL_CACHE_TAG],
    revalidate: 120,
  })();
}

async function fetchSiteSettings(): Promise<SiteSettingsDto> {
  try {
    const row = await prisma.siteSettings.findFirst();
    return row ? siteFromRow(mapSiteRow(row)) : EMPTY_SITE;
  } catch {
    return EMPTY_SITE;
  }
}

export async function getSiteSettingsServer(): Promise<SiteSettingsDto> {
  return unstable_cache(fetchSiteSettings, ["editorial-site-settings"], {
    tags: [EDITORIAL_CACHE_TAG],
    revalidate: 120,
  })();
}

export async function getCredibilityItemsServer(opts?: {
  kind?: CredibilityKind;
  activeOnly?: boolean;
}): Promise<CredibilityItemDto[]> {
  try {
    const rows = await prisma.credibilityItem.findMany({
      where: {
        ...(opts?.kind ? { kind: opts.kind } : {}),
        ...(opts?.activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
    return rows.map(mapCredibilityRow);
  } catch {
    return [];
  }
}

export async function getTimelineStepsServer(): Promise<TimelineStepDto[]> {
  try {
    const rows = await prisma.timelineStep.findMany({
      orderBy: [{ position: "asc" }, { period: "asc" }],
    });
    return rows.map(mapTimelineRow);
  } catch {
    return [];
  }
}

async function fetchSocialLinks(activeOnly: boolean): Promise<SocialLinkDto[]> {
  try {
    const rows = await prisma.socialLink.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ position: "asc" }, { label: "asc" }],
    });
    return rows.map(mapSocialRow);
  } catch {
    return [];
  }
}

export async function getSocialLinksServer(activeOnly = true): Promise<SocialLinkDto[]> {
  return unstable_cache(
    () => fetchSocialLinks(activeOnly),
    ["editorial-social-links", activeOnly ? "active" : "all"],
    { tags: [EDITORIAL_CACHE_TAG], revalidate: 120 }
  )();
}

export async function getCollaborationOffersServer(): Promise<CollaborationOfferDto[]> {
  try {
    const rows = await prisma.collaborationOffer.findMany({
      orderBy: [{ position: "asc" }, { title: "asc" }],
    });
    return rows.map(mapOfferRow);
  } catch {
    return [];
  }
}

export async function getCollaborationCasesServer(): Promise<CollaborationCaseDto[]> {
  try {
    const rows = await prisma.collaborationCase.findMany({
      orderBy: [{ position: "asc" }, { number: "asc" }],
    });
    return rows.map(mapCaseRow);
  } catch {
    return [];
  }
}

export async function getEditorialBundleServer(): Promise<EditorialBundle> {
  const [profile, site, credibility, timeline, social, offers, cases] = await Promise.all([
    getJournalistProfileServer(),
    getSiteSettingsServer(),
    getCredibilityItemsServer({ activeOnly: true }),
    getTimelineStepsServer(),
    getSocialLinksServer(true),
    getCollaborationOffersServer(),
    getCollaborationCasesServer(),
  ]);
  return { profile, site, credibility, timeline, social, offers, cases };
}
