/** URLs — remplacer par les profils réels. */
export const SOCIAL = {
  youtube: "https://www.youtube.com/@thomaspalmiertv",
  linkedin: "https://linkedin.com/in/thomas-palmier-7b18311a6",
  instagram: "https://www.instagram.com/thomas__palmier/",
  tiktok: "https://www.tiktok.com/",
  facebook: "https://www.facebook.com/thomaspalmier15",
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
