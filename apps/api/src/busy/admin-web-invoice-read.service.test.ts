import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundException } from "@nestjs/common";
import { AdminWebInvoiceReadService } from "./admin-web-invoice-read.service.js";
import type { AdminWebInvoiceReadRepository } from "./admin-web-invoice-read.repository.js";

test("AdminWebInvoiceReadService throws NotFoundException for missing invoice detail", async () => {
  const service = new AdminWebInvoiceReadService({
    listInvoices: () => Promise.resolve([]),
    getInvoiceDetail: () => Promise.resolve(null),
  } as AdminWebInvoiceReadRepository);

  await assert.rejects(
    service.getInvoiceDetail("missing_invoice"),
    (error) => error instanceof NotFoundException,
  );
});
