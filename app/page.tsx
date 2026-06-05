import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { HeroSection } from "../components/home/HeroSection";
import { FeatureStorySection } from "../components/home/FeatureStorySection";
import { UneSection } from "../components/home/UneSection";
import { getAllCategoriesServer } from "../lib/categoriesServer";
import { getContentsForHomeServer, getFeaturedContentServer } from "../lib/contentsServer";
import { getAgendaEventsServer } from "../lib/agendaEventsServer";
import { getFeaturedEventServer } from "../lib/featuredEvent";
import { getJournalistProfileServer, getSiteSettingsServer } from "../lib/editorialServer";
import { attachCategoryIds } from "../lib/resolveCategories";
import { buildPageMetadata, SITE_DESCRIPTION } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Journaliste sportif",
  description: SITE_DESCRIPTION,
  path: "/",
});

const AboutThomasSection = dynamic(
  () => import("../components/home/AboutThomasSection").then((m) => ({ default: m.AboutThomasSection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(160px, 22vh, 260px)" }} aria-busy /> }
);

const AgendaSection = dynamic(
  () => import("../components/home/AgendaSection").then((m) => ({ default: m.AgendaSection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(180px, 26vh, 320px)" }} aria-busy /> }
);

const NewsletterSection = dynamic(
  () => import("../components/home/NewsletterSection").then((m) => ({ default: m.NewsletterSection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(100px, 14vh, 160px)" }} aria-busy /> }
);

/** Accueil allégé : moins de sections, moins de lignes DB. */
export const revalidate = 120;

export default async function HomePage() {
  const [rawContents, featuredContent, categories, profile, site, agendaEvents, featuredEvent] =
    await Promise.all([
      getContentsForHomeServer(16),
      getFeaturedContentServer(),
      getAllCategoriesServer(),
      getJournalistProfileServer(),
      getSiteSettingsServer(),
      getAgendaEventsServer(),
      getFeaturedEventServer(),
    ]);
  const profileImageUrl = profile.image_url?.trim() || null;

  const contents = attachCategoryIds(rawContents, categories);
  const railContents = featuredContent
    ? contents.filter((c) => c.id !== featuredContent.id)
    : contents;

  return (
    <div className="home-page home-page--lean">
      <HeroSection
        backdropSrc={profile.hero_poster_url || undefined}
        profileImageSrc={profileImageUrl ?? undefined}
        videoSrc={profile.hero_video_url || undefined}
        displayName={profile.display_name}
        jobTitle={profile.job_title}
        tagline={profile.tagline || profile.editorial_line}
      />

      <section className="home-act home-act--manifeste">
        <div className="home-strip home-strip--une">
          {featuredContent ? <FeatureStorySection item={featuredContent} /> : null}
          <UneSection initialContents={railContents} />
        </div>
        <div className="home-strip home-strip--about">
          <AboutThomasSection
            portraitSrc={profileImageUrl ?? undefined}
            displayName={profile.display_name}
            eyebrow={site.home_about_eyebrow}
            title={site.home_about_title}
            bioShort={profile.bio_short}
            specialties={profile.specialties}
          />
        </div>
      </section>

      <section className="home-act home-act--immersion">
        <div className="home-strip home-strip--agenda">
          <AgendaSection events={agendaEvents} featuredEvent={featuredEvent} />
        </div>
        <div className="home-strip home-strip--newsletter">
          <NewsletterSection eyebrow={site.newsletter_eyebrow} title={site.newsletter_title} />
        </div>
      </section>
    </div>
  );
}
