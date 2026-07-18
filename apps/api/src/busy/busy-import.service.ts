import { Inject, Injectable } from "@nestjs/common";
import { DomainError } from "@volt-rewards/domain";
import {
  BUSY_IMPORT_REPOSITORY,
  type BusyImportRepository,
  type ImportedBusyInvoice,
  type ImportedBusyReturnVoucher,
} from "./busy-import.repository.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { mapBusyVoucherPayload } from "./busy-payload-adapter.js";
import {
  MOCK_BUSY_INVOICES,
  MOCK_BUSY_RETURN_VOUCHERS,
  getMockBusyInvoice,
  getMockBusyReturnVoucher,
} from "./mock-busy-invoices.js";

export interface BusySyncStatus {
  readonly latestSyncAt: string | null;
  readonly sourceInvoiceCount: number;
}

export interface BusyMockSyncResult extends BusySyncStatus {
  readonly latestSyncAt: string;
  readonly syncedInvoiceCount: number;
  readonly importedInvoices: readonly ImportedBusyInvoice[];
}

export type BusyPayloadImportResult =
  | { readonly kind: "sale"; readonly importedInvoice: ImportedBusyInvoice }
  | { readonly kind: "return"; readonly importedReturnVoucher: ImportedBusyReturnVoucher }
  | { readonly kind: "ignored"; readonly voucherType: string; readonly reason: string };

@Injectable()
export class BusyImportService {
  constructor(
    @Inject(BUSY_IMPORT_REPOSITORY)
    private readonly repository: BusyImportRepository,
  ) {}

  listMockInvoices(): readonly {
    readonly externalInvoiceId: string;
    readonly invoiceNumber: string;
    readonly invoiceDate: string;
    readonly customerName: string;
    readonly gstTotal: string;
    readonly finalTotal: string;
    readonly lineCount: number;
  }[] {
    return MOCK_BUSY_INVOICES.map((invoice) => ({
      externalInvoiceId: invoice.externalInvoiceId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      customerName: invoice.customer.name,
      gstTotal: invoice.gstTotal,
      finalTotal: invoice.finalTotal,
      lineCount: invoice.lines.length,
    }));
  }

  listMockReturnVouchers(): readonly {
    readonly externalReturnId: string;
    readonly returnNumber: string;
    readonly returnDate: string;
    readonly originalExternalInvoiceId: string;
    readonly customerName: string;
    readonly lineCount: number;
  }[] {
    return MOCK_BUSY_RETURN_VOUCHERS.map((returnVoucher) => ({
      externalReturnId: returnVoucher.externalReturnId,
      returnNumber: returnVoucher.returnNumber,
      returnDate: returnVoucher.returnDate.toISOString(),
      originalExternalInvoiceId: returnVoucher.originalExternalInvoiceId,
      customerName: returnVoucher.customerRef ?? "Customer",
      lineCount: returnVoucher.lines.length,
    }));
  }

  async getSyncStatus(): Promise<BusySyncStatus> {
    const latestSyncAt = await this.repository.getLatestInvoiceSyncAt();
    return {
      latestSyncAt: latestSyncAt ? latestSyncAt.toISOString() : null,
      sourceInvoiceCount: MOCK_BUSY_INVOICES.length,
    };
  }

  async syncMockInvoices(syncedAt: Date, actor?: AuthenticatedActor): Promise<BusyMockSyncResult> {
    const importedInvoices: ImportedBusyInvoice[] = [];

    for (const invoice of MOCK_BUSY_INVOICES) {
      importedInvoices.push(await this.repository.upsertInvoiceWithQrPlaceholders(invoice, syncedAt, actor));
    }

    return {
      latestSyncAt: syncedAt.toISOString(),
      sourceInvoiceCount: MOCK_BUSY_INVOICES.length,
      syncedInvoiceCount: importedInvoices.length,
      importedInvoices,
    };
  }

  async importMockInvoice(
    externalInvoiceId: string,
    importedAt: Date,
    actor?: AuthenticatedActor,
  ): Promise<ImportedBusyInvoice> {
    const invoice = getMockBusyInvoice(externalInvoiceId);
    if (!invoice) {
      throw new DomainError("BUSY_MOCK_INVOICE_NOT_FOUND", "Mock BUSY invoice was not found.");
    }

    return this.repository.upsertInvoiceWithQrPlaceholders(invoice, importedAt, actor);
  }

  async importMockReturnVoucher(
    externalReturnId: string,
    importedAt: Date,
    actor?: AuthenticatedActor,
  ) {
    const returnVoucher = getMockBusyReturnVoucher(externalReturnId);
    if (!returnVoucher) {
      throw new DomainError("BUSY_MOCK_RETURN_NOT_FOUND", "Mock BUSY return voucher was not found.");
    }

    return this.repository.upsertReturnVoucherWithAllocations(returnVoucher, importedAt, actor);
  }

  async importBusyVoucherPayload(
    payload: unknown,
    importedAt: Date,
    actor?: AuthenticatedActor,
  ): Promise<BusyPayloadImportResult> {
    const mapped = mapBusyVoucherPayload(payload);
    if (mapped.kind === "sale") {
      return {
        kind: "sale",
        importedInvoice: await this.repository.upsertInvoiceWithQrPlaceholders(mapped.invoice, importedAt, actor),
      };
    }
    if (mapped.kind === "return") {
      return {
        kind: "return",
        importedReturnVoucher: await this.repository.upsertReturnVoucherWithAllocations(mapped.returnVoucher, importedAt, actor),
      };
    }
    return mapped;
  }
}
