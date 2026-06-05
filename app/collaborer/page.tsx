import type { Metadata } from "next";
import { CollaborerClient } from "../../components/collaborer/CollaborerClient";
import { filterAwards, mapCredibilityToLogoWall } from "../../lib/collaborerPageData";
import {
  getCollaborationCasesServer,
  getCollaborationOffersServer,
  getCredibilityItemsServer,
  getSiteSettingsServer,
} from "../../lib/editorialServer";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Collaborer",
  description:
    "Proposer une collaboration éditoriale, une mission terrain ou un partenariat média avec Thomas Palmier.",
  path: "/collaborer",
});

export default async function CollaborerPage() {
  const [site, offers, cases, credibility] = await Promise.all([
    getSiteSettingsServer(),
    getCollaborationOffersServer(),
    getCollaborationCasesServer(),
    getCredibilityItemsServer({ activeOnly: true }),
  ]);

  return (
    <CollaborerClient
      eyebrow={site.collaborer_eyebrow}
      heroTitle={site.collaborer_hero_title}
      heroSubtitle={site.collaborer_hero_subtitle}
      ctaLabel={site.collaborer_cta_label}
      ctaHref={site.collaborer_cta_href}
      closingTitle={site.collaborer_closing_title}
      offers={offers}
      cases={cases}
      awards={filterAwards(credibility)}
      logoWall={mapCredibilityToLogoWall(credibility)}
    />
  );
}
