-- Statut brouillon / publié pour contenus et événements agenda

CREATE TYPE "PublicationStatus" AS ENUM ('draft', 'published');

ALTER TABLE "contents" ADD COLUMN "status" "PublicationStatus" NOT NULL DEFAULT 'draft';
UPDATE "contents" SET "status" = 'published';

ALTER TABLE "events" ADD COLUMN "status" "PublicationStatus" NOT NULL DEFAULT 'draft';
UPDATE "events" SET "status" = 'published';

CREATE INDEX "contents_status_idx" ON "contents"("status");
CREATE INDEX "events_status_idx" ON "events"("status");
