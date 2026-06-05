-- CreateEnum
CREATE TYPE "NewsletterCampaignKind" AS ENUM ('campaign', 'content', 'agenda');

-- CreateTable
CREATE TABLE "newsletter_campaigns" (
    "id" UUID NOT NULL,
    "kind" "NewsletterCampaignKind" NOT NULL,
    "subject" TEXT NOT NULL,
    "reference_id" UUID,
    "total_recipients" INTEGER NOT NULL,
    "sent_count" INTEGER NOT NULL,
    "failed_count" INTEGER NOT NULL,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "newsletter_campaigns_sent_at_idx" ON "newsletter_campaigns"("sent_at" DESC);
