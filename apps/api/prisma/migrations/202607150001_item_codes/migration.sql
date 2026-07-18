CREATE TYPE "ItemCodeStatus" AS ENUM ('IN_USE', 'NOT_IN_USE', 'NOT_IN_BUSY');

CREATE TABLE "ItemCode" (
    "id" TEXT NOT NULL,
    "tempItemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "productCategory" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "fixedPoints" INTEGER,
    "percentOfPricePoints" DECIMAL(7,3),
    "status" "ItemCodeStatus" NOT NULL DEFAULT 'IN_USE',
    "busyActive" BOOLEAN NOT NULL DEFAULT true,
    "lastBusySyncAt" TIMESTAMP(3),
    "missingSince" TIMESTAMP(3),
    "sourcePriceField" TEXT NOT NULL DEFAULT 'Price',
    "rawSource" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ItemCode_tempItemCode_key" ON "ItemCode"("tempItemCode");
CREATE INDEX "ItemCode_status_idx" ON "ItemCode"("status");
CREATE INDEX "ItemCode_busyActive_idx" ON "ItemCode"("busyActive");
CREATE INDEX "ItemCode_itemName_idx" ON "ItemCode"("itemName");
