export type CredibilityKind = "media" | "partner" | "award" | "institution";

export type JournalistProfileDto = {
  image_url: string;
  display_name: string;
  job_title: string;
  tagline: string;
  bio: string;
  bio_short: string;
  specialties: string[];
  hero_video_url: string;
  hero_poster_url: string;
  photo_caption: string;
  editorial_line: string;
  updated_at: string | null;
};

export type SiteSettingsDto = {
  footer_tagline: string;
  contact_intro: string;
  contact_role: string;
  newsletter_eyebrow: string;
  newsletter_title: string;
  home_about_eyebrow: string;
  home_about_title: string;
  collaborer_eyebrow: string;
  collaborer_hero_title: string;
  collaborer_hero_subtitle: string;
  collaborer_cta_label: string;
  collaborer_cta_href: string;
  collaborer_closing_title: string;
  updated_at: string | null;
};

export type CredibilityItemDto = {
  id: string;
  kind: CredibilityKind;
  name: string;
  title: string;
  subtitle: string;
  year: string;
  logo_url: string;
  initials: string;
  link_url: string;
  position: number;
  is_active: boolean;
};

export type TimelineStepDto = {
  id: string;
  period: string;
  title: string;
  text: string;
  position: number;
};

export type SocialLinkDto = {
  id: string;
  platform: string;
  label: string;
  url: string;
  position: number;
  is_active: boolean;
};

export type CollaborationOfferDto = {
  id: string;
  title: string;
  tag: string;
  position: number;
};

export type CollaborationCaseDto = {
  id: string;
  number: string;
  title: string;
  format: string;
  note: string;
  position: number;
};

export type EditorialBundle = {
  profile: JournalistProfileDto;
  site: SiteSettingsDto;
  credibility: CredibilityItemDto[];
  timeline: TimelineStepDto[];
  social: SocialLinkDto[];
  offers: CollaborationOfferDto[];
  cases: CollaborationCaseDto[];
};
