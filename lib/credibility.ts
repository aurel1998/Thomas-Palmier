/** Données éditoriales « crédibilité » — à adapter (logos réels dans /public quand disponibles). */

export type CredibilityAward = {
  id: string;
  /** Nom du prix / distinction */
  title: string;
  /** Contexte court (radio, télé, festival…) */
  subtitle?: string;
  year?: string;
};

export type CredibilityLogoItem = {
  id: string;
  /** Nom affiché sous le logo */
  name: string;
  /** Chemin depuis /public, ex. /credibility/fftv.svg */
  logoSrc?: string;
  /** Si pas d’image : initiales dans le bloc logo */
  initials?: string;
};

export const CREDIBILITY_AWARDS: CredibilityAward[] = [
  {
    id: "award-micro-or",
    title: "Micro d’Or",
    subtitle: "Radio sport — meilleure chronique",
    year: "2024",
  },
  {
    id: "award-prix-sport",
    title: "Prix du journalisme sportif",
    subtitle: "Catérique reportage terrain",
    year: "2023",
  },
];

/** Médias où le travail a été vu / cité */
export const CREDIBILITY_MEDIA: CredibilityLogoItem[] = [
  { id: "med-ftv", name: "France Télévisions", logoSrc: "/logos/media-france-tv.svg", initials: "FTV" },
  { id: "med-canal", name: "Canal+", logoSrc: "/logos/media-canal.svg", initials: "C+" },
  { id: "med-lequipe", name: "L’Équipe", logoSrc: "/logos/media-lequipe.svg", initials: "EQ" },
  { id: "med-rmc", name: "RMC Sport", logoSrc: "/logos/media-rmc.svg", initials: "RMC" },
];

/** Institutions, ligues, clubs partenaires sur des dossiers */
export const CREDIBILITY_PARTNERS: CredibilityLogoItem[] = [
  { id: "part-lfp", name: "LFP", logoSrc: "/logos/collab-lfp.svg", initials: "LFP" },
  { id: "part-fff", name: "FFF", logoSrc: "/logos/collab-fff.svg", initials: "FFF" },
  { id: "part-insep", name: "INSEP", logoSrc: "/logos/collab-insep.svg", initials: "IN" },
  { id: "part-cnosf", name: "CNOSF", logoSrc: "/logos/collab-cnosf.svg", initials: "CN" },
];
