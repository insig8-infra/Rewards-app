ALTER TYPE "QrStatus" ADD VALUE IF NOT EXISTS 'RESERVED_IN_CART';
ALTER TYPE "ScanResult" ADD VALUE IF NOT EXISTS 'RESERVED';
ALTER TYPE "ScanResult" ADD VALUE IF NOT EXISTS 'CART_CAP_REACHED';

DO $$ BEGIN
  CREATE TYPE "ScanCartStatus" AS ENUM ('ACTIVE', 'COMMITTED', 'INVALIDATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScanCartItemStatus" AS ENUM ('RESERVED', 'COMMITTED', 'REMOVED_BY_USER', 'INVALIDATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "QrUnit"
ADD COLUMN IF NOT EXISTS "reservedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reservedCartId" TEXT;

ALTER TABLE "ScanAttempt"
ADD COLUMN IF NOT EXISTS "qrValuePoints" INTEGER,
ADD COLUMN IF NOT EXISTS "creditedPoints" INTEGER;

CREATE TABLE IF NOT EXISTS "ScanCart" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "actorUserId" TEXT,
    "teamMemberSessionId" TEXT,
    "teamMemberMobile" TEXT,
    "status" "ScanCartStatus" NOT NULL DEFAULT 'ACTIVE',
    "cartTotalPoints" INTEGER NOT NULL DEFAULT 0,
    "scanCapPoints" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committedAt" TIMESTAMP(3),

    CONSTRAINT "ScanCart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ScanCartItem" (
    "id" TEXT NOT NULL,
    "scanCartId" TEXT NOT NULL,
    "qrUnitId" TEXT NOT NULL,
    "scanAttemptId" TEXT NOT NULL,
    "qrValuePoints" INTEGER NOT NULL,
    "pointsToCredit" INTEGER NOT NULL,
    "status" "ScanCartItemStatus" NOT NULL DEFAULT 'RESERVED',
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "invalidationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanCartItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ScanCart_contractorId_siteId_status_idx" ON "ScanCart"("contractorId", "siteId", "status");
CREATE INDEX IF NOT EXISTS "ScanCart_teamMemberMobile_lastActivityAt_idx" ON "ScanCart"("teamMemberMobile", "lastActivityAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ScanCartItem_qrUnitId_key" ON "ScanCartItem"("qrUnitId");
CREATE UNIQUE INDEX IF NOT EXISTS "ScanCartItem_scanAttemptId_key" ON "ScanCartItem"("scanAttemptId");
CREATE INDEX IF NOT EXISTS "ScanCartItem_scanCartId_status_idx" ON "ScanCartItem"("scanCartId", "status");

DO $$ BEGIN
  ALTER TABLE "QrUnit" ADD CONSTRAINT "QrUnit_reservedCartId_fkey" FOREIGN KEY ("reservedCartId") REFERENCES "ScanCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScanCart" ADD CONSTRAINT "ScanCart_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScanCart" ADD CONSTRAINT "ScanCart_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScanCartItem" ADD CONSTRAINT "ScanCartItem_scanCartId_fkey" FOREIGN KEY ("scanCartId") REFERENCES "ScanCart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScanCartItem" ADD CONSTRAINT "ScanCartItem_qrUnitId_fkey" FOREIGN KEY ("qrUnitId") REFERENCES "QrUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScanCartItem" ADD CONSTRAINT "ScanCartItem_scanAttemptId_fkey" FOREIGN KEY ("scanAttemptId") REFERENCES "ScanAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
