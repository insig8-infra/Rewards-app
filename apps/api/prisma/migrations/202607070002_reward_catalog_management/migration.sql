ALTER TYPE "RewardCatalogStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

ALTER TABLE "RewardCatalogItem" ADD COLUMN "code" TEXT;
ALTER TABLE "RewardCatalogItem" ADD COLUMN "cashValueInr" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RewardCatalogItem" ADD COLUMN "totalQuantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RewardCatalogItem" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

UPDATE "RewardCatalogItem"
SET "code" = upper(replace("id", 'reward-', 'RW-'))
WHERE "code" IS NULL;

ALTER TABLE "RewardCatalogItem" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "RewardCatalogItem_code_key" ON "RewardCatalogItem"("code");

CREATE TABLE "RewardCatalogImage" (
    "id" TEXT NOT NULL,
    "rewardItemId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "storagePath" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardCatalogImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RewardCatalogImage_rewardItemId_sortOrder_idx" ON "RewardCatalogImage"("rewardItemId", "sortOrder");

ALTER TABLE "RewardCatalogImage" ADD CONSTRAINT "RewardCatalogImage_rewardItemId_fkey" FOREIGN KEY ("rewardItemId") REFERENCES "RewardCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "RewardCatalogImage" ("id", "rewardItemId", "imageUrl", "altText", "sortOrder", "createdAt", "updatedAt")
SELECT concat("id", '-primary-image'), "id", "imageUrl", "name", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "RewardCatalogItem"
WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> '';
