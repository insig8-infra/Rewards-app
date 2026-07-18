-- Preserve Team Member scan history without creating durable Team Member profiles.
ALTER TABLE "ScanAttempt"
ADD COLUMN "teamMemberMobile" TEXT,
ADD COLUMN "teamMemberSessionId" TEXT,
ADD COLUMN "deviceContext" JSONB;

CREATE INDEX "ScanAttempt_teamMemberMobile_createdAt_idx" ON "ScanAttempt"("teamMemberMobile", "createdAt");
