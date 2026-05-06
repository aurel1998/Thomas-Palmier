/** URLs — remplacer par les profils réels. */
export const SOCIAL = {
  youtube: "https://www.youtube.com/@thomaspalmiertv",
  linkedin: "https://www.linkedin.com/",
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/",
  facebook: "https://www.facebook.com/",
} as const;

export type SocialId = keyof typeof SOCIAL;

/** Ordre d’affichage (header, footer, dock). */
export const SOCIAL_LINK_ORDER: readonly SocialId[] = [
  "youtube",
  "linkedin",
  "instagram",
  "tiktok",
  "facebook",
] as const;

export const SOCIAL_LABELS: Record<SocialId, string> = {
  youtube: "YouTube",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
};
