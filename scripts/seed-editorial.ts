/**
 * Initialise le contenu éditorial en base depuis les valeurs par défaut.
 * Usage : npx tsx scripts/seed-editorial.ts
 */
import {
  DEFAULT_CASES,
  DEFAULT_CREDIBILITY,
  DEFAULT_OFFERS,
  DEFAULT_PROFILE,
  DEFAULT_SITE,
  DEFAULT_SOCIAL,
  DEFAULT_TIMELINE,
} from "../lib/editorialDefaults";
import { upsertJournalistProfileRow, upsertSiteSettingsRow } from "../lib/editorialSingleton";
import { prisma } from "../lib/prisma";

async function main() {
  await upsertJournalistProfileRow({
    imageUrl: DEFAULT_PROFILE.image_url,
    displayName: DEFAULT_PROFILE.display_name,
    jobTitle: DEFAULT_PROFILE.job_title,
    tagline: DEFAULT_PROFILE.tagline,
    bio: DEFAULT_PROFILE.bio,
    bioShort: DEFAULT_PROFILE.bio_short,
    specialties: DEFAULT_PROFILE.specialties,
    heroVideoUrl: DEFAULT_PROFILE.hero_video_url,
    heroPosterUrl: DEFAULT_PROFILE.hero_poster_url,
    photoCaption: DEFAULT_PROFILE.photo_caption,
    editorialLine: DEFAULT_PROFILE.editorial_line,
  });

  await upsertSiteSettingsRow({
    footerTagline: DEFAULT_SITE.footer_tagline,
    contactIntro: DEFAULT_SITE.contact_intro,
    contactRole: DEFAULT_SITE.contact_role,
    newsletterEyebrow: DEFAULT_SITE.newsletter_eyebrow,
    newsletterTitle: DEFAULT_SITE.newsletter_title,
    homeAboutEyebrow: DEFAULT_SITE.home_about_eyebrow,
    homeAboutTitle: DEFAULT_SITE.home_about_title,
    collaborerEyebrow: DEFAULT_SITE.collaborer_eyebrow,
    collaborerHeroTitle: DEFAULT_SITE.collaborer_hero_title,
    collaborerHeroSubtitle: DEFAULT_SITE.collaborer_hero_subtitle,
    collaborerCtaLabel: DEFAULT_SITE.collaborer_cta_label,
    collaborerCtaHref: DEFAULT_SITE.collaborer_cta_href,
    collaborerClosingTitle: DEFAULT_SITE.collaborer_closing_title,
  });

  const counts = await Promise.all([
    prisma.credibilityItem.count(),
    prisma.timelineStep.count(),
    prisma.socialLink.count(),
    prisma.collaborationOffer.count(),
    prisma.collaborationCase.count(),
  ]);

  if (!counts[0]) {
    await prisma.credibilityItem.createMany({
      data: DEFAULT_CREDIBILITY.map((item) => ({
        kind: item.kind,
        name: item.name,
        title: item.title,
        subtitle: item.subtitle,
        year: item.year,
        logoUrl: item.logo_url,
        initials: item.initials,
        linkUrl: item.link_url,
        position: item.position,
        isActive: item.is_active,
      })),
    });
  }

  if (!counts[1]) {
    await prisma.timelineStep.createMany({
      data: DEFAULT_TIMELINE.map((step) => ({
        period: step.period,
        title: step.title,
        text: step.text,
        position: step.position,
      })),
    });
  }

  if (!counts[2]) {
    await prisma.socialLink.createMany({
      data: DEFAULT_SOCIAL.map((link) => ({
        platform: link.platform,
        label: link.label,
        url: link.url,
        position: link.position,
        isActive: link.is_active,
      })),
    });
  }

  if (!counts[3]) {
    await prisma.collaborationOffer.createMany({
      data: DEFAULT_OFFERS.map((offer) => ({
        title: offer.title,
        tag: offer.tag,
        position: offer.position,
      })),
    });
  }

  if (!counts[4]) {
    await prisma.collaborationCase.createMany({
      data: DEFAULT_CASES.map((item) => ({
        number: item.number,
        title: item.title,
        format: item.format,
        note: item.note,
        position: item.position,
      })),
    });
  }

  console.log("Seed éditorial terminé.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
