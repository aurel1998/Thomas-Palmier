import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClientFxBundle } from "../components/fx/ClientFxBundle";
import { ThreeBackdropGate } from "../components/fx/ThreeBackdropGate";
import { GsapRegister } from "../components/fx/GsapRegister";
import { PageTransition } from "../components/page-transition";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { ThemeProvider, THEME_PRELOAD_SCRIPT } from "../components/theme/ThemeProvider";
import { inter, interTight, newsreader } from "../lib/fonts";
import { getJournalistProfileImageServer } from "../lib/journalistProfileServer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sport Journal",
  description: "Site journaliste sportif - structure claire et professionnelle",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const profileImageUrl = await getJournalistProfileImageServer();

  return (
    <html lang="fr" className={`${inter.variable} ${interTight.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <head>
        {/* Script anti-FOUC : pose data-theme AVANT hydratation React */}
        <script dangerouslySetInnerHTML={{ __html: THEME_PRELOAD_SCRIPT }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ThreeBackdropGate />
          <GsapRegister />
          <ClientFxBundle />
          <SiteHeader profileImageSrc={profileImageUrl ?? undefined} />
          <PageTransition>{children}</PageTransition>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
