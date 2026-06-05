import type {
  CollaborationCaseDto,
  CollaborationOfferDto,
  CredibilityItemDto,
  CredibilityKind,
  JournalistProfileDto,
  SiteSettingsDto,
  SocialLinkDto,
  TimelineStepDto,
} from "../types/editorial";

type ProfileRow = {
  imageUrl: string;
  displayName: string;
  jobTitle: string;
  tagline: string;
  bio: string;
  bioShort: string;
  specialties: string[];
  heroVideoUrl: string;
  heroPosterUrl: string;
  photoCaption: string;
  editorialLine: string;
  updatedAt: Date;
};

type SiteRow = {
  footerTagline: string;
  contactIntro: string;
  contactRole: string;
  newsletterEyebrow: string;
  newsletterTitle: string;
  homeAboutEyebrow: string;
  homeAboutTitle: string;
  collaborerEyebrow: string;
  collaborerHeroTitle: string;
  collaborerHeroSubtitle: string;
  collaborerCtaLabel: string;
  collaborerCtaHref: string;
  collaborerClosingTitle: string;
  updatedAt: Date;
};

export function mapProfileRow(row: ProfileRow): JournalistProfileDto {
  return {
    image_url: row.imageUrl,
    display_name: row.displayName,
    job_title: row.jobTitle,
    tagline: row.tagline,
    bio: row.bio,
    bio_short: row.bioShort,
    specialties: row.specialties,
    hero_video_url: row.heroVideoUrl,
    hero_poster_url: row.heroPosterUrl,
    photo_caption: row.photoCaption,
    editorial_line: row.editorialLine,
    updated_at: row.updatedAt.toISOString(),
  };
}

export function mapSiteRow(row: SiteRow): SiteSettingsDto {
  return {
    footer_tagline: row.footerTagline,
    contact_intro: row.contactIntro,
    contact_role: row.contactRole,
    newsletter_eyebrow: row.newsletterEyebrow,
    newsletter_title: row.newsletterTitle,
    home_about_eyebrow: row.homeAboutEyebrow,
    home_about_title: row.homeAboutTitle,
    collaborer_eyebrow: row.collaborerEyebrow,
    collaborer_hero_title: row.collaborerHeroTitle,
    collaborer_hero_subtitle: row.collaborerHeroSubtitle,
    collaborer_cta_label: row.collaborerCtaLabel,
    collaborer_cta_href: row.collaborerCtaHref,
    collaborer_closing_title: row.collaborerClosingTitle,
    updated_at: row.updatedAt.toISOString(),
  };
}

export function mapCredibilityRow(row: {
  id: string;
  kind: string;
  name: string;
  title: string;
  subtitle: string;
  year: string;
  logoUrl: string;
  initials: string;
  linkUrl: string;
  position: number;
  isActive: boolean;
}): CredibilityItemDto {
  return {
    id: row.id,
    kind: row.kind as CredibilityKind,
    name: row.name,
    title: row.title,
    subtitle: row.subtitle,
    year: row.year,
    logo_url: row.logoUrl,
    initials: row.initials,
    link_url: row.linkUrl,
    position: row.position,
    is_active: row.isActive,
  };
}

export function mapTimelineRow(row: {
  id: string;
  period: string;
  title: string;
  text: string;
  position: number;
}): TimelineStepDto {
  return {
    id: row.id,
    period: row.period,
    title: row.title,
    text: row.text,
    position: row.position,
  };
}

export function mapSocialRow(row: {
  id: string;
  platform: string;
  label: string;
  url: string;
  position: number;
  isActive: boolean;
}): SocialLinkDto {
  return {
    id: row.id,
    platform: row.platform,
    label: row.label,
    url: row.url,
    position: row.position,
    is_active: row.isActive,
  };
}

export function mapOfferRow(row: {
  id: string;
  title: string;
  tag: string;
  position: number;
}): CollaborationOfferDto {
  return { id: row.id, title: row.title, tag: row.tag, position: row.position };
}

export function mapCaseRow(row: {
  id: string;
  number: string;
  title: string;
  format: string;
  note: string;
  position: number;
}): CollaborationCaseDto {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    format: row.format,
    note: row.note,
    position: row.position,
  };
}
