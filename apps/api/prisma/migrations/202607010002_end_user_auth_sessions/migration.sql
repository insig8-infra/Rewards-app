CREATE TYPE "AuthSessionStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "OtpChallengeStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED');

ALTER TABLE "Contractor"
ADD COLUMN "temporaryMpinExpiresAt" TIMESTAMP(3);

CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "actorRole" "UserRole" NOT NULL,
  "userId" TEXT,
  "contractorId" TEXT,
  "teamMemberMobile" TEXT,
  "requiresMpinSetup" BOOLEAN NOT NULL DEFAULT false,
  "status" "AuthSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OtpChallenge" (
  "id" TEXT NOT NULL,
  "otpHash" TEXT NOT NULL,
  "contractorId" TEXT NOT NULL,
  "contractorMobileNumber" TEXT NOT NULL,
  "teamMemberMobile" TEXT,
  "status" "OtpChallengeStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "deviceContext" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");
CREATE INDEX "AuthSession_tokenHash_status_expiresAt_idx" ON "AuthSession"("tokenHash", "status", "expiresAt");
CREATE INDEX "AuthSession_contractorId_createdAt_idx" ON "AuthSession"("contractorId", "createdAt");
CREATE INDEX "AuthSession_userId_createdAt_idx" ON "AuthSession"("userId", "createdAt");

CREATE INDEX "OtpChallenge_contractorId_createdAt_idx" ON "OtpChallenge"("contractorId", "createdAt");
CREATE INDEX "OtpChallenge_teamMemberMobile_createdAt_idx" ON "OtpChallenge"("teamMemberMobile", "createdAt");
CREATE INDEX "OtpChallenge_status_expiresAt_idx" ON "OtpChallenge"("status", "expiresAt");

ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_contractorId_fkey"
FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OtpChallenge" ADD CONSTRAINT "OtpChallenge_contractorId_fkey"
FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
