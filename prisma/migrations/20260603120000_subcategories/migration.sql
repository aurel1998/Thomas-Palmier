-- CreateTable
CREATE TABLE "subcategories" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 100,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_category_id_name_key" ON "subcategories"("category_id", "name");

-- CreateIndex
CREATE INDEX "subcategories_category_id_idx" ON "subcategories"("category_id");

-- CreateIndex
CREATE INDEX "subcategories_created_by_id_idx" ON "subcategories"("created_by_id");

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "contents" ADD COLUMN "subcategory_id" UUID;

-- CreateIndex
CREATE INDEX "contents_subcategory_id_idx" ON "contents"("subcategory_id");

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
