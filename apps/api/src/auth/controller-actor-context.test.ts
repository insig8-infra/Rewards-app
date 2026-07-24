import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ACTOR_ROLE, DomainError } from "@volt-rewards/domain";
import { AdminWebDashboardController } from "../admin-web/admin-web-dashboard.controller.js";
import type { AdminWebDashboardService } from "../admin-web/admin-web-dashboard.service.js";
import { AdminWebBusyController } from "../busy/admin-web-busy.controller.js";
import { AdminWebInvoicesController } from "../busy/admin-web-invoices.controller.js";
import type { AdminWebInvoiceReadService } from "../busy/admin-web-invoice-read.service.js";
import type { BusyImportService } from "../busy/busy-import.service.js";
import { AdminMobileContractorsController } from "../contractors/admin-mobile-contractors.controller.js";
import { AdminWebContractorsController } from "../contractors/admin-web-contractors.controller.js";
import type { AdminContractorWriteInput } from "../contractors/admin-contractor.repository.js";
import type { AdminContractorService } from "../contractors/admin-contractor.service.js";
import { AdminWebItemCodesController } from "../item-codes/admin-web-item-codes.controller.js";
import type { ItemCodesService } from "../item-codes/item-codes.service.js";
import { AdminMobileQrReturnController } from "../qr/admin-mobile-qr-return.controller.js";
import { AdminWebQrController } from "../qr/admin-web-qr.controller.js";
import type { QrPrintHistoryService } from "../qr/qr-print-history.service.js";
import type { QrPrintService } from "../qr/qr-print.service.js";
import type { QrReturnService } from "../qr/qr-return.service.js";
import { ScanController } from "../qr/scan.controller.js";
import type { QrScanService } from "../qr/qr-scan.service.js";
import { AdminMobileReportsController } from "../reports/admin-mobile-reports.controller.js";
import type { ReportsService } from "../reports/reports.service.js";
import { AdminMobileRewardsController } from "../rewards/admin-mobile-rewards.controller.js";
import { AdminWebRewardsController } from "../rewards/admin-web-rewards.controller.js";
import { RewardsController } from "../rewards/rewards.controller.js";
import type { RewardsService } from "../rewards/rewards.service.js";
import { AdminMobileStaffController } from "../staff/admin-mobile-staff.controller.js";
import type { AdminStaffWriteInput } from "../staff/admin-staff.repository.js";
import type { AdminStaffService } from "../staff/admin-staff.service.js";
import { AdminWebContractorAuthController } from "./admin-web-contractor-auth.controller.js";
import type { AuthenticatedActor } from "./authenticated-actor.js";
import type { MobileAuthService } from "./mobile-auth.service.js";

test("AdminWebQrController uses actor context instead of body actor fields", async () => {
  let command:
    | Parameters<QrPrintService["printQr"]>[0]
    | undefined;
  const controller = new AdminWebQrController(
    {
      printQr: (input: Parameters<QrPrintService["printQr"]>[0]) => {
        command = input;
        return Promise.resolve({
          invoiceId: input.invoiceId,
          printedAt: input.printedAt,
          expiresAt: input.printedAt,
          printedUnits: [],
        });
      },
    } as unknown as QrPrintService,
    { listPrintHistory: () => Promise.resolve([]) } as unknown as QrPrintHistoryService,
  );

  await controller.printQr(
    { role: ACTOR_ROLE.STAFF, userId: "staff_user_1" },
    {
      invoiceId: "invoice_1",
      lines: [{ invoiceLineId: "line_1", quantity: 1 }],
      now: "2026-06-22T00:00:00.000Z",
      actorRole: ACTOR_ROLE.CONTRACTOR,
      actorUserId: "forged_user",
    } as never,
  );

  assert.equal(command?.actorRole, ACTOR_ROLE.STAFF);
  assert.equal(command?.actorUserId, "staff_user_1");
});

test("AdminWebQrController maps QR print domain failures to BadRequestException", async () => {
  const controller = new AdminWebQrController(
    {
      printQr: () => Promise.reject(new DomainError("QR_PRINT_LINE_NOT_FOUND", "Invoice line is not available.")),
    } as unknown as QrPrintService,
    { listPrintHistory: () => Promise.resolve([]) } as unknown as QrPrintHistoryService,
  );

  await assert.rejects(
    controller.printQr(
      { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
      {
        invoiceId: "invoice_1",
        lines: [{ invoiceLineId: "missing_line", quantity: 1 }],
      },
    ),
    (error) => error instanceof BadRequestException,
  );
});

test("AdminWebContractorAuthController accepts empty reset MPIN body", async () => {
  let command:
    | {
        readonly contractorId: string;
        readonly actor: AuthenticatedActor;
        readonly resetAt: Date;
      }
    | undefined;
  const controller = new AdminWebContractorAuthController({
    resetContractorMpin: (contractorId: string, actor: AuthenticatedActor, resetAt: Date) => {
      command = { contractorId, actor, resetAt };
      return Promise.resolve({
        contractorId,
        temporaryMpin: "2468",
        expiresAt: resetAt,
      });
    },
  } as unknown as MobileAuthService);

  const result = await controller.resetContractorMpin(
    { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
    "contractor_1",
    undefined as never,
  );

  assert.equal(result.temporaryMpin, "2468");
  assert.equal(command?.contractorId, "contractor_1");
  assert.equal(command?.actor.role, ACTOR_ROLE.OWNER);
  assert.ok(command?.resetAt instanceof Date);
});

test("ScanController uses actor contractor scope instead of body contractor fields", async () => {
  let command:
    | Parameters<QrScanService["scanQr"]>[0]
    | undefined;
  const controller = new ScanController({
    scanQr: (input: Parameters<QrScanService["scanQr"]>[0]) => {
      command = input;
      return Promise.resolve({
        qrId: "qr_1",
        contractorId: input.contractorId,
        siteId: input.siteId,
        pointsCredited: 100,
        balanceAfter: 100,
        scannedAt: input.now,
      });
    },
  } as unknown as QrScanService);

  await controller.scanQr(
    { role: ACTOR_ROLE.CONTRACTOR, contractorId: "contractor_from_actor" },
    {
      token: "token_1",
      siteId: "site_1",
      now: "2026-06-22T00:00:00.000Z",
      actorRole: ACTOR_ROLE.OWNER,
      contractorId: "forged_contractor",
    } as never,
  );

  assert.equal(command?.actorRole, ACTOR_ROLE.CONTRACTOR);
  assert.equal(command?.contractorId, "contractor_from_actor");
});

test("ScanController passes Team Member mobile from actor context", async () => {
  let command:
    | Parameters<QrScanService["scanQr"]>[0]
    | undefined;
  const controller = new ScanController({
    scanQr: (input: Parameters<QrScanService["scanQr"]>[0]) => {
      command = input;
      return Promise.resolve({
        qrId: "qr_1",
        contractorId: input.contractorId,
        siteId: input.siteId,
        pointsCredited: 100,
        balanceAfter: 100,
        scannedAt: input.now,
      });
    },
  } as unknown as QrScanService);

  await controller.scanQr(
    {
      role: ACTOR_ROLE.TEAM_MEMBER,
      contractorId: "contractor_from_actor",
      teamMemberMobile: "9876543210",
    },
    {
      token: "token_1",
      siteId: "site_1",
      teamMemberSessionId: "tm-session-1",
      now: "2026-06-22T00:00:00.000Z",
      teamMemberMobile: "0000000000",
    } as never,
  );

  assert.equal(command?.actorRole, ACTOR_ROLE.TEAM_MEMBER);
  assert.equal(command?.contractorId, "contractor_from_actor");
  assert.equal(command?.teamMemberMobile, "9876543210");
  assert.equal(command?.teamMemberSessionId, "tm-session-1");
});

test("ScanController rejects Team Member scans without Team Member mobile", () => {
  const controller = new ScanController({
    scanQr: (() => {
      throw new Error("scan service should not be called");
    }) as QrScanService["scanQr"],
  } as unknown as QrScanService);

  assert.throws(
    () =>
      controller.scanQr(
        { role: ACTOR_ROLE.TEAM_MEMBER, contractorId: "contractor_1" },
        {
          token: "token_1",
          siteId: "site_1",
          now: "2026-06-22T00:00:00.000Z",
        },
      ),
    (error) => error instanceof UnauthorizedException,
  );
});

test("ScanController rejects scan actors without contractor scope", () => {
  const controller = new ScanController({
    scanQr: (() => {
      throw new Error("scan service should not be called");
    }) as QrScanService["scanQr"],
  } as unknown as QrScanService);

  assert.throws(
    () =>
      controller.scanQr(
        { role: ACTOR_ROLE.TEAM_MEMBER },
        {
          token: "token_1",
          siteId: "site_1",
          now: "2026-06-22T00:00:00.000Z",
        },
      ),
    (error) => error instanceof UnauthorizedException,
  );
});

test("ScanController scopes Team Member scan history by actor mobile", async () => {
  let command:
    | Parameters<QrScanService["listScanHistory"]>[0]
    | undefined;
  const controller = new ScanController({
    listScanHistory: (input: Parameters<QrScanService["listScanHistory"]>[0]) => {
      command = input;
      return Promise.resolve([]);
    },
  } as unknown as QrScanService);

  await controller.listHistory(
    {
      role: ACTOR_ROLE.TEAM_MEMBER,
      contractorId: "contractor_from_actor",
      teamMemberMobile: "9876543210",
    },
    {
      siteId: "site_1",
      limit: "10",
    },
  );

  assert.equal(command?.actorRole, ACTOR_ROLE.TEAM_MEMBER);
  assert.equal(command?.contractorId, "contractor_from_actor");
  assert.equal(command?.teamMemberMobile, "9876543210");
  assert.equal(command?.siteId, "site_1");
  assert.equal(command?.limit, 10);
});

test("ScanController rejects Team Member history without Team Member mobile", () => {
  const controller = new ScanController({
    listScanHistory: (() => {
      throw new Error("scan service should not be called");
    }) as QrScanService["listScanHistory"],
  } as unknown as QrScanService);

  assert.throws(
    () =>
      controller.listHistory(
        { role: ACTOR_ROLE.TEAM_MEMBER, contractorId: "contractor_1" },
        {
          limit: "10",
        },
      ),
    (error) => error instanceof UnauthorizedException,
  );
});

test("AdminMobileQrReturnController uses guarded actor context for returned QR operations", async () => {
  const commands: {
    lookupActor?: AuthenticatedActor;
    cancelActor?: AuthenticatedActor;
    reverseActor?: AuthenticatedActor;
    cancelLabel: boolean | undefined;
    reverseLabel: boolean | undefined;
  } = {
    cancelLabel: undefined,
    reverseLabel: undefined,
  };
  const controller = new AdminMobileQrReturnController({
    lookupByToken: (actor: AuthenticatedActor) => {
      commands.lookupActor = actor;
      return Promise.resolve({
        qrUnitId: "qr_1",
        status: "PRINTED_UNCLAIMED",
        tokenStatus: "ACTIVE",
        action: "CAN_CANCEL",
        reason: "Eligible",
        reasonCode: "ELIGIBLE_CANCEL",
        qr: {
          qrUnitId: "qr_1",
          shortCode: "QR1",
          status: "PRINTED_UNCLAIMED",
          productName: "Havells Wire",
          invoiceNumber: "VR/26-27/1001",
          invoiceDate: new Date("2026-07-01T00:00:00.000Z"),
          points: 30,
        },
      });
    },
    cancelQr: (actor: AuthenticatedActor, _qrUnitId: string, input: { readonly labelRemovedAndDiscarded?: boolean }) => {
      commands.cancelActor = actor;
      commands.cancelLabel = input.labelRemovedAndDiscarded;
      return Promise.resolve({
        qrUnitId: "qr_1",
        status: "CANCELLED",
        tokenStatus: "INVALIDATED",
        action: "NONE",
        reason: "Inactive",
        reasonCode: "TOKEN_INACTIVE",
        qr: {
          qrUnitId: "qr_1",
          shortCode: "QR1",
          status: "CANCELLED",
          productName: "Havells Wire",
          invoiceNumber: "VR/26-27/1001",
          invoiceDate: new Date("2026-07-01T00:00:00.000Z"),
          points: 30,
        },
        operation: {
          type: "CANCELLED",
          completedAt: new Date("2026-07-06T00:00:00.000Z"),
          reason: "Product Returned",
          auditEventId: "audit_1",
          revokedClaims: [],
        },
      });
    },
    reverseQr: (actor: AuthenticatedActor, _qrUnitId: string, input: { readonly labelRemovedAndDiscarded?: boolean }) => {
      commands.reverseActor = actor;
      commands.reverseLabel = input.labelRemovedAndDiscarded;
      return Promise.resolve({
        qrUnitId: "qr_1",
        status: "REVERSED",
        tokenStatus: "INVALIDATED",
        action: "NONE",
        reason: "Inactive",
        reasonCode: "TOKEN_INACTIVE",
        qr: {
          qrUnitId: "qr_1",
          shortCode: "QR1",
          status: "REVERSED",
          productName: "Havells Wire",
          invoiceNumber: "VR/26-27/1001",
          invoiceDate: new Date("2026-07-01T00:00:00.000Z"),
          points: 30,
        },
        operation: {
          type: "REVERSED",
          completedAt: new Date("2026-07-06T00:00:00.000Z"),
          reason: "Product Returned",
          auditEventId: "audit_2",
          revokedClaims: [],
        },
      });
    },
  } as unknown as QrReturnService);
  const actor = { role: ACTOR_ROLE.STAFF, userId: "staff_user_1" };

  await controller.lookup(actor, { token: "token_1", actorRole: ACTOR_ROLE.CONTRACTOR } as never);
  await controller.cancel(actor, "qr_1", { labelRemovedAndDiscarded: true });
  await controller.reverse(actor, "qr_1", { labelRemovedAndDiscarded: true });

  assert.equal(commands.lookupActor?.role, ACTOR_ROLE.STAFF);
  assert.equal(commands.cancelActor?.userId, "staff_user_1");
  assert.equal(commands.reverseActor?.userId, "staff_user_1");
  assert.equal(commands.cancelLabel, true);
  assert.equal(commands.reverseLabel, true);
});

test("AdminWebBusyController passes actor context to mock import service", async () => {
  let actor:
    | Parameters<BusyImportService["importMockInvoice"]>[2]
    | undefined;
  const controller = new AdminWebBusyController({
    importMockInvoice: (
      externalInvoiceId: string,
      importedAt: Date,
      inputActor?: Parameters<BusyImportService["importMockInvoice"]>[2],
    ) => {
      actor = inputActor;
      return Promise.resolve({
        invoiceId: "invoice_1",
        externalInvoiceId,
        invoiceNumber: "INV-1",
        lineCount: 1,
        qrUnitCount: 1,
      });
    },
    listMockInvoices: () => [],
  } as unknown as BusyImportService);

  await controller.importMockInvoice(
    { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
    {
      externalInvoiceId: "busy-inv-1001",
      now: "2026-06-22T00:00:00.000Z",
    },
  );

  assert.deepEqual(actor, { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });
});

test("AdminWebBusyController passes actor context to mock sync service", async () => {
  let actor:
    | Parameters<BusyImportService["syncMockInvoices"]>[1]
    | undefined;
  const controller = new AdminWebBusyController({
    syncMockInvoices: (
      syncedAt: Date,
      inputActor?: Parameters<BusyImportService["syncMockInvoices"]>[1],
    ) => {
      actor = inputActor;
      return Promise.resolve({
        latestSyncAt: syncedAt.toISOString(),
        sourceInvoiceCount: 1,
        syncedInvoiceCount: 1,
        importedInvoices: [],
      });
    },
  } as unknown as BusyImportService);

  await controller.syncMockInvoices(
    { role: ACTOR_ROLE.STAFF, userId: "staff_user_1" },
    { now: "2026-07-07T10:30:00.000Z" },
  );

  assert.deepEqual(actor, { role: ACTOR_ROLE.STAFF, userId: "staff_user_1" });
});

test("AdminWebBusyController maps mock import domain failures to BadRequestException", async () => {
  const controller = new AdminWebBusyController({
    importMockInvoice: () => Promise.reject(new DomainError("BUSY_MOCK_INVOICE_NOT_FOUND", "Mock BUSY invoice was not found.")),
    listMockInvoices: () => [],
  } as unknown as BusyImportService);

  await assert.rejects(
    controller.importMockInvoice(
      { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
      { externalInvoiceId: "missing-invoice" },
    ),
    (error) => error instanceof BadRequestException,
  );
});

test("AdminWebItemCodesController uses OWNER actor context for reward-rule mutations", async () => {
  let command:
    | {
        readonly itemCodeId: string;
        readonly actor: AuthenticatedActor;
        readonly fixedPoints: number | null | undefined;
        readonly percentOfPricePoints: number | null | undefined;
      }
    | undefined;
  const controller = new AdminWebItemCodesController({
    listItemCodes: () => Promise.resolve([]),
    refreshFromBusyAdapter: () => Promise.resolve({
      sourceCount: 0,
      createdCount: 0,
      updatedCount: 0,
      missingCount: 0,
      attentionCount: 0,
      latestSyncAt: new Date("2026-07-15T00:00:00.000Z"),
      itemsNeedingAttention: [],
    }),
    updateRewardRule: (
      itemCodeId: string,
      input: { readonly fixedPoints?: number | null; readonly percentOfPricePoints?: number | null },
      actor: AuthenticatedActor,
    ) => {
      command = {
        itemCodeId,
        actor,
        fixedPoints: input.fixedPoints,
        percentOfPricePoints: input.percentOfPricePoints,
      };
      return Promise.resolve({
        itemCodeId,
        tempItemCode: "HAV-LIFE-1.5-RED-90M",
        itemName: "Havells Life Line Plus S3 HRFR 1.5 sq mm Wire Red 90m",
        price: "2850.00",
        fixedPoints: input.fixedPoints ?? undefined,
        percentOfPricePoints: input.percentOfPricePoints?.toString(),
        rewardRuleType: input.percentOfPricePoints ? "PERCENT_OF_PRICE" : "FIXED",
        ruleSummary: "Updated",
        status: "IN_USE",
        statusLabel: "In Use",
        busyActive: true,
        sourcePriceField: "Price",
        updatedAt: new Date("2026-07-15T00:00:00.000Z"),
      });
    },
  } as unknown as ItemCodesService);

  await controller.updateRewardRule(
    { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
    "item_code_1",
    {
      percentOfPricePoints: 1,
      actorRole: ACTOR_ROLE.STAFF,
      now: "2026-07-15T00:00:00.000Z",
    } as never,
  );

  assert.equal(command?.itemCodeId, "item_code_1");
  assert.equal(command?.actor.role, ACTOR_ROLE.OWNER);
  assert.equal(command?.actor.userId, "owner_user_1");
  assert.equal(command?.percentOfPricePoints, 1);
});

test("AdminWebInvoicesController returns persisted invoice detail by id", async () => {
  let requestedInvoiceId = "";
  const controller = new AdminWebInvoicesController({
    listInvoices: () => Promise.resolve([]),
    getInvoiceDetail: (invoiceId: string) => {
      requestedInvoiceId = invoiceId;
      return Promise.resolve({
        invoiceId,
        externalInvoiceId: "busy-inv-2026-1001",
        invoiceNumber: "VR/26-27/1001",
        invoiceDate: new Date("2026-06-22T00:00:00.000Z"),
        customerName: "Sharma Electrical Contractors",
        gstTotal: "5814.00",
        finalTotal: "38114.00",
        lineCount: 1,
        qrUnitCount: 1,
        printedUnitCount: 0,
        notPrintedUnitCount: 1,
        printableUnitCount: 1,
        scannedUnitCount: 0,
        cancelledUnitCount: 0,
        reversedUnitCount: 0,
        returnedUnitCount: 0,
        returnVoucherCount: 0,
        reviewNeededCount: 0,
        productSummary: "Cable",
        categorySummary: "Electrical",
        status: "IMPORTED",
        customer: {
          name: "Sharma Electrical Contractors",
          state: "Maharashtra",
        },
        lines: [],
        returnHistory: [],
        printHistory: [],
      });
    },
  } as unknown as AdminWebInvoiceReadService);

  const detail = await controller.getInvoiceDetail("invoice_1");

  assert.equal(requestedInvoiceId, "invoice_1");
  assert.equal(detail.invoiceNumber, "VR/26-27/1001");
});

test("AdminWebDashboardController scopes dashboard by current actor role", async () => {
  let actor: AuthenticatedActor | undefined;
  const controller = new AdminWebDashboardController({
    getDashboard: (inputActor: AuthenticatedActor) => {
      actor = inputActor;
      return Promise.resolve({
        actorRole: inputActor.role,
        actorLabel: `${inputActor.role} - ${inputActor.userId}`,
        roleLabel: "Owner dashboard",
        allowedSections: ["dashboard"],
        metrics: {
          contractors: 0,
          staff: 0,
          invoices: 0,
          qrTotal: 0,
          qrNotPrinted: 0,
          qrPrinted: 0,
          qrScanned: 0,
          qrCancelled: 0,
          qrReversed: 0,
          rewardClaims: 0,
          invoicesReadyToPrint: 0,
          pendingRewardClaims: 0,
          recentReturns: 0,
        },
        attentionQueue: [],
        shortcuts: [],
        qrStatusMix: [],
        printTrend: [],
        topContractors: [],
        recentActivity: [],
      });
    },
  } as unknown as AdminWebDashboardService);

  await controller.getDashboard({ role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });

  assert.deepEqual(actor, { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });
});

test("AdminWebContractorsController passes actor context to contractor registration", async () => {
  let actor: { readonly role: string; readonly userId?: string } | undefined;
  const controller = new AdminWebContractorsController({
    listContractors: () => Promise.resolve([]),
    getContractorDetail: () => Promise.resolve({
      contractorId: "contractor_1",
      userId: "user_1",
      contractorCode: "CTR-000001",
      name: "Ramesh Electricals",
      mobileNumber: "9876543210",
      status: "ACTIVE",
      totalAccumulatedPoints: 0,
      availablePoints: 0,
      siteCount: 0,
      scanCount: 0,
      successfulScanCount: 0,
      scannedBusinessInr: "0.00",
      rewardClaimCount: 0,
      fulfilledRewardCount: 0,
      fulfilledRewardValueInr: 0,
      createdAt: new Date("2026-06-22T00:00:00.000Z"),
      sites: [],
    }),
    registerContractor: (_body: AdminContractorWriteInput, inputActor: { readonly role: string; readonly userId?: string }) => {
      actor = inputActor;
      return Promise.resolve({
        contractorId: "contractor_1",
        userId: "user_1",
        contractorCode: "CTR-000001",
        name: "Ramesh Electricals",
        mobileNumber: "9876543210",
        status: "ACTIVE",
        totalAccumulatedPoints: 0,
        availablePoints: 0,
        siteCount: 0,
        scanCount: 0,
        successfulScanCount: 0,
        scannedBusinessInr: "0.00",
        rewardClaimCount: 0,
        fulfilledRewardCount: 0,
        fulfilledRewardValueInr: 0,
        createdAt: new Date("2026-06-22T00:00:00.000Z"),
        sites: [],
      });
    },
    updateContractor: () => Promise.reject(new Error("not used")),
    deactivateContractor: () => Promise.reject(new Error("not used")),
  } as unknown as AdminContractorService);

  await controller.registerContractor(
    { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
    { name: "Ramesh Electricals", mobileNumber: "9876543210" },
  );

  assert.deepEqual(actor, { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });
});

test("AdminMobileContractorsController exposes owner actions with guarded actor context", async () => {
  const calls: {
    registerActor?: AuthenticatedActor;
    reactivateActor?: AuthenticatedActor;
    resetActor?: AuthenticatedActor;
  } = {};
  const contractor = {
    contractorId: "contractor_1",
    userId: "user_1",
    contractorCode: "CTR-000001",
    name: "Ramesh Electricals",
    mobileNumber: "9876543210",
    status: "ACTIVE",
    totalAccumulatedPoints: 0,
    availablePoints: 0,
    siteCount: 0,
    scanCount: 0,
    successfulScanCount: 0,
    scannedBusinessInr: "0.00",
    rewardClaimCount: 0,
    fulfilledRewardCount: 0,
    fulfilledRewardValueInr: 0,
    createdAt: new Date("2026-06-22T00:00:00.000Z"),
    sites: [],
  };
  const controller = new AdminMobileContractorsController(
    {
      listContractors: () => Promise.resolve([]),
      getContractorDetail: () => Promise.resolve(contractor),
      registerContractor: (_body: AdminContractorWriteInput, actor: AuthenticatedActor) => {
        calls.registerActor = actor;
        return Promise.resolve(contractor);
      },
      updateContractor: () => Promise.resolve(contractor),
      deactivateContractor: () => Promise.resolve(contractor),
      reactivateContractor: (_contractorId: string, actor: AuthenticatedActor) => {
        calls.reactivateActor = actor;
        return Promise.resolve(contractor);
      },
    } as unknown as AdminContractorService,
    {
      resetContractorMpin: (_contractorId: string, actor: AuthenticatedActor, resetAt: Date) => {
        calls.resetActor = actor;
        return Promise.resolve({
          contractor,
          temporaryMpin: "2468",
          expiresAt: resetAt,
          delivery: {
            channel: "MOCK_SMS",
            status: "MOCK_RETURNED_TO_OWNER_ONCE",
          },
        });
      },
    } as unknown as MobileAuthService,
  );
  const actor = { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" };

  await controller.registerContractor(actor, { name: "Ramesh Electricals", mobileNumber: "9876543210" });
  await controller.reactivateContractor(actor, "contractor_1");
  await controller.resetContractorMpin(actor, "contractor_1", undefined as never);

  assert.deepEqual(calls.registerActor, actor);
  assert.deepEqual(calls.reactivateActor, actor);
  assert.deepEqual(calls.resetActor, actor);
});

test("AdminMobileStaffController passes guarded actor context to staff mutations", async () => {
  const calls: {
    createActor?: AuthenticatedActor;
    photoActor?: AuthenticatedActor;
    resetActor?: AuthenticatedActor;
  } = {};
  const staff = {
    staffId: "staff_1",
    userId: "staff_user_1",
    role: "STAFF",
    name: "Aarti Deshmukh",
    mobileNumber: "9000000092",
    status: "ACTIVE",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
  };
  const controller = new AdminMobileStaffController({
    listStaff: () => Promise.resolve([staff]),
    getStaff: () => Promise.resolve(staff),
    getMyStaff: () => Promise.resolve(staff),
    createStaff: (_body: AdminStaffWriteInput, actor: AuthenticatedActor) => {
      calls.createActor = actor;
      return Promise.resolve({ staff, temporaryPin: "2468" });
    },
    updateStaffPhoto: (_staffId: string, _body: { readonly photoUrl: string | null }, actor: AuthenticatedActor) => {
      calls.photoActor = actor;
      return Promise.resolve(staff);
    },
    resetStaffPin: (_staffId: string, actor: AuthenticatedActor) => {
      calls.resetActor = actor;
      return Promise.resolve({ staff, temporaryPin: "1357" });
    },
    deactivateStaff: () => Promise.resolve(staff),
    reactivateStaff: () => Promise.resolve(staff),
  } as unknown as AdminStaffService);
  const actor = { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" };

  await controller.createStaff(actor, { name: "Aarti Deshmukh", mobileNumber: "9000000092" });
  await controller.updateStaffPhoto(actor, "staff_1", { photoUrl: "data:image/jpeg;base64,staff" });
  await controller.resetStaffPin(actor, "staff_1");

  assert.deepEqual(calls.createActor, actor);
  assert.deepEqual(calls.photoActor, actor);
  assert.deepEqual(calls.resetActor, actor);
});

test("AdminMobileReportsController uses guarded actor context for landing and report preview", async () => {
  const calls: {
    landingActor?: AuthenticatedActor;
    reportActor?: AuthenticatedActor;
    reportId?: string;
  } = {};
  const controller = new AdminMobileReportsController({
    getLanding: (actor: AuthenticatedActor) => {
      calls.landingActor = actor;
      return Promise.resolve({
        resolvedRange: {
          label: "This month",
          from: new Date("2026-07-01T00:00:00.000Z"),
          to: new Date("2026-07-31T23:59:59.999Z"),
          timezone: "Asia/Kolkata",
        },
        cards: [],
        reportShortcuts: [],
        charts: [],
        generatedAt: new Date("2026-07-12T00:00:00.000Z"),
      });
    },
    getReport: (actor: AuthenticatedActor, reportId: string) => {
      calls.reportActor = actor;
      calls.reportId = reportId;
      return Promise.resolve({
        reportId: "qr-status",
        title: "QR status",
        resolvedRange: {
          label: "This month",
          from: new Date("2026-07-01T00:00:00.000Z"),
          to: new Date("2026-07-31T23:59:59.999Z"),
          timezone: "Asia/Kolkata",
        },
        summary: [],
        columns: [],
        rows: [],
        totalRows: 0,
        page: 1,
        pageSize: 6,
      });
    },
  } as unknown as ReportsService);
  const actor = { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" };

  await controller.getLanding(actor, {});
  await controller.getReport(actor, "qr-status", {});

  assert.deepEqual(calls.landingActor, actor);
  assert.deepEqual(calls.reportActor, actor);
  assert.equal(calls.reportId, "qr-status");
});

test("RewardsController redeems using guarded Contractor actor context", async () => {
  let actor: AuthenticatedActor | undefined;
  let rewardId = "";
  const controller = new RewardsController({
    redeemReward: (inputActor: AuthenticatedActor, inputRewardId: string) => {
      actor = inputActor;
      rewardId = inputRewardId;
      return Promise.resolve({
        claim: {
          rewardClaimId: "reward_claim_1",
          claimId: "CLM-123456",
          contractorId: inputActor.contractorId ?? "",
          rewardId: inputRewardId,
          rewardName: "Premium Toolbox",
          status: "CHOSEN",
          pointsDeducted: 500,
          chosenAt: new Date("2026-07-02T10:00:00.000Z"),
        },
        balance: {
          currentTier: "Silver",
          totalAccumulatedPoints: 900,
          pointsAvailable: 400,
        },
        ledgerEntry: {
          ledgerEntryId: "ledger_1",
          type: "REWARD_REDEEM",
          pointsDelta: -500,
          balanceAfter: 400,
          sourceType: "REWARD_CLAIM",
          sourceId: "reward_claim_1",
          createdAt: new Date("2026-07-02T10:00:00.000Z"),
          negativeBalance: false,
        },
      });
    },
  } as unknown as RewardsService);

  await controller.redeemReward(
    { role: ACTOR_ROLE.CONTRACTOR, contractorId: "contractor_from_actor" },
    "reward-toolbox-basic",
  );

  assert.deepEqual(actor, { role: ACTOR_ROLE.CONTRACTOR, contractorId: "contractor_from_actor" });
  assert.equal(rewardId, "reward-toolbox-basic");
});

test("AdminWebRewardsController fulfills using OWNER actor context and OTP body", async () => {
  let actor: AuthenticatedActor | undefined;
  let claimId = "";
  let body: { readonly challengeId?: string; readonly otp?: string } | undefined;
  const controller = new AdminWebRewardsController({
    fulfillClaim: (
      inputActor: AuthenticatedActor,
      inputClaimId: string,
      inputBody: { readonly challengeId?: string; readonly otp?: string },
    ) => {
      actor = inputActor;
      claimId = inputClaimId;
      body = inputBody;
      return Promise.resolve({
        claim: {
          rewardClaimId: "reward_claim_1",
          claimId: inputClaimId,
          contractorId: "contractor_1",
          rewardId: "reward-toolbox-basic",
          rewardName: "Premium Toolbox",
          status: "FULFILLED",
          pointsDeducted: 500,
          chosenAt: new Date("2026-07-02T10:00:00.000Z"),
          fulfilledAt: new Date("2026-07-02T10:05:00.000Z"),
        },
        contractor: {
          contractorId: "contractor_1",
          contractorCode: "CON-0001",
          name: "Demo Contractor",
          mobileNumber: "9000001001",
          currentTier: "Silver",
          totalAccumulatedPoints: 900,
          pointsAvailable: 400,
        },
        canSendOtp: false,
        canFulfill: false,
      });
    },
  } as unknown as RewardsService);

  await controller.fulfillClaim(
    { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
    "CLM-123456",
    { challengeId: "otp_1", otp: "654321" },
  );

  assert.deepEqual(actor, { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });
  assert.equal(claimId, "CLM-123456");
  assert.deepEqual(body, { challengeId: "otp_1", otp: "654321" });
});

test("AdminWebRewardsController lists reward claims using OWNER actor context", async () => {
  let actor: AuthenticatedActor | undefined;
  const controller = new AdminWebRewardsController({
    listAdminClaims: (inputActor: AuthenticatedActor) => {
      actor = inputActor;
      return Promise.resolve([
        {
          claim: {
            rewardClaimId: "reward_claim_1",
            claimId: "CLM-123456",
            contractorId: "contractor_1",
            rewardId: "reward-toolbox-basic",
            rewardName: "Premium Toolbox",
            status: "CHOSEN",
            pointsDeducted: 500,
            chosenAt: new Date("2026-07-02T10:00:00.000Z"),
          },
          contractor: {
            contractorId: "contractor_1",
            contractorCode: "CON-0001",
            name: "Ramesh Shinde",
            mobileNumber: "9000001001",
            currentTier: "Silver",
            totalAccumulatedPoints: 900,
            pointsAvailable: 400,
          },
          canSendOtp: true,
          canFulfill: true,
        },
      ]);
    },
  } as unknown as RewardsService);

  const result = await controller.listClaims({ role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });

  assert.deepEqual(actor, { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });
  assert.equal(result[0]?.claim.claimId, "CLM-123456");
});

test("AdminWebRewardsController lists reward history using STAFF actor context", async () => {
  let actor: AuthenticatedActor | undefined;
  const controller = new AdminWebRewardsController({
    listAdminClaimHistory: (inputActor: AuthenticatedActor) => {
      actor = inputActor;
      return Promise.resolve([
        {
          claim: {
            rewardClaimId: "reward_claim_1",
            claimId: "CLM-123456",
            contractorId: "contractor_1",
            rewardId: "reward-toolbox-basic",
            rewardName: "Premium Toolbox",
            status: "FULFILLED",
            pointsDeducted: 500,
            chosenAt: new Date("2026-07-02T10:00:00.000Z"),
            fulfilledAt: new Date("2026-07-02T10:05:00.000Z"),
          },
          contractor: {
            contractorId: "contractor_1",
            contractorCode: "CON-0001",
            name: "Ramesh Shinde",
            mobileNumber: "9000001001",
            currentTier: "Silver",
            totalAccumulatedPoints: 900,
            pointsAvailable: 400,
          },
          canSendOtp: false,
          canFulfill: false,
        },
      ]);
    },
  } as unknown as RewardsService);

  const result = await controller.listClaimHistory({ role: ACTOR_ROLE.STAFF, userId: "staff_user_1" });

  assert.deepEqual(actor, { role: ACTOR_ROLE.STAFF, userId: "staff_user_1" });
  assert.equal(result[0]?.claim.status, "FULFILLED");
});

test("AdminMobileRewardsController lists active claims using OWNER actor context", async () => {
  let actor: AuthenticatedActor | undefined;
  const controller = new AdminMobileRewardsController({
    listAdminClaims: (inputActor: AuthenticatedActor) => {
      actor = inputActor;
      return Promise.resolve([
        {
          claim: {
            rewardClaimId: "reward_claim_1",
            claimId: "CLM-ACTIVE01",
            contractorId: "contractor_1",
            rewardId: "reward-toolbox-basic",
            rewardName: "Premium Toolbox",
            status: "CHOSEN",
            pointsDeducted: 500,
            chosenAt: new Date("2026-07-02T10:00:00.000Z"),
          },
          contractor: {
            contractorId: "contractor_1",
            contractorCode: "CON-0001",
            name: "Mahesh Patil",
            mobileNumber: "9000001002",
            currentTier: "Silver",
            totalAccumulatedPoints: 900,
            pointsAvailable: 400,
          },
          canSendOtp: true,
          canFulfill: true,
        },
      ]);
    },
  } as unknown as RewardsService);

  const result = await controller.listClaims({ role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });

  assert.deepEqual(actor, { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });
  assert.equal(result[0]?.claim.claimId, "CLM-ACTIVE01");
});

test("AdminMobileRewardsController lists reward history using STAFF actor context", async () => {
  let actor: AuthenticatedActor | undefined;
  const controller = new AdminMobileRewardsController({
    listAdminClaimHistory: (inputActor: AuthenticatedActor) => {
      actor = inputActor;
      return Promise.resolve([
        {
          claim: {
            rewardClaimId: "reward_claim_1",
            claimId: "CLM-ACTIVE01",
            contractorId: "contractor_1",
            rewardId: "reward-toolbox-basic",
            rewardName: "Premium Toolbox",
            status: "FULFILLED",
            pointsDeducted: 500,
            chosenAt: new Date("2026-07-02T10:00:00.000Z"),
            fulfilledAt: new Date("2026-07-02T10:05:00.000Z"),
          },
          contractor: {
            contractorId: "contractor_1",
            contractorCode: "CON-0001",
            name: "Mahesh Patil",
            mobileNumber: "9000001002",
            currentTier: "Silver",
            totalAccumulatedPoints: 900,
            pointsAvailable: 400,
          },
          canSendOtp: false,
          canFulfill: false,
        },
      ]);
    },
  } as unknown as RewardsService);

  const result = await controller.listClaimHistory({ role: ACTOR_ROLE.STAFF, userId: "staff_user_1" });

  assert.deepEqual(actor, { role: ACTOR_ROLE.STAFF, userId: "staff_user_1" });
  assert.equal(result[0]?.claim.status, "FULFILLED");
});

test("AdminMobileRewardsController sends reward OTP with Admin Mobile audit surface", async () => {
  let actor: AuthenticatedActor | undefined;
  let claimId = "";
  let surface = "";
  const controller = new AdminMobileRewardsController({
    sendFulfillmentOtp: (
      inputActor: AuthenticatedActor,
      inputClaimId: string,
      _now: Date,
      inputSurface: string,
    ) => {
      actor = inputActor;
      claimId = inputClaimId;
      surface = inputSurface;
      return Promise.resolve({
        challengeId: "otp_1",
        claimId: inputClaimId,
        expiresAt: new Date("2026-07-02T10:05:00.000Z"),
        delivery: {
          channel: "MOCK_SMS_TO_CONTRACTOR",
          status: "MOCK_RETURNED_FOR_LOCAL_DEV",
          mockOtp: "654321",
        },
      });
    },
  } as unknown as RewardsService);

  const result = await controller.sendOtp({ role: ACTOR_ROLE.OWNER, userId: "owner_user_1" }, "CLM-ACTIVE01");

  assert.deepEqual(actor, { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });
  assert.equal(claimId, "CLM-ACTIVE01");
  assert.equal(surface, "ADMIN_MOBILE");
  assert.equal(result.delivery.mockOtp, "654321");
});

test("AdminMobileRewardsController fulfills using OWNER actor context and Admin Mobile audit surface", async () => {
  let actor: AuthenticatedActor | undefined;
  let claimId = "";
  let body: { readonly challengeId?: string; readonly otp?: string } | undefined;
  let surface = "";
  const controller = new AdminMobileRewardsController({
    fulfillClaim: (
      inputActor: AuthenticatedActor,
      inputClaimId: string,
      inputBody: { readonly challengeId?: string; readonly otp?: string },
      _now: Date,
      inputSurface: string,
    ) => {
      actor = inputActor;
      claimId = inputClaimId;
      body = inputBody;
      surface = inputSurface;
      return Promise.resolve({
        claim: {
          rewardClaimId: "reward_claim_1",
          claimId: inputClaimId,
          contractorId: "contractor_1",
          rewardId: "reward-toolbox-basic",
          rewardName: "Premium Toolbox",
          status: "FULFILLED",
          pointsDeducted: 500,
          chosenAt: new Date("2026-07-02T10:00:00.000Z"),
          fulfilledAt: new Date("2026-07-02T10:05:00.000Z"),
        },
        contractor: {
          contractorId: "contractor_1",
          contractorCode: "CON-0001",
          name: "Mahesh Patil",
          mobileNumber: "9000001002",
          currentTier: "Silver",
          totalAccumulatedPoints: 900,
          pointsAvailable: 400,
        },
        canSendOtp: false,
        canFulfill: false,
      });
    },
  } as unknown as RewardsService);

  await controller.fulfillClaim(
    { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
    "CLM-ACTIVE01",
    { challengeId: "otp_1", otp: "654321" },
  );

  assert.deepEqual(actor, { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" });
  assert.equal(claimId, "CLM-ACTIVE01");
  assert.deepEqual(body, { challengeId: "otp_1", otp: "654321" });
  assert.equal(surface, "ADMIN_MOBILE");
});
