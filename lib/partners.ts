/** Logos partenaires homepage — ajouter `logoSrc` sous /public pour les fichiers réels. */

export type PartnerLogo = {
  id: string;
  name: string;
  logoSrc?: string;
  initials?: string;
};

export const HOME_PARTNER_LOGOS: PartnerLogo[] = [
  { id: "bp-1", name: "Sports Vision", logoSrc: "/logos/partner-sports-vision.svg", initials: "SV" },
  { id: "bp-2", name: "Athletic Media Group", logoSrc: "/logos/partner-athletic-media.svg", initials: "AM" },
  { id: "bp-3", name: "Stadium Partners", logoSrc: "/logos/partner-stadium.svg", initials: "SP" },
  { id: "bp-4", name: "Pulse Agency", logoSrc: "/logos/partner-pulse.svg", initials: "PA" },
  { id: "bp-5", name: "Northwind Studios", logoSrc: "/logos/partner-northwind.svg", initials: "NW" },
  { id: "bp-6", name: "Urban Score", logoSrc: "/logos/partner-urban-score.svg", initials: "US" },
];
