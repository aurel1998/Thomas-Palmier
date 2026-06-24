import { CREDIBILITY_AWARDS, CREDIBILITY_MEDIA, CREDIBILITY_PARTNERS } from "./credibility";
import { HERO_HEADLINE, HERO_JOURNAL_LINE, HERO_POSITIONING, HERO_VIDEO_MP4_DEFAULT } from "./heroCopy";
import { PROFILE_PORTRAIT_SRC } from "./profileAssets";
import { HOME_PARTNER_LOGOS } from "./partners";
import { SOCIAL, SOCIAL_LABELS, SOCIAL_LINK_ORDER } from "./social";
import { getSiteName } from "./siteConfig";
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

const SITE = getSiteName();

export const DEFAULT_PROFILE: JournalistProfileDto = {
  image_url: PROFILE_PORTRAIT_SRC,
  display_name: HERO_HEADLINE,
  job_title: HERO_JOURNAL_LINE,
  tagline: HERO_POSITIONING,
  bio: "Production d'histoires sportives premium : contexte, angle, vérification et narration claire. Reportages terrain, analyses tactiques et formats courts pour les médias et les marques.",
  bio_short:
    "Journaliste sportif indépendant, Thomas Palmier couvre le sport au plus près du terrain. Son approche mêle narration, contexte et regard critique pour transformer un match en récit.",
  specialties: ["Football", "Analyse tactique", "Reportage terrain", "Formats courts"],
  hero_video_url: HERO_VIDEO_MP4_DEFAULT,
  hero_poster_url: PROFILE_PORTRAIT_SRC,
  photo_caption: "Journaliste sport · terrain & analyse",
  editorial_line: "Analyse, terrain, formats courts — le récit avant le score.",
  updated_at: null,
};

export const DEFAULT_SITE: SiteSettingsDto = {
  footer_tagline: "Journaliste sportif freelance - analyse, reportage, formats courts",
  contact_intro: "Expliquez votre demande en quelques lignes. Je vous réponds sous 48 h ouvrées.",
  contact_role: "Journaliste sportif",
  newsletter_eyebrow: "Newsletter",
  newsletter_title: "Recevez les prochaines histoires",
  home_about_eyebrow: "À propos",
  home_about_title: `Qui est ${SITE}`,
  collaborer_eyebrow: "Collaborations",
  collaborer_hero_title: "Récits sport qui servent vos objectifs.",
  collaborer_hero_subtitle: "Visibilité, crédibilité, engagement — sans sacrifier l'exigence éditoriale.",
  collaborer_cta_label: "Demander une proposition",
  collaborer_cta_href: "/contact",
  collaborer_closing_title: "On structure votre prochain format.",
  updated_at: null,
};

export const DEFAULT_TIMELINE: TimelineStepDto[] = [
  {
    id: "default-tl-1",
    period: "2018 — 2020",
    title: "Premiers terrains",
    text: "Reportages de bord de pelouse et formats live orientés compréhension du jeu.",
    position: 1,
  },
  {
    id: "default-tl-2",
    period: "2020 — 2023",
    title: "Montée en expertise",
    text: "Développement des analyses tactiques et des formats multi-supports (vidéo, texte, audio).",
    position: 2,
  },
  {
    id: "default-tl-3",
    period: "2023 — aujourd'hui",
    title: "Ligne éditoriale média",
    text: "Production d'histoires sportives premium : contexte, angle, vérification et narration claire.",
    position: 3,
  },
];

function defaultCredibility(): CredibilityItemDto[] {
  const awards: CredibilityItemDto[] = CREDIBILITY_AWARDS.map((a, i) => ({
    id: a.id,
    kind: "award" as CredibilityKind,
    name: "",
    title: a.title,
    subtitle: a.subtitle ?? "",
    year: a.year ?? "",
    logo_url: "",
    initials: "",
    link_url: "",
    position: i + 1,
    is_active: true,
  }));
  const media: CredibilityItemDto[] = CREDIBILITY_MEDIA.map((m, i) => ({
    id: m.id,
    kind: "media" as CredibilityKind,
    name: m.name,
    title: "",
    subtitle: "",
    year: "",
    logo_url: m.logoSrc ?? "",
    initials: m.initials ?? "",
    link_url: "",
    position: i + 1,
    is_active: true,
  }));
  const partners: CredibilityItemDto[] = CREDIBILITY_PARTNERS.map((p, i) => ({
    id: p.id,
    kind: "institution" as CredibilityKind,
    name: p.name,
    title: "",
    subtitle: "",
    year: "",
    logo_url: p.logoSrc ?? "",
    initials: p.initials ?? "",
    link_url: "",
    position: i + 1,
    is_active: true,
  }));
  const homePartners: CredibilityItemDto[] = HOME_PARTNER_LOGOS.map((p, i) => ({
    id: p.id,
    kind: "partner" as CredibilityKind,
    name: p.name,
    title: "",
    subtitle: "",
    year: "",
    logo_url: p.logoSrc ?? "",
    initials: p.initials ?? "",
    link_url: "",
    position: i + 1,
    is_active: true,
  }));
  return [...awards, ...media, ...partners, ...homePartners];
}

export const DEFAULT_CREDIBILITY: CredibilityItemDto[] = defaultCredibility();

export const DEFAULT_SOCIAL: SocialLinkDto[] = SOCIAL_LINK_ORDER.map((platform, i) => ({
  id: `default-social-${platform}`,
  platform,
  label: SOCIAL_LABELS[platform],
  url: SOCIAL[platform],
  position: i + 1,
  is_active: true,
}));

export const DEFAULT_OFFERS: CollaborationOfferDto[] = [
  { id: "default-offer-1", title: "Brand content", tag: "Sponsorisé · éditorial", position: 1 },
  { id: "default-offer-2", title: "Événement", tag: "Terrain · multi-format", position: 2 },
  { id: "default-offer-3", title: "Série", tag: "Vidéo · texte · audio", position: 3 },
];

export const DEFAULT_CASES: CollaborationCaseDto[] = [
  {
    id: "default-case-1",
    number: "01",
    title: "Club professionnel",
    format: "Série brand content — vidéo & réseaux sociaux",
    note: "+28 % d'interactions qualifiées — par rapport à la campagne de la saison précédente.",
    position: 1,
  },
  {
    id: "default-case-2",
    number: "02",
    title: "Marque sport & lifestyle",
    format: "Reportage terrain + déclinaisons pour le lancement",
    note: "Taux de clic publicitaire ×1,9 — sur la fenêtre de lancement produit.",
    position: 2,
  },
  {
    id: "default-case-3",
    number: "03",
    title: "Institution sportive",
    format: "Dossier long format & contenus partenaires",
    note: "4 reprises médias — presse et web partenaires.",
    position: 3,
  },
];

export function pickString(value: string | null | undefined, fallback: string): string {
  const t = value?.trim();
  return t ? t : fallback;
}

export function pickStringArray(value: string[] | null | undefined, fallback: string[]): string[] {
  if (!value?.length) return fallback;
  const cleaned = value.map((s) => s.trim()).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}
