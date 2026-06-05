import {
  Bricolage_Grotesque,
  Geist_Mono,
  Instrument_Serif,
  Inter,
  Inter_Tight,
} from "next/font/google";

/** Corps de texte : lisibilité longue, UI. */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Titres techniques (UI bold) : nav, boutons, h3-h4, cartes. */
export const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  weight: ["600", "700", "800", "900"],
});

/**
 * Display signature : Bricolage Grotesque.
 * Grotesque éditoriale au caractère marqué (optical sizing, contrastes nets) —
 * donne une identité typographique distinctive aux grands titres (hero, sections),
 * là où Inter Tight reste réservé à l'UI.
 */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["600", "700", "800"],
});

/**
 * Serif éditorial signature : Instrument Serif.
 * Contraste fort, italique très expressif — donne un cachet « presse premium »
 * sur les gros titres hero, sections principales et chiffres clés.
 */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

/**
 * Monospace technique : Geist Mono.
 * Réservé aux libellés courts (eyebrows, étiquettes catégories, chiffres data) —
 * différenciation visuelle immédiate, signal « studio éditorial ».
 */
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});
