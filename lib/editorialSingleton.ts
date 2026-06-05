import { prisma } from "./prisma";

/** Upsert du singleton JournalistProfile (id booléen). */
export async function upsertJournalistProfileRow(
  data: Partial<{
    imageUrl: string;
    displayName: string;
    jobTitle: string;
    tagline: string;
    bio: string;
    bioShort: string;
    specialties: string[];
    heroVideoUrl: string;
    heroPosterUrl: string;
    photoCaption: string;
    editorialLine: string;
  }>
) {
  const existing = await prisma.journalistProfile.findFirst({ select: { id: true } });
  if (existing) {
    await prisma.journalistProfile.updateMany({ data });
  } else {
    await prisma.journalistProfile.create({
      data: {
        imageUrl: data.imageUrl ?? "",
        displayName: data.displayName ?? "",
        jobTitle: data.jobTitle ?? "",
        tagline: data.tagline ?? "",
        bio: data.bio ?? "",
        bioShort: data.bioShort ?? "",
        specialties: data.specialties ?? [],
        heroVideoUrl: data.heroVideoUrl ?? "",
        heroPosterUrl: data.heroPosterUrl ?? "",
        photoCaption: data.photoCaption ?? "",
        editorialLine: data.editorialLine ?? "",
      },
    });
  }
}

/** Upsert du singleton SiteSettings. */
export async function upsertSiteSettingsRow(
  data: Partial<{
    footerTagline: string;
    contactIntro: string;
    contactRole: string;
    newsletterEyebrow: string;
    newsletterTitle: string;
    homeAboutEyebrow: string;
    homeAboutTitle: string;
    collaborerEyebrow: string;
    collaborerHeroTitle: string;
    collaborerHeroSubtitle: string;
    collaborerCtaLabel: string;
    collaborerCtaHref: string;
    collaborerClosingTitle: string;
  }>
) {
  const existing = await prisma.siteSettings.findFirst({ select: { id: true } });
  if (existing) {
    await prisma.siteSettings.updateMany({ data });
  } else {
    await prisma.siteSettings.create({
      data: {
        footerTagline: data.footerTagline ?? "",
        contactIntro: data.contactIntro ?? "",
        contactRole: data.contactRole ?? "",
        newsletterEyebrow: data.newsletterEyebrow ?? "",
        newsletterTitle: data.newsletterTitle ?? "",
        homeAboutEyebrow: data.homeAboutEyebrow ?? "",
        homeAboutTitle: data.homeAboutTitle ?? "",
        collaborerEyebrow: data.collaborerEyebrow ?? "",
        collaborerHeroTitle: data.collaborerHeroTitle ?? "",
        collaborerHeroSubtitle: data.collaborerHeroSubtitle ?? "",
        collaborerCtaLabel: data.collaborerCtaLabel ?? "",
        collaborerCtaHref: data.collaborerCtaHref ?? "",
        collaborerClosingTitle: data.collaborerClosingTitle ?? "",
      },
    });
  }
}
