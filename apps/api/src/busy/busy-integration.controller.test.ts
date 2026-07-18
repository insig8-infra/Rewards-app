import assert from "node:assert/strict";
import test from "node:test";
import { ACTOR_ROLE } from "@volt-rewards/domain";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import type { ItemCodesService } from "../item-codes/item-codes.service.js";
import { BusyIntegrationController } from "./busy-integration.controller.js";
import {
  BUSY_INTEGRATION_API_KEY_HEADER,
  BUSY_INTEGRATION_CLIENT_ID_HEADER,
} from "./busy-integration-auth.js";
import type { BusyImportService } from "./busy-import.service.js";

test("BUSY voucher upsert authenticates and returns sale import summary", async () => {
  await withBusyCredentialEnv(async () => {
    let capturedActor: AuthenticatedActor | undefined;
    const busyImport = {
      importBusyVoucherPayload: async (_payload: unknown, _importedAt: Date, actor?: AuthenticatedActor) => {
        capturedActor = actor;
        return {
          kind: "sale" as const,
          importedInvoice: {
            invoiceId: "invoice_1",
            externalInvoiceId: "25",
            invoiceNumber: "12/2025-26",
            lineCount: 1,
            qrUnitCount: 5,
          },
        };
      },
    } as unknown as BusyImportService;
    const itemCodes = {} as unknown as ItemCodesService;
    const controller = new BusyIntegrationController(busyImport, itemCodes);

    const response = await controller.upsertVoucher(busyHeaders(), { Sale: { VchType: "Sale" } });

    assert.equal(capturedActor?.role, ACTOR_ROLE.SYSTEM);
    assert.equal(response.accepted, true);
    assert.equal(response.kind, "sale");
    assert.equal(response.externalInvoiceId, "25");
    assert.equal(response.qrUnitCount, 5);
    assert.equal(response.clientId, "busy-test-client");
  });
});

test("BUSY ItemCodes full sync endpoint uses full-sync mode", async () => {
  await withBusyCredentialEnv(async () => {
    let capturedMode: string | undefined;
    const busyImport = {} as unknown as BusyImportService;
    const itemCodes = {
      syncFromBusyItemMasterPayload: async (
        _payload: unknown,
        options: { readonly mode: string; readonly syncedAt: Date; readonly actor?: AuthenticatedActor },
      ) => {
        capturedMode = options.mode;
        return {
          sourceCount: 1,
          createdCount: 1,
          updatedCount: 0,
          missingCount: 0,
          attentionCount: 1,
          latestSyncAt: options.syncedAt,
          itemsNeedingAttention: [],
        };
      },
    } as unknown as ItemCodesService;
    const controller = new BusyIntegrationController(busyImport, itemCodes);

    const response = await controller.fullSyncItemCodes(busyHeaders(), {
      items: [{ tmpItemCode: "40291", ItemName: "TestItem", Price: "200" }],
    });

    assert.equal(capturedMode, "FULL");
    assert.equal(response.accepted, true);
    assert.equal(response.mode, "FULL");
    assert.equal(response.sourceCount, 1);
  });
});

function busyHeaders(): Record<string, string> {
  return {
    [BUSY_INTEGRATION_CLIENT_ID_HEADER]: "busy-test-client",
    [BUSY_INTEGRATION_API_KEY_HEADER]: "busy-test-key",
  };
}

async function withBusyCredentialEnv(run: () => Promise<void>): Promise<void> {
  const originalClientId = process.env.BUSY_INTEGRATION_CLIENT_ID;
  const originalApiKey = process.env.BUSY_INTEGRATION_API_KEY;
  process.env.BUSY_INTEGRATION_CLIENT_ID = "busy-test-client";
  process.env.BUSY_INTEGRATION_API_KEY = "busy-test-key";
  try {
    await run();
  } finally {
    restoreEnv("BUSY_INTEGRATION_CLIENT_ID", originalClientId);
    restoreEnv("BUSY_INTEGRATION_API_KEY", originalApiKey);
  }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

