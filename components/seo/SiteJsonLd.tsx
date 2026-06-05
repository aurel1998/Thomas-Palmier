import { SITE_DESCRIPTION } from "../../lib/seo";
import { getContactEmail, getPublicAppUrl, getSiteName } from "../../lib/siteConfig";

function resolveImageUrl(profileImageUrl?: string | null): string | undefined {
  const base = getPublicAppUrl();
  if (!profileImageUrl?.trim()) return undefined;
  if (profileImageUrl.startsWith("http://") || profileImageUrl.startsWith("https://")) {
    return profileImageUrl;
  }
  return `${base}${profileImageUrl.startsWith("/") ? profileImageUrl : `/${profileImageUrl}`}`;
}

type SiteJsonLdProps = {
  displayName?: string;
  jobTitle?: string;
  profileImageUrl?: string | null;
  socialUrls?: string[];
};

export function SiteJsonLd({ displayName, jobTitle, profileImageUrl, socialUrls = [] }: SiteJsonLdProps) {
  const url = getPublicAppUrl();
  const name = displayName?.trim() || getSiteName();
  const image = resolveImageUrl(profileImageUrl);
  const sameAs = socialUrls.filter((u) => u.trim());

  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url,
    email: getContactEmail(),
  };
  if (image) person.image = image;
  if (jobTitle?.trim()) person.jobTitle = jobTitle.trim();
  if (sameAs.length) person.sameAs = sameAs;

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description: SITE_DESCRIPTION,
    inLanguage: "fr-FR",
    publisher: { "@type": "Person", name },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
