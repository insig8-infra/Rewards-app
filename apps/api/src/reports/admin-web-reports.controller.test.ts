import assert from "node:assert/strict";
import test from "node:test";
import { StreamableFile } from "@nestjs/common";
import { ACTOR_ROLE } from "@volt-rewards/domain";
import type { FastifyReply } from "fastify";
import type { ReportsService } from "./reports.service.js";
import { AdminWebReportsController } from "./admin-web-reports.controller.js";

test("AdminWebReportsController export writes download headers through Fastify reply", async () => {
  const capturedHeaders = new Map<string, string>();
  const reply = {
    header(name: string, value: string) {
      capturedHeaders.set(name.toLowerCase(), value);
      return this;
    },
  } as FastifyReply;
  const service = {
    exportReport: async () => ({
      fileName: "qr-status-2026-07-08.xlsx",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from("xlsx-bytes"),
    }),
  } as unknown as ReportsService;
  const controller = new AdminWebReportsController(service);

  const result = await controller.exportReport(
    { role: ACTOR_ROLE.OWNER, userId: "owner_user_1" },
    "qr-status",
    { format: "EXCEL", filters: { rangePreset: "this-month", page: 1, pageSize: 25 } },
    reply,
  );

  assert.ok(result instanceof StreamableFile);
  assert.equal(
    capturedHeaders.get("content-type"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  assert.equal(
    capturedHeaders.get("content-disposition"),
    'attachment; filename="qr-status-2026-07-08.xlsx"',
  );
});
