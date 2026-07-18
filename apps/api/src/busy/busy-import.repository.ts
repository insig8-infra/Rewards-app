import type { AuthenticatedActor } from "../auth/authenticated-actor.js";

export const BUSY_IMPORT_REPOSITORY = Symbol("BUSY_IMPORT_REPOSITORY");

export interface BusyInvoiceParty {
  readonly name: string;
  readonly gstin?: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly city: string;
  readonly state: string;
  readonly pincode: string;
  readonly phone?: string;
}

export interface BusyInvoiceLineImport {
  readonly externalLineId: string;
  readonly sku: string;
  readonly productName: string;
  readonly brand?: string;
  readonly category?: string;
  readonly hsnCode?: string;
  readonly unit: string;
  readonly quantity: number;
  readonly returnedQty: number;
  readonly unitRate: string;
  readonly taxableValue: string;
  readonly gstRatePercent: string;
  readonly cgstAmount: string;
  readonly sgstAmount: string;
  readonly igstAmount: string;
  readonly lineTotal: string;
  readonly pointsPerUnit: number;
}

export interface BusyReturnVoucherLineImport {
  readonly externalReturnLineId: string;
  readonly originalExternalLineId?: string;
  readonly sku: string;
  readonly productName: string;
  readonly category?: string;
  readonly unit: string;
  readonly quantity: number;
}

export interface BusyInvoiceImport {
  readonly externalInvoiceId: string;
  readonly invoiceNumber: string;
  readonly invoiceDate: Date;
  readonly seller: BusyInvoiceParty;
  readonly customer: BusyInvoiceParty;
  readonly customerRef?: string;
  readonly placeOfSupply: string;
  readonly paymentTerms?: string;
  readonly paymentMode?: string;
  readonly salesPerson?: string;
  readonly taxableSubtotal: string;
  readonly discountTotal: string;
  readonly freightTotal: string;
  readonly cgstTotal: string;
  readonly sgstTotal: string;
  readonly igstTotal: string;
  readonly gstTotal: string;
  readonly totalAmount?: string;
  readonly roundOff: string;
  readonly finalTotal: string;
  readonly amountInWords?: string;
  readonly lines: readonly BusyInvoiceLineImport[];
}

export interface BusyReturnVoucherImport {
  readonly externalReturnId: string;
  readonly returnNumber: string;
  readonly returnDate: Date;
  readonly originalExternalInvoiceId: string;
  readonly voucherType: "SALE_RETURN";
  readonly customerRef?: string;
  readonly lines: readonly BusyReturnVoucherLineImport[];
}

export interface ImportedBusyInvoice {
  readonly invoiceId: string;
  readonly externalInvoiceId: string;
  readonly invoiceNumber: string;
  readonly lineCount: number;
  readonly qrUnitCount: number;
}

export interface ImportedBusyReturnVoucher {
  readonly returnVoucherId: string;
  readonly externalReturnId: string;
  readonly returnNumber: string;
  readonly originalInvoiceId: string;
  readonly lineCount: number;
  readonly allocationCount: number;
  readonly reviewNeededCount: number;
}

export interface BusyImportRepository {
  getLatestInvoiceSyncAt(): Promise<Date | null>;

  upsertInvoiceWithQrPlaceholders(
    invoice: BusyInvoiceImport,
    importedAt: Date,
    actor?: AuthenticatedActor,
  ): Promise<ImportedBusyInvoice>;

  upsertReturnVoucherWithAllocations(
    returnVoucher: BusyReturnVoucherImport,
    importedAt: Date,
    actor?: AuthenticatedActor,
  ): Promise<ImportedBusyReturnVoucher>;
}
