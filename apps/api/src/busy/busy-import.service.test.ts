import assert from "node:assert/strict";
import test from "node:test";
import { BusyImportService } from "./busy-import.service.js";
import type { BusyImportRepository } from "./busy-import.repository.js";
import { InMemoryPlatformRepository } from "../testing/in-memory-platform.repository.js";

test("mock BUSY invoice summaries expose realistic invoice totals", () => {
  const service = new BusyImportService({} as BusyImportRepository);

  const invoices = service.listMockInvoices();

  assert.ok(invoices.length >= 3);
  assert.equal(invoices[0]?.invoiceNumber, "VR/26-27/1001");
  assert.equal(invoices[0]?.customerName, "Sharma Electrical Contractors");
  assert.equal(invoices[0]?.gstTotal, "5814.00");
  assert.equal(invoices[0]?.finalTotal, "38114.00");
  assert.equal(invoices[0]?.lineCount, 3);
});

test("mock BUSY return voucher summaries are separate from sale invoices", () => {
  const service = new BusyImportService({} as BusyImportRepository);

  const returnVouchers = service.listMockReturnVouchers();

  assert.ok(returnVouchers.length >= 3);
  assert.equal(returnVouchers[0]?.returnNumber, "SR/26-27/2001");
  assert.equal(returnVouchers[0]?.originalExternalInvoiceId, "busy-inv-2026-1001");
  assert.equal(returnVouchers[0]?.lineCount, 1);
});

test("mock BUSY sync imports every source invoice and exposes latest sync time", async () => {
  const repository = new InMemoryPlatformRepository();
  const service = new BusyImportService(repository);

  const result = await service.syncMockInvoices(new Date("2026-07-07T10:30:00.000Z"));
  const status = await service.getSyncStatus();

  assert.ok(result.syncedInvoiceCount >= 3);
  assert.equal(result.sourceInvoiceCount, result.syncedInvoiceCount);
  assert.equal(result.importedInvoices.length, result.syncedInvoiceCount);
  assert.equal(result.latestSyncAt, "2026-07-07T10:30:00.000Z");
  assert.equal(status.latestSyncAt, "2026-07-07T10:30:00.000Z");
});

test("mock BUSY sync updates latest sync time even when invoices already exist", async () => {
  const repository = new InMemoryPlatformRepository();
  const service = new BusyImportService(repository);

  await service.syncMockInvoices(new Date("2026-07-07T10:30:00.000Z"));
  await service.syncMockInvoices(new Date("2026-07-07T11:45:00.000Z"));
  const status = await service.getSyncStatus();

  assert.equal(status.latestSyncAt, "2026-07-07T11:45:00.000Z");
});

test("actual BUSY sale and return payloads import through the repository contract", async () => {
  const repository = new InMemoryPlatformRepository();
  const service = new BusyImportService(repository);

  const saleResult = await service.importBusyVoucherPayload(
    {
      Sale: {
        Date: "07-02-2026",
        VchType: 9,
        VchNo: "12/2025-26",
        BillingDetails: {
          PartyName: "Busy Infotech Pvt. Ltd.",
          tmpVchCode: "25",
          tmpStateName: "Delhi",
        },
        ItemEntries: {
          ItemDetail: {
            SrNo: "1",
            ItemName: "TestItem One",
            UnitName: "Pcs.",
            Qty: "5",
            Price: "100",
            NettAmount: "500",
            tmpItemCode: "40291",
          },
        },
      },
    },
    new Date("2026-02-07T04:30:00.000Z"),
  );

  assert.equal(saleResult.kind, "sale");
  if (saleResult.kind !== "sale") {
    return;
  }
  assert.equal(saleResult.importedInvoice.externalInvoiceId, "25");
  assert.equal(saleResult.importedInvoice.qrUnitCount, 5);

  const returnResult = await service.importBusyVoucherPayload(
    {
      Sale: {
        Date: "08-02-2026",
        VchType: "Return",
        VchNo: "SR/25/1",
        OriginalSaleTmpVchCode: "25",
        BillingDetails: {
          PartyName: "Busy Infotech Pvt. Ltd.",
          tmpVchCode: "30",
        },
        ItemEntries: {
          ItemDetail: {
            SrNo: "1",
            OriginalSrNo: "1",
            ItemName: "TestItem One",
            UnitName: "Pcs.",
            Qty: "2",
            Price: "100",
            tmpItemCode: "40291",
          },
        },
      },
    },
    new Date("2026-02-08T04:30:00.000Z"),
  );

  assert.equal(returnResult.kind, "return");
  if (returnResult.kind !== "return") {
    return;
  }
  assert.equal(returnResult.importedReturnVoucher.externalReturnId, "30");
  assert.equal(returnResult.importedReturnVoucher.originalInvoiceId, saleResult.importedInvoice.invoiceId);
  assert.equal(returnResult.importedReturnVoucher.lineCount, 1);
  assert.equal(returnResult.importedReturnVoucher.allocationCount, 2);
  assert.equal(returnResult.importedReturnVoucher.reviewNeededCount, 0);
});
