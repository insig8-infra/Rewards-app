-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'STAFF', 'CONTRACTOR', 'TEAM_MEMBER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "ContractorStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "TeamMemberStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('IMPORTED', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QrStatus" AS ENUM ('NOT_PRINTED', 'PRINTED_UNCLAIMED', 'SCANNED_CLAIMED', 'EXPIRED', 'CANCELLED', 'REPRINTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "QrTokenStatus" AS ENUM ('ACTIVE', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('SUCCESS', 'ALREADY_CLAIMED', 'EXPIRED', 'INVALID', 'REPLACED', 'PERMISSION_DENIED');

-- CreateEnum
CREATE TYPE "PointsLedgerType" AS ENUM ('SCAN_CREDIT', 'QR_REVERSE', 'REWARD_REDEEM', 'REWARD_CANCEL_RESTORE', 'REWARD_FULFILLED', 'REWARD_REVOKED_DUE_TO_RETURN');

-- CreateEnum
CREATE TYPE "LedgerSourceType" AS ENUM ('QR_UNIT', 'REWARD_CLAIM', 'BUSY_RETURN', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RewardClaimStatus" AS ENUM ('CHOSEN', 'CANCELLED_BY_CONTRACTOR', 'REVOKED_DUE_TO_RETURN', 'FULFILLED');

-- CreateEnum
CREATE TYPE "RewardCatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AuditSurface" AS ENUM ('END_USER_APP', 'ADMIN_MOBILE', 'ADMIN_WEB', 'BACKEND_JOB');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PromotionTargetPersona" AS ENUM ('CONTRACTOR', 'TEAM_MEMBER', 'ALL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "pinHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "createdByOwnerId" TEXT,
    "lastOpenedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "temporaryMpinHash" TEXT,
    "mpinHash" TEXT,
    "mpinSetAt" TIMESTAMP(3),
    "tier" TEXT,
    "totalAccumulatedPoints" INTEGER NOT NULL DEFAULT 0,
    "availablePoints" INTEGER NOT NULL DEFAULT 0,
    "status" "ContractorStatus" NOT NULL DEFAULT 'ACTIVE',
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "userId" TEXT,
    "mobileNumber" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "TeamMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "flatOrApartmentNo" TEXT,
    "buildingName" TEXT,
    "area" TEXT,
    "city" TEXT,
    "status" "SiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusyInvoice" (
    "id" TEXT NOT NULL,
    "externalInvoiceId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "customerRef" TEXT,
    "totalAmount" DECIMAL(12,2),
    "rawSource" JSONB,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'IMPORTED',
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusyInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusyInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "externalLineId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL,
    "returnedQty" INTEGER NOT NULL DEFAULT 0,
    "pointsPerUnit" INTEGER NOT NULL DEFAULT 0,
    "rawSource" JSONB,

    CONSTRAINT "BusyInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrUnit" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "invoiceLineId" TEXT,
    "unitIndex" INTEGER NOT NULL,
    "productSku" TEXT,
    "points" INTEGER NOT NULL,
    "status" "QrStatus" NOT NULL DEFAULT 'NOT_PRINTED',
    "expiresAt" TIMESTAMP(3),
    "printedAt" TIMESTAMP(3),
    "scannedAt" TIMESTAMP(3),
    "claimedByContractorId" TEXT,
    "siteId" TEXT,
    "printedByUserId" TEXT,
    "replacementForQrUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QrUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrToken" (
    "id" TEXT NOT NULL,
    "qrUnitId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "QrTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invalidatedAt" TIMESTAMP(3),

    CONSTRAINT "QrToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanAttempt" (
    "id" TEXT NOT NULL,
    "qrUnitId" TEXT,
    "tokenHashSeen" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "actorUserId" TEXT,
    "teamMemberId" TEXT,
    "contractorId" TEXT,
    "siteId" TEXT,
    "result" "ScanResult" NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLedgerEntry" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "type" "PointsLedgerType" NOT NULL,
    "pointsDelta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "sourceType" "LedgerSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "qrUnitId" TEXT,
    "rewardClaimId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardCatalogItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsRequired" INTEGER NOT NULL,
    "tierRequired" TEXT,
    "imageUrl" TEXT,
    "status" "RewardCatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardClaim" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "rewardItemId" TEXT NOT NULL,
    "status" "RewardClaimStatus" NOT NULL DEFAULT 'CHOSEN',
    "pointsDeducted" INTEGER NOT NULL,
    "chosenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "fulfilledByOwnerId" TEXT,
    "otpVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "RewardClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" "UserRole" NOT NULL,
    "surface" "AuditSurface" NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadata" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "assetUrl" TEXT,
    "targetPersona" "PromotionTargetPersona" NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobileNumber_key" ON "User"("mobileNumber");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_userId_key" ON "Contractor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_code_key" ON "Contractor"("code");

-- CreateIndex
CREATE INDEX "Contractor_status_idx" ON "Contractor"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_mobileNumber_idx" ON "TeamMember"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_contractorId_mobileNumber_key" ON "TeamMember"("contractorId", "mobileNumber");

-- CreateIndex
CREATE INDEX "Site_contractorId_status_idx" ON "Site"("contractorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BusyInvoice_externalInvoiceId_key" ON "BusyInvoice"("externalInvoiceId");

-- CreateIndex
CREATE INDEX "BusyInvoice_invoiceDate_idx" ON "BusyInvoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "BusyInvoice_invoiceNumber_idx" ON "BusyInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "BusyInvoiceLine_sku_idx" ON "BusyInvoiceLine"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "BusyInvoiceLine_invoiceId_externalLineId_key" ON "BusyInvoiceLine"("invoiceId", "externalLineId");

-- CreateIndex
CREATE INDEX "QrUnit_status_expiresAt_idx" ON "QrUnit"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "QrUnit_claimedByContractorId_idx" ON "QrUnit"("claimedByContractorId");

-- CreateIndex
CREATE UNIQUE INDEX "QrUnit_invoiceId_unitIndex_key" ON "QrUnit"("invoiceId", "unitIndex");

-- CreateIndex
CREATE UNIQUE INDEX "QrToken_tokenHash_key" ON "QrToken"("tokenHash");

-- CreateIndex
CREATE INDEX "QrToken_qrUnitId_status_idx" ON "QrToken"("qrUnitId", "status");

-- CreateIndex
CREATE INDEX "ScanAttempt_tokenHashSeen_idx" ON "ScanAttempt"("tokenHashSeen");

-- CreateIndex
CREATE INDEX "ScanAttempt_contractorId_createdAt_idx" ON "ScanAttempt"("contractorId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanAttempt_qrUnitId_result_idx" ON "ScanAttempt"("qrUnitId", "result");

-- CreateIndex
CREATE UNIQUE INDEX "PointsLedgerEntry_idempotencyKey_key" ON "PointsLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PointsLedgerEntry_contractorId_createdAt_idx" ON "PointsLedgerEntry"("contractorId", "createdAt");

-- CreateIndex
CREATE INDEX "PointsLedgerEntry_sourceType_sourceId_idx" ON "PointsLedgerEntry"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "RewardCatalogItem_status_pointsRequired_idx" ON "RewardCatalogItem"("status", "pointsRequired");

-- CreateIndex
CREATE UNIQUE INDEX "RewardClaim_claimId_key" ON "RewardClaim"("claimId");

-- CreateIndex
CREATE INDEX "RewardClaim_contractorId_status_idx" ON "RewardClaim"("contractorId", "status");

-- CreateIndex
CREATE INDEX "RewardClaim_rewardItemId_idx" ON "RewardClaim"("rewardItemId");

-- CreateIndex
CREATE INDEX "AuditEvent_targetType_targetId_createdAt_idx" ON "AuditEvent"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_requestId_idx" ON "AuditEvent"("requestId");

-- CreateIndex
CREATE INDEX "Promotion_status_targetPersona_startsAt_endsAt_idx" ON "Promotion"("status", "targetPersona", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_createdByOwnerId_fkey" FOREIGN KEY ("createdByOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contractor" ADD CONSTRAINT "Contractor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusyInvoiceLine" ADD CONSTRAINT "BusyInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BusyInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrUnit" ADD CONSTRAINT "QrUnit_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BusyInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrUnit" ADD CONSTRAINT "QrUnit_invoiceLineId_fkey" FOREIGN KEY ("invoiceLineId") REFERENCES "BusyInvoiceLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrUnit" ADD CONSTRAINT "QrUnit_claimedByContractorId_fkey" FOREIGN KEY ("claimedByContractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrUnit" ADD CONSTRAINT "QrUnit_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrUnit" ADD CONSTRAINT "QrUnit_printedByUserId_fkey" FOREIGN KEY ("printedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrUnit" ADD CONSTRAINT "QrUnit_replacementForQrUnitId_fkey" FOREIGN KEY ("replacementForQrUnitId") REFERENCES "QrUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrToken" ADD CONSTRAINT "QrToken_qrUnitId_fkey" FOREIGN KEY ("qrUnitId") REFERENCES "QrUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanAttempt" ADD CONSTRAINT "ScanAttempt_qrUnitId_fkey" FOREIGN KEY ("qrUnitId") REFERENCES "QrUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanAttempt" ADD CONSTRAINT "ScanAttempt_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanAttempt" ADD CONSTRAINT "ScanAttempt_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanAttempt" ADD CONSTRAINT "ScanAttempt_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanAttempt" ADD CONSTRAINT "ScanAttempt_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLedgerEntry" ADD CONSTRAINT "PointsLedgerEntry_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLedgerEntry" ADD CONSTRAINT "PointsLedgerEntry_qrUnitId_fkey" FOREIGN KEY ("qrUnitId") REFERENCES "QrUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLedgerEntry" ADD CONSTRAINT "PointsLedgerEntry_rewardClaimId_fkey" FOREIGN KEY ("rewardClaimId") REFERENCES "RewardClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLedgerEntry" ADD CONSTRAINT "PointsLedgerEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardClaim" ADD CONSTRAINT "RewardClaim_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardClaim" ADD CONSTRAINT "RewardClaim_rewardItemId_fkey" FOREIGN KEY ("rewardItemId") REFERENCES "RewardCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardClaim" ADD CONSTRAINT "RewardClaim_fulfilledByOwnerId_fkey" FOREIGN KEY ("fulfilledByOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
