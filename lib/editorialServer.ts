import { unstable_cache } from "next/cache";
import { EDITORIAL_CACHE_TAG } from "./editorialCache";
import {
  DEFAULT_CASES,
  DEFAULT_CREDIBILITY,
  DEFAULT_OFFERS,
  DEFAULT_PROFILE,
  DEFAULT_SITE,
  DEFAULT_SOCIAL,
  DEFAULT_TIMELINE,
  pickString,
  pickStringArray,
} from "./editorialDefaults";
import { mapCaseRow, mapCredibilityRow, mapOfferRow, mapProfileRow, mapSiteRow, mapSocialRow, mapTimelineRow } from "./editorialMappers";
import { pickPortraitUrl } from "./profileAssets";
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

function mergeProfile(raw: JournalistProfileDto): JournalistProfileDto {
  return {
    image_url: pickPortraitUrl(pickString(raw.image_url, DEFAULT_PROFILE.image_url)),
    display_name: pickString(raw.display_name, DEFAULT_PROFILE.display_name),
    job_title: pickString(raw.job_title, DEFAULT_PROFILE.job_title),
    tagline: pickString(raw.tagline, DEFAULT_PROFILE.tagline),
    bio: pickString(raw.bio, DEFAULT_PROFILE.bio),
    bio_short: pickString(raw.bio_short, DEFAULT_PROFILE.bio_short),
    specialties: pickStringArray(raw.specialties, DEFAULT_PROFILE.specialties),
    hero_video_url: pickString(raw.hero_video_url, DEFAULT_PROFILE.hero_video_url),
    hero_poster_url: pickString(raw.hero_poster_url, DEFAULT_PROFILE.hero_poster_url),
    photo_caption: pickString(raw.photo_caption, DEFAULT_PROFILE.photo_caption),
    editorial_line: pickString(raw.editorial_line, DEFAULT_PROFILE.editorial_line),
    updated_at: raw.updated_at,
  };
}

function mergeSite(raw: SiteSettingsDto): SiteSettingsDto {
  return {
    footer_tagline: pickString(raw.footer_tagline, DEFAULT_SITE.footer_tagline),
    contact_intro: pickString(raw.contact_intro, DEFAULT_SITE.contact_intro),
    contact_role: pickString(raw.contact_role, DEFAULT_SITE.contact_role),
    newsletter_eyebrow: pickString(raw.newsletter_eyebrow, DEFAULT_SITE.newsletter_eyebrow),
    newsletter_title: pickString(raw.newsletter_title, DEFAULT_SITE.newsletter_title),
    home_about_eyebrow: pickString(raw.home_about_eyebrow, DEFAULT_SITE.home_about_eyebrow),
    home_about_title: pickString(raw.home_about_title, DEFAULT_SITE.home_about_title),
    collaborer_eyebrow: pickString(raw.collaborer_eyebrow, DEFAULT_SITE.collaborer_eyebrow),
    collaborer_hero_title: pickString(raw.collaborer_hero_title, DEFAULT_SITE.collaborer_hero_title),
    collaborer_hero_subtitle: pickString(raw.collaborer_hero_subtitle, DEFAULT_SITE.collaborer_hero_subtitle),
    collaborer_cta_label: pickString(raw.collaborer_cta_label, DEFAULT_SITE.collaborer_cta_label),
    collaborer_cta_href: pickString(raw.collaborer_cta_href, DEFAULT_SITE.collaborer_cta_href),
    collaborer_closing_title: pickString(raw.collaborer_closing_title, DEFAULT_SITE.collaborer_closing_title),
    updated_at: raw.updated_at,
  };
}

function profileFromRow(row: ReturnType<typeof mapProfileRow>): JournalistProfileDto {
  return mergeProfile({
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
  });
}

function siteFromRow(row: ReturnType<typeof mapSiteRow>): SiteSettingsDto {
  return mergeSite({
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
  });
}

async function fetchJournalistProfile(): Promise<JournalistProfileDto> {
  try {
    const row = await prisma.journalistProfile.findFirst();
    return row ? profileFromRow(mapProfileRow(row)) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
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
    return row ? siteFromRow(mapSiteRow(row)) : DEFAULT_SITE;
  } catch {
    return DEFAULT_SITE;
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
    const mapped = rows.map(mapCredibilityRow);
    if (!mapped.length) {
      return DEFAULT_CREDIBILITY.filter(
        (item) =>
          (!opts?.kind || item.kind === opts.kind) && (!opts?.activeOnly || item.is_active)
      );
    }
    return mapped;
  } catch {
    return DEFAULT_CREDIBILITY.filter(
      (item) =>
        (!opts?.kind || item.kind === opts.kind) && (!opts?.activeOnly || item.is_active)
    );
  }
}

export async function getTimelineStepsServer(): Promise<TimelineStepDto[]> {
  try {
    const rows = await prisma.timelineStep.findMany({
      orderBy: [{ position: "asc" }, { period: "asc" }],
    });
    return rows.length ? rows.map(mapTimelineRow) : DEFAULT_TIMELINE;
  } catch {
    return DEFAULT_TIMELINE;
  }
}

async function fetchSocialLinks(activeOnly: boolean): Promise<SocialLinkDto[]> {
  try {
    const rows = await prisma.socialLink.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ position: "asc" }, { label: "asc" }],
    });
    return rows.length ? rows.map(mapSocialRow) : activeOnly ? DEFAULT_SOCIAL : DEFAULT_SOCIAL;
  } catch {
    return DEFAULT_SOCIAL;
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
    return rows.length ? rows.map(mapOfferRow) : DEFAULT_OFFERS;
  } catch {
    return DEFAULT_OFFERS;
  }
}

export async function getCollaborationCasesServer(): Promise<CollaborationCaseDto[]> {
  try {
    const rows = await prisma.collaborationCase.findMany({
      orderBy: [{ position: "asc" }, { number: "asc" }],
    });
    return rows.length ? rows.map(mapCaseRow) : DEFAULT_CASES;
  } catch {
    return DEFAULT_CASES;
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
