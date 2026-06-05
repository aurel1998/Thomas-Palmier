import type { Metadata } from "next";
import { ContactPageClient } from "../../components/contact/ContactPageClient";
import { getJournalistProfileServer, getSiteSettingsServer, getSocialLinksServer } from "../../lib/editorialServer";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: "Contacter Thomas Palmier pour collaborations, missions terrain et partenariats médias.",
  path: "/contact",
});

export default async function ContactPage() {
  const [profile, site, socialLinks] = await Promise.all([
    getJournalistProfileServer(),
    getSiteSettingsServer(),
    getSocialLinksServer(true),
  ]);

  return (
    <ContactPageClient
      displayName={profile.display_name}
      contactRole={site.contact_role}
      contactIntro={site.contact_intro}
      socialLinks={socialLinks}
    />
  );
}
