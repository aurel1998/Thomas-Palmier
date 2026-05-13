import dynamic from "next/dynamic";
import { HeroSection } from "../components/home/HeroSection";
import { HomeChapterNav } from "../components/home/HomeChapterNav";
import { UneSection } from "../components/home/UneSection";
import { getAllCategoriesServer } from "../lib/categoriesServer";
import { getContentsForHomeServer } from "../lib/contentsServer";
import { getJournalistProfileImageServer } from "../lib/journalistProfileServer";
import { pickRecentYoutubeContents } from "../lib/recentYoutube";

const AboutThomasSection = dynamic(
  () => import("../components/home/AboutThomasSection").then((m) => ({ default: m.AboutThomasSection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(180px, 24vh, 300px)" }} aria-busy /> }
);

const CredibilitySection = dynamic(
  () => import("../components/home/CredibilitySection").then((m) => ({ default: m.CredibilitySection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(120px, 16vh, 200px)" }} aria-busy /> }
);

const PartnersSection = dynamic(
  () => import("../components/home/PartnersSection").then((m) => ({ default: m.PartnersSection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(140px, 18vh, 240px)" }} aria-busy /> }
);

const EditorialSelectionSection = dynamic(
  () => import("../components/home/EditorialSelectionSection").then((m) => ({ default: m.EditorialSelectionSection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(260px, 36vh, 480px)" }} aria-busy /> }
);

const RecentYoutubeSection = dynamic(
  () => import("../components/home/RecentYoutubeSection").then((m) => ({ default: m.RecentYoutubeSection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(240px, 34vh, 440px)" }} aria-busy /> }
);

const RecentContents = dynamic(
  () => import("../components/home/RecentContents").then((m) => ({ default: m.RecentContents })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(200px, 28vh, 360px)" }} aria-busy /> }
);

const PitchSubjectSection = dynamic(
  () => import("../components/home/PitchSubjectSection").then((m) => ({ default: m.PitchSubjectSection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(160px, 22vh, 280px)" }} aria-busy /> }
);

const NewsletterSection = dynamic(
  () => import("../components/home/NewsletterSection").then((m) => ({ default: m.NewsletterSection })),
  { loading: () => <div className="home-dynamic-fallback" style={{ minHeight: "clamp(100px, 14vh, 160px)" }} aria-busy /> }
);

/* Cache court : évite un aller-retour DB à chaque navigation (perception « site lent »). */
export const revalidate = 60;

export default async function HomePage() {
  const [contents, categories, profileImageUrl] = await Promise.all([
    getContentsForHomeServer(120),
    getAllCategoriesServer(),
    getJournalistProfileImageServer(),
  ]);
  const featuredContent = contents.find((item) => item.is_featured) ?? contents[0] ?? null;
  const featuredId = featuredContent?.id;
  const heroBackdrop = "/src/stade/stade1.jpg";
  const youtubeRecent = pickRecentYoutubeContents(contents, {
    limit: 10,
    excludeIds: featuredId ? [featuredId] : [],
  });
  const homeSecondaryExcludeIds = [
    ...(featuredId ? [featuredId] : []),
    ...youtubeRecent.map((c) => c.id),
  ];

  return (
    <div className="home-page">
      <HeroSection backdropSrc={heroBackdrop} profileImageSrc={profileImageUrl ?? undefined} />
      <HomeChapterNav />

      <section id="acte-manifeste" className="home-act home-act--manifeste">
        <div className="home-strip home-strip--une">
          <UneSection initialContents={contents} />
        </div>
        <div className="home-strip home-strip--about">
          <AboutThomasSection portraitSrc={profileImageUrl ?? "/src/joueurs/joueur6.jpg"} />
        </div>
      </section>

      <section id="acte-preuves" className="home-act home-act--preuves">
        <div className="home-strip home-strip--credibility">
          <CredibilitySection />
        </div>
        <div className="home-strip home-strip--partners">
          <PartnersSection />
        </div>
        <div className="home-strip home-strip--editorial">
          <EditorialSelectionSection
            initialContents={contents}
            categories={categories}
            excludeIds={homeSecondaryExcludeIds}
          />
        </div>
      </section>

      <section id="acte-immersion" className="home-act home-act--immersion">
        <div className="home-strip home-strip--youtube">
          <RecentYoutubeSection items={youtubeRecent} />
        </div>
        <div className="home-strip home-strip--recent">
          <RecentContents initialContents={contents} excludeIds={homeSecondaryExcludeIds} />
        </div>
        <div className="home-strip home-strip--pitch">
          <PitchSubjectSection />
        </div>
        <div className="home-strip home-strip--newsletter">
          <NewsletterSection />
        </div>
      </section>
    </div>
  );
}
