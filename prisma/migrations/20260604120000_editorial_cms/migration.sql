-- CreateEnum
CREATE TYPE "CredibilityKind" AS ENUM ('media', 'partner', 'award', 'institution');

-- AlterTable journalist_profile
ALTER TABLE "journalist_profile" ADD COLUMN "display_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "journalist_profile" ADD COLUMN "job_title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "journalist_profile" ADD COLUMN "tagline" TEXT NOT NULL DEFAULT '';
ALTER TABLE "journalist_profile" ADD COLUMN "bio_short" TEXT NOT NULL DEFAULT '';
ALTER TABLE "journalist_profile" ADD COLUMN "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "journalist_profile" ADD COLUMN "hero_video_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "journalist_profile" ADD COLUMN "hero_poster_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "journalist_profile" ADD COLUMN "photo_caption" TEXT NOT NULL DEFAULT '';
ALTER TABLE "journalist_profile" ADD COLUMN "editorial_line" TEXT NOT NULL DEFAULT '';

-- CreateTable site_settings
CREATE TABLE "site_settings" (
    "id" BOOLEAN NOT NULL DEFAULT true,
    "footer_tagline" TEXT NOT NULL DEFAULT '',
    "contact_intro" TEXT NOT NULL DEFAULT '',
    "contact_role" TEXT NOT NULL DEFAULT '',
    "newsletter_eyebrow" TEXT NOT NULL DEFAULT '',
    "newsletter_title" TEXT NOT NULL DEFAULT '',
    "home_about_eyebrow" TEXT NOT NULL DEFAULT '',
    "home_about_title" TEXT NOT NULL DEFAULT '',
    "collaborer_eyebrow" TEXT NOT NULL DEFAULT '',
    "collaborer_hero_title" TEXT NOT NULL DEFAULT '',
    "collaborer_hero_subtitle" TEXT NOT NULL DEFAULT '',
    "collaborer_cta_label" TEXT NOT NULL DEFAULT '',
    "collaborer_cta_href" TEXT NOT NULL DEFAULT '',
    "collaborer_closing_title" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable credibility_items
CREATE TABLE "credibility_items" (
    "id" UUID NOT NULL,
    "kind" "CredibilityKind" NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "subtitle" TEXT NOT NULL DEFAULT '',
    "year" TEXT NOT NULL DEFAULT '',
    "logo_url" TEXT NOT NULL DEFAULT '',
    "initials" TEXT NOT NULL DEFAULT '',
    "link_url" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "credibility_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "credibility_items_kind_position_idx" ON "credibility_items"("kind", "position");
CREATE INDEX "credibility_items_is_active_idx" ON "credibility_items"("is_active");

-- CreateTable timeline_steps
CREATE TABLE "timeline_steps" (
    "id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "timeline_steps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "timeline_steps_position_idx" ON "timeline_steps"("position");

-- CreateTable social_links
CREATE TABLE "social_links" (
    "id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_links_position_idx" ON "social_links"("position");
CREATE INDEX "social_links_is_active_idx" ON "social_links"("is_active");

-- CreateTable collaboration_offers
CREATE TABLE "collaboration_offers" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "collaboration_offers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "collaboration_offers_position_idx" ON "collaboration_offers"("position");

-- CreateTable collaboration_cases
CREATE TABLE "collaboration_cases" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "collaboration_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "collaboration_cases_position_idx" ON "collaboration_cases"("position");
