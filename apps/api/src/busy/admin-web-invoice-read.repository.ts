import type { ActorRole } from "@volt-rewards/domain";

export const ADMIN_WEB_INVOICE_READ_REPOSITORY = Symbol("ADMIN_WEB_INVOICE_READ_REPOSITORY");

export interface AdminWebInvoiceCustomer {
  readonly name: string;
  readonly state?: string;
}

export interface AdminWebInvoiceSummary {
  readonly invoiceId: string;
  readonly externalInvoiceId: string;
  readonly invoiceNumber: string;
  readonly invoiceDate: Date;
  readonly importedAt: Date;
  readonly customerName: string;
  readonly gstTotal: string;
  readonly finalTotal: string;
  readonly lineCount: number;
  readonly qrUnitCount: number;
  readonly printableUnitCount: number;
  readonly printedUnitCount: number;
  readonly notPrintedUnitCount: number;
  readonly scannedUnitCount: number;
  readonly cancelledUnitCount: number;
  readonly reversedUnitCount: number;
  readonly returnedUnitCount: number;
  readonly returnVoucherCount: number;
  readonly reviewNeededCount: number;
  readonly productSummary: string;
  readonly categorySummary: string;
  readonly status: string;
}

export interface AdminWebInvoiceLine {
  readonly invoiceLineId: string;
  readonly externalLineId: string;
  readonly sourceLineNo: string;
  readonly sku: string;
  readonly productName: string;
  readonly category?: string;
  readonly unit: string;
  readonly quantity: number;
  readonly returnedQty: number;
  readonly notPrintedQuantity: number;
  readonly printedQuantity: number;
  readonly scannedQuantity: number;
  readonly cancelledQuantity: number;
  readonly reversedQuantity: number;
  readonly printableQuantity: number;
  readonly pointsPerUnit: number;
  readonly unitRate: string;
  readonly lineTotal: string;
  readonly qrUnits: readonly AdminWebInvoiceQrUnit[];
}

export interface AdminWebInvoiceQrUnit {
  readonly qrUnitId: string;
  readonly unitIndex: number;
  readonly status: string;
  readonly points: number;
  readonly printedAt?: Date;
  readonly scannedAt?: Date;
  readonly expiresAt?: Date;
}

export interface AdminWebInvoiceReturnLine {
  readonly returnLineId: string;
  readonly externalReturnLineId: string;
  readonly sku: string;
  readonly productName: string;
  readonly unit: string;
  readonly quantity: number;
  readonly allocationCount: number;
  readonly reviewNeededCount: number;
}

export interface AdminWebInvoiceReturnHistory {
  readonly returnVoucherId: string;
  readonly externalReturnId: string;
  readonly returnNumber: string;
  readonly returnDate: Date;
  readonly status: string;
  readonly lines: readonly AdminWebInvoiceReturnLine[];
}

export interface AdminWebInvoicePrintHistory {
  readonly auditEventId: string;
  readonly printedAt: Date;
  readonly actorRole: ActorRole;
  readonly actorUserId?: string;
  readonly actorName?: string;
  readonly printedUnitCount: number;
  readonly lineCount: number;
}

export interface AdminWebInvoiceDetail extends AdminWebInvoiceSummary {
  readonly customer: AdminWebInvoiceCustomer;
  readonly lines: readonly AdminWebInvoiceLine[];
  readonly returnHistory: readonly AdminWebInvoiceReturnHistory[];
  readonly printHistory: readonly AdminWebInvoicePrintHistory[];
}

export interface AdminWebInvoiceReadRepository {
  listInvoices(): Promise<readonly AdminWebInvoiceSummary[]>;
  getInvoiceDetail(invoiceId: string): Promise<AdminWebInvoiceDetail | null>;
}
