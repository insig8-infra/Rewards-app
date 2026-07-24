ALTER TABLE "Promotion"
ADD COLUMN "backgroundColor" TEXT NOT NULL DEFAULT '#00535B';

UPDATE "Promotion"
SET "overlayText" = NULL
WHERE "assetUrl" IS NOT NULL
  AND trim("assetUrl") <> '';
