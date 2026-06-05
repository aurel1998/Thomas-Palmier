import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "../components/layout/SiteChrome";
import { ThemeProvider, THEME_PRELOAD_SCRIPT } from "../components/theme/ThemeProvider";
import { SiteJsonLd } from "../components/seo/SiteJsonLd";
import { bricolage, geistMono, instrumentSerif, inter, interTight } from "../lib/fonts";
import { getJournalistProfileServer, getSiteSettingsServer, getSocialLinksServer } from "../lib/editorialServer";
import { assertProductionSecrets } from "../lib/envSecurity";
import { buildRootMetadata } from "../lib/seo";
import "./globals.css";

export const metadata: Metadata = buildRootMetadata();

assertProductionSecrets();

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [profile, site, socialLinks] = await Promise.all([
    getJournalistProfileServer(),
    getSiteSettingsServer(),
    getSocialLinksServer(true),
  ]);
  const profileImageUrl = profile.image_url?.trim() || null;
  const socialUrls = socialLinks.filter((l) => l.is_active && l.url.trim()).map((l) => l.url);

  return (
    <html
      lang="fr"
      className={`${inter.variable} ${interTight.variable} ${bricolage.variable} ${instrumentSerif.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Script anti-FOUC : pose data-theme AVANT hydratation React */}
        <script dangerouslySetInnerHTML={{ __html: THEME_PRELOAD_SCRIPT }} />
        <SiteJsonLd
          displayName={profile.display_name}
          jobTitle={profile.job_title}
          profileImageUrl={profileImageUrl}
          socialUrls={socialUrls}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SiteChrome
            profileImageSrc={profileImageUrl ?? undefined}
            footerTagline={site.footer_tagline}
            socialLinks={socialLinks}
          >
            {children}
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
