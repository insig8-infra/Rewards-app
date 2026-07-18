ALTER TABLE "Promotion"
  ADD COLUMN "overlayFontFamily" TEXT NOT NULL DEFAULT 'noto-sans-devanagari',
  ADD COLUMN "marqueeEnabled" BOOLEAN NOT NULL DEFAULT false;
