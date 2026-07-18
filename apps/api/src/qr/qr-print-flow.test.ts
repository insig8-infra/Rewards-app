import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE, DomainError } from "@volt-rewards/domain";
import { BusyImportService } from "../busy/busy-import.service.js";
import { InMemoryPlatformRepository } from "../testing/in-memory-platform.repository.js";
import { QrPrintService } from "./qr-print.service.js";
import { QrScanService } from "./qr-scan.service.js";

test("mock BUSY import -> QR print -> QR scan reserves then cart commit credits points", async () => {
  const repository = new InMemoryPlatformRepository({
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 500,
        totalAccumulatedPoints: 1000,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const busyImport = new BusyImportService(repository);
  const qrPrint = new QrPrintService(repository);
  const qrScan = new QrScanService(repository);

  const imported = await busyImport.importMockInvoice(
    "busy-inv-2026-1001",
    new Date("2026-06-22T00:00:00.000Z"),
  );
  const lineId = repository.getLineId("busy-inv-2026-1001-line-1");

  assert.equal(imported.qrUnitCount, 30);

  const printResult = await qrPrint.printQr({
    invoiceId: imported.invoiceId,
    actorRole: ACTOR_ROLE.OWNER,
    lines: [{ invoiceLineId: lineId, quantity: 2 }],
    printedAt: new Date("2026-06-22T00:00:00.000Z"),
  });

  assert.equal(printResult.printedUnits.length, 2);
  assert.equal(printResult.expiresAt.toISOString(), "2026-08-06T00:00:00.000Z");
  assert.ok(printResult.printedUnits[0]?.tokenValue);

  const scanResult = await qrScan.scanQr({
    tokenValue: printResult.printedUnits[0]?.tokenValue ?? "",
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:00:00.000Z"),
  });

  assert.equal(scanResult.qrId, printResult.printedUnits[0]?.qrUnitId);
  assert.equal(scanResult.qrValuePoints, 100);
  assert.equal(scanResult.pointsCredited, 0);
  assert.equal(scanResult.cart.cartTotalPoints, 100);

  const commitResult = await qrScan.commitScanCart({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:01:00.000Z"),
  });

  assert.equal(commitResult.pointsCredited, 100);
  assert.equal(commitResult.balanceAfter, 600);
});

test("ItemCode percent-of-price rule changes future QR prints while existing printed QR stays frozen", async () => {
  const repository = new InMemoryPlatformRepository({
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 500,
        totalAccumulatedPoints: 1000,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const busyImport = new BusyImportService(repository);
  const qrPrint = new QrPrintService(repository);
  const qrScan = new QrScanService(repository);
  const imported = await busyImport.importMockInvoice(
    "busy-inv-2026-1001",
    new Date("2026-06-22T00:00:00.000Z"),
  );
  const lineId = repository.getLineId("busy-inv-2026-1001-line-1");

  const fixedPrint = await qrPrint.printQr({
    invoiceId: imported.invoiceId,
    actorRole: ACTOR_ROLE.OWNER,
    lines: [{ invoiceLineId: lineId, quantity: 1 }],
    printedAt: new Date("2026-06-22T00:00:00.000Z"),
  });
  assert.equal(fixedPrint.printedUnits[0]?.points, 100);

  repository.setItemCodeRewardRule("HAV-LIFE-1.5-RED-90M", { percentOfPricePoints: 10 });

  const percentPrint = await qrPrint.printQr({
    invoiceId: imported.invoiceId,
    actorRole: ACTOR_ROLE.OWNER,
    lines: [{ invoiceLineId: lineId, quantity: 1 }],
    printedAt: new Date("2026-06-22T00:05:00.000Z"),
  });
  assert.equal(percentPrint.printedUnits[0]?.points, 285);

  await qrScan.scanQr({
    tokenValue: fixedPrint.printedUnits[0]?.tokenValue ?? "",
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:00:00.000Z"),
  });
  const fixedCommit = await qrScan.commitScanCart({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:01:00.000Z"),
  });
  assert.equal(fixedCommit.pointsCredited, 100);

  await qrScan.scanQr({
    tokenValue: percentPrint.printedUnits[0]?.tokenValue ?? "",
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:02:00.000Z"),
  });
  const percentCommit = await qrScan.commitScanCart({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:03:00.000Z"),
  });
  assert.equal(percentCommit.pointsCredited, 285);
  assert.equal(percentCommit.balanceAfter, 885);
});

test("QR reprint invalidates old token and blocks scanned QR reprint", async () => {
  const repository = new InMemoryPlatformRepository({
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 0,
        totalAccumulatedPoints: 0,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const busyImport = new BusyImportService(repository);
  const qrPrint = new QrPrintService(repository);
  const qrScan = new QrScanService(repository);
  const imported = await busyImport.importMockInvoice(
    "busy-inv-2026-1001",
    new Date("2026-06-22T00:00:00.000Z"),
  );
  const lineId = repository.getLineId("busy-inv-2026-1001-line-1");
  const printResult = await qrPrint.printQr({
    invoiceId: imported.invoiceId,
    actorRole: ACTOR_ROLE.STAFF,
    lines: [{ invoiceLineId: lineId, quantity: 2 }],
    printedAt: new Date("2026-06-22T00:00:00.000Z"),
  });
  const reprintableUnit = printResult.printedUnits[0];
  const scannedUnit = printResult.printedUnits[1];
  assert.ok(reprintableUnit);
  assert.ok(scannedUnit);

  const replacement = await qrPrint.reprintQr({
    qrUnitId: reprintableUnit.qrUnitId,
    actorRole: ACTOR_ROLE.OWNER,
    reprintedAt: new Date("2026-06-23T00:00:00.000Z"),
  });

  assert.equal(replacement.qrUnitId, reprintableUnit.qrUnitId);
  assert.notEqual(replacement.tokenValue, reprintableUnit.tokenValue);

  await assert.rejects(
    qrScan.scanQr({
      tokenValue: reprintableUnit.tokenValue,
      actorRole: ACTOR_ROLE.CONTRACTOR,
      contractorId: "contractor_1",
      siteId: "site_1",
      now: new Date("2026-06-23T00:05:00.000Z"),
    }),
    (error) => error instanceof DomainError && error.code === "QR_TOKEN_INVALID",
  );

  const scanResult = await qrScan.scanQr({
    tokenValue: replacement.tokenValue,
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:10:00.000Z"),
  });
  assert.equal(scanResult.qrId, reprintableUnit.qrUnitId);
  await qrScan.commitScanCart({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:11:00.000Z"),
  });

  await qrScan.scanQr({
    tokenValue: scannedUnit.tokenValue,
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:15:00.000Z"),
  });
  await qrScan.commitScanCart({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:16:00.000Z"),
  });

  await assert.rejects(
    qrPrint.reprintQr({
      qrUnitId: scannedUnit.qrUnitId,
      actorRole: ACTOR_ROLE.OWNER,
      reprintedAt: new Date("2026-06-23T00:20:00.000Z"),
    }),
    (error) => error instanceof DomainError && error.code === "QR_REPRINT_INVALID_STATUS",
  );
});

test("QR print blocks quantities beyond non-returned not-printed units", async () => {
  const repository = new InMemoryPlatformRepository();
  const busyImport = new BusyImportService(repository);
  const qrPrint = new QrPrintService(repository);
  const imported = await busyImport.importMockInvoice(
    "busy-inv-2026-1001",
    new Date("2026-06-22T00:00:00.000Z"),
  );
  const importedReturn = await busyImport.importMockReturnVoucher(
    "busy-ret-2026-2001",
    new Date("2026-06-23T00:00:00.000Z"),
  );
  const returnedLineId = repository.getLineId("busy-inv-2026-1001-line-2");

  assert.equal(importedReturn.allocationCount, 1);
  const importedReturnRetry = await busyImport.importMockReturnVoucher(
    "busy-ret-2026-2001",
    new Date("2026-06-23T00:01:00.000Z"),
  );
  assert.equal(importedReturnRetry.allocationCount, 1);

  await assert.rejects(
    qrPrint.printQr({
      invoiceId: imported.invoiceId,
      actorRole: ACTOR_ROLE.STAFF,
      lines: [{ invoiceLineId: returnedLineId, quantity: 4 }],
      printedAt: new Date("2026-06-22T00:00:00.000Z"),
    }),
    (error) => error instanceof DomainError && error.code === "QR_PRINT_QUANTITY_EXCEEDS_AVAILABLE",
  );

  const allowedPrint = await qrPrint.printQr({
    invoiceId: imported.invoiceId,
    actorRole: ACTOR_ROLE.STAFF,
    lines: [{ invoiceLineId: returnedLineId, quantity: 3 }],
    printedAt: new Date("2026-06-22T00:00:00.000Z"),
  });
  assert.equal(allowedPrint.printedUnits.length, 3);
});

test("BUSY return allocation pools duplicate same-item invoice lines when original line reference is missing", async () => {
  const repository = new InMemoryPlatformRepository();
  const busyImport = new BusyImportService(repository);
  const qrPrint = new QrPrintService(repository);
  const imported = await busyImport.importMockInvoice(
    "busy-inv-2026-1004",
    new Date("2026-06-23T00:00:00.000Z"),
  );
  const firstWireLineId = repository.getLineId("busy-inv-2026-1004-line-1");
  const secondWireLineId = repository.getLineId("busy-inv-2026-1004-line-2");

  const importedReturn = await busyImport.importMockReturnVoucher(
    "busy-ret-2026-2004",
    new Date("2026-06-26T00:00:00.000Z"),
  );

  assert.equal(importedReturn.allocationCount, 4);
  assert.equal(importedReturn.reviewNeededCount, 0);

  await assert.rejects(
    qrPrint.printQr({
      invoiceId: imported.invoiceId,
      actorRole: ACTOR_ROLE.STAFF,
      lines: [{ invoiceLineId: firstWireLineId, quantity: 1 }],
      printedAt: new Date("2026-06-26T00:00:00.000Z"),
    }),
    (error) => error instanceof DomainError && error.code === "QR_PRINT_QUANTITY_EXCEEDS_AVAILABLE",
  );

  const allowedPrint = await qrPrint.printQr({
    invoiceId: imported.invoiceId,
    actorRole: ACTOR_ROLE.STAFF,
    lines: [{ invoiceLineId: secondWireLineId, quantity: 1 }],
    printedAt: new Date("2026-06-26T00:00:00.000Z"),
  });
  assert.equal(allowedPrint.printedUnits.length, 1);
});

test("BUSY return import creates review-needed allocations when all matching QR are scanned", async () => {
  const repository = new InMemoryPlatformRepository({
    contractors: [
      {
        contractorId: "contractor_1",
        availablePoints: 500,
        totalAccumulatedPoints: 1000,
      },
    ],
    sites: [{ id: "site_1", contractorId: "contractor_1" }],
  });
  const busyImport = new BusyImportService(repository);
  const qrPrint = new QrPrintService(repository);
  const qrScan = new QrScanService(repository);
  const imported = await busyImport.importMockInvoice(
    "busy-inv-2026-1003",
    new Date("2026-06-22T00:00:00.000Z"),
  );
  const fanLineId = repository.getLineId("busy-inv-2026-1003-line-2");
  const printResult = await qrPrint.printQr({
    invoiceId: imported.invoiceId,
    actorRole: ACTOR_ROLE.OWNER,
    lines: [{ invoiceLineId: fanLineId, quantity: 3 }],
    printedAt: new Date("2026-06-22T00:00:00.000Z"),
  });

  for (const [index, unit] of printResult.printedUnits.entries()) {
    const tokenValue = unit.tokenValue;
    await qrScan.scanQr({
      tokenValue,
      actorRole: ACTOR_ROLE.CONTRACTOR,
      contractorId: "contractor_1",
      siteId: "site_1",
      now: new Date("2026-06-23T00:00:00.000Z"),
    });
    if (index === 1) {
      await qrScan.commitScanCart({
        actorRole: ACTOR_ROLE.CONTRACTOR,
        contractorId: "contractor_1",
        siteId: "site_1",
        now: new Date("2026-06-23T00:00:30.000Z"),
      });
    }
  }
  await qrScan.commitScanCart({
    actorRole: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
    siteId: "site_1",
    now: new Date("2026-06-23T00:01:00.000Z"),
  });

  const importedReturn = await busyImport.importMockReturnVoucher(
    "busy-ret-2026-2003",
    new Date("2026-06-24T00:00:00.000Z"),
  );

  assert.equal(importedReturn.allocationCount, 3);
  assert.equal(importedReturn.reviewNeededCount, 3);
});

test("QR print blocks Contractor actors", async () => {
  const repository = new InMemoryPlatformRepository();
  const busyImport = new BusyImportService(repository);
  const qrPrint = new QrPrintService(repository);
  const imported = await busyImport.importMockInvoice(
    "busy-inv-2026-1001",
    new Date("2026-06-22T00:00:00.000Z"),
  );
  const lineId = repository.getLineId("busy-inv-2026-1001-line-1");

  await assert.rejects(
    qrPrint.printQr({
      invoiceId: imported.invoiceId,
      actorRole: ACTOR_ROLE.CONTRACTOR,
      lines: [{ invoiceLineId: lineId, quantity: 1 }],
      printedAt: new Date("2026-06-22T00:00:00.000Z"),
    }),
    (error) => error instanceof DomainError && error.code === "QR_PRINT_FORBIDDEN_ACTOR",
  );
});
