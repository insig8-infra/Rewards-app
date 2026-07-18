-- CreateEnum
CREATE TYPE "BusyReturnVoucherStatus" AS ENUM ('IMPORTED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "BusyReturnAllocationType" AS ENUM ('NOT_PRINTED_UNAVAILABLE', 'PRINTED_CANCEL_ELIGIBLE', 'SCANNED_REVIEW_NEEDED', 'SCANNED_REVERSED');

-- CreateTable
CREATE TABLE "BusyReturnVoucher" (
    "id" TEXT NOT NULL,
    "externalReturnId" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "originalInvoiceId" TEXT NOT NULL,
    "status" "BusyReturnVoucherStatus" NOT NULL DEFAULT 'IMPORTED',
    "rawSource" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusyReturnVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusyReturnVoucherLine" (
    "id" TEXT NOT NULL,
    "returnVoucherId" TEXT NOT NULL,
    "externalReturnLineId" TEXT NOT NULL,
    "originalInvoiceLineId" TEXT,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rawSource" JSONB,

    CONSTRAINT "BusyReturnVoucherLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusyReturnAllocation" (
    "id" TEXT NOT NULL,
    "returnLineId" TEXT NOT NULL,
    "originalInvoiceLineId" TEXT,
    "qrUnitId" TEXT,
    "quantity" INTEGER NOT NULL,
    "type" "BusyReturnAllocationType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusyReturnAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusyReturnVoucher_externalReturnId_key" ON "BusyReturnVoucher"("externalReturnId");

-- CreateIndex
CREATE INDEX "BusyReturnVoucher_originalInvoiceId_returnDate_idx" ON "BusyReturnVoucher"("originalInvoiceId", "returnDate");

-- CreateIndex
CREATE INDEX "BusyReturnVoucher_returnNumber_idx" ON "BusyReturnVoucher"("returnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BusyReturnVoucherLine_returnVoucherId_externalReturnLineId_key" ON "BusyReturnVoucherLine"("returnVoucherId", "externalReturnLineId");

-- CreateIndex
CREATE INDEX "BusyReturnVoucherLine_sku_idx" ON "BusyReturnVoucherLine"("sku");

-- CreateIndex
CREATE INDEX "BusyReturnVoucherLine_originalInvoiceLineId_idx" ON "BusyReturnVoucherLine"("originalInvoiceLineId");

-- CreateIndex
CREATE UNIQUE INDEX "BusyReturnAllocation_qrUnitId_key" ON "BusyReturnAllocation"("qrUnitId");

-- CreateIndex
CREATE INDEX "BusyReturnAllocation_returnLineId_idx" ON "BusyReturnAllocation"("returnLineId");

-- CreateIndex
CREATE INDEX "BusyReturnAllocation_originalInvoiceLineId_idx" ON "BusyReturnAllocation"("originalInvoiceLineId");

-- AddForeignKey
ALTER TABLE "BusyReturnVoucher" ADD CONSTRAINT "BusyReturnVoucher_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "BusyInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusyReturnVoucherLine" ADD CONSTRAINT "BusyReturnVoucherLine_returnVoucherId_fkey" FOREIGN KEY ("returnVoucherId") REFERENCES "BusyReturnVoucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusyReturnVoucherLine" ADD CONSTRAINT "BusyReturnVoucherLine_originalInvoiceLineId_fkey" FOREIGN KEY ("originalInvoiceLineId") REFERENCES "BusyInvoiceLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusyReturnAllocation" ADD CONSTRAINT "BusyReturnAllocation_returnLineId_fkey" FOREIGN KEY ("returnLineId") REFERENCES "BusyReturnVoucherLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusyReturnAllocation" ADD CONSTRAINT "BusyReturnAllocation_originalInvoiceLineId_fkey" FOREIGN KEY ("originalInvoiceLineId") REFERENCES "BusyInvoiceLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusyReturnAllocation" ADD CONSTRAINT "BusyReturnAllocation_qrUnitId_fkey" FOREIGN KEY ("qrUnitId") REFERENCES "QrUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
