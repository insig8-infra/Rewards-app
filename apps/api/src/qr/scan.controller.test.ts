import assert from "node:assert/strict";
import test from "node:test";
import { BadRequestException } from "@nestjs/common";
import { ACTOR_ROLE, DomainError } from "@volt-rewards/domain";
import { ScanController } from "./scan.controller.js";
import type { QrScanService } from "./qr-scan.service.js";

test("ScanController maps QR domain scan failures to BadRequestException", async () => {
  const controller = new ScanController({
    scanQr: async () => {
      throw new DomainError("QR_NOT_SCANNABLE", "QR in status SCANNED_CLAIMED cannot be scanned.");
    },
    listScanHistory: async () => [],
  } as unknown as QrScanService);

  await assert.rejects(
    controller.scanQr(
      {
        role: ACTOR_ROLE.CONTRACTOR,
        contractorId: "contractor_1",
      },
      {
        token: "qr-token",
        siteId: "site_1",
      },
    ),
    (error) => {
      assert.equal(error instanceof BadRequestException, true);
      const response = (error as BadRequestException).getResponse() as { readonly code?: string; readonly message?: string };
      assert.equal(response.code, "QR_NOT_SCANNABLE");
      assert.equal(response.message, "QR in status SCANNED_CLAIMED cannot be scanned.");
      return true;
    },
  );
});
