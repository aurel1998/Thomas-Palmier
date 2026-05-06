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
  { id: "med-ftv", name: "France Télévisions", initials: "FTV" },
  { id: "med-canal", name: "Canal+", initials: "C+" },
  { id: "med-lequipe", name: "L’Équipe", initials: "EQ" },
  { id: "med-rmc", name: "RMC Sport", initials: "RMC" },
];

/** Institutions, ligues, clubs partenaires sur des dossiers */
export const CREDIBILITY_PARTNERS: CredibilityLogoItem[] = [
  { id: "part-lfp", name: "LFP", initials: "LFP" },
  { id: "part-fff", name: "FFF", initials: "FFF" },
  { id: "part-insep", name: "INSEP", initials: "IN" },
  { id: "part-cnosf", name: "CNOSF", initials: "CN" },
];
