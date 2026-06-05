-- AlterEnum
ALTER TYPE "NewsletterCampaignKind" ADD VALUE 'reminder';

-- AlterTable
ALTER TABLE "events" ADD COLUMN "reminder_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN "reminder_sent_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "events_reminder_due_idx" ON "events"("reminder_enabled", "reminder_sent_at", "date");
