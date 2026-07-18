import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  ADMIN_WEB_INVOICE_READ_REPOSITORY,
  type AdminWebInvoiceDetail,
  type AdminWebInvoiceReadRepository,
  type AdminWebInvoiceSummary,
} from "./admin-web-invoice-read.repository.js";

@Injectable()
export class AdminWebInvoiceReadService {
  constructor(
    @Inject(ADMIN_WEB_INVOICE_READ_REPOSITORY)
    private readonly repository: AdminWebInvoiceReadRepository,
  ) {}

  listInvoices(): Promise<readonly AdminWebInvoiceSummary[]> {
    return this.repository.listInvoices();
  }

  async getInvoiceDetail(invoiceId: string): Promise<AdminWebInvoiceDetail> {
    const invoice = await this.repository.getInvoiceDetail(invoiceId);
    if (!invoice) {
      throw new NotFoundException("Invoice was not found.");
    }
    return invoice;
  }
}
