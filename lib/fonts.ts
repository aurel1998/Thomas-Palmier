import { Inter, Inter_Tight, Newsreader } from "next/font/google";

/** Corps de texte : lisibilite longue, UI. */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Titres / hero : Inter Tight (Google Fonts), proche de l'esprit Satoshi / editeur premium. */
export const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  weight: ["600", "700", "800"],
});

/** Titres « magazine » sur certaines sections (alternance avec Inter Tight). */
export const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
