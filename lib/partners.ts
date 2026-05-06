/** Logos partenaires homepage — ajouter `logoSrc` sous /public pour les fichiers réels. */

export type PartnerLogo = {
  id: string;
  name: string;
  logoSrc?: string;
  initials?: string;
};

export const HOME_PARTNER_LOGOS: PartnerLogo[] = [
  { id: "bp-1", name: "Sports Vision", initials: "SV" },
  { id: "bp-2", name: "Athletic Media Group", initials: "AM" },
  { id: "bp-3", name: "Stadium Partners", initials: "SP" },
  { id: "bp-4", name: "Pulse Agency", initials: "PA" },
  { id: "bp-5", name: "Northwind Studios", initials: "NW" },
  { id: "bp-6", name: "Urban Score", initials: "US" },
];
