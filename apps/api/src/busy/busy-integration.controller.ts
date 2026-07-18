import { BadRequestException, Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { ACTOR_ROLE, DomainError } from "@volt-rewards/domain";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { ItemCodesService } from "../item-codes/item-codes.service.js";
import {
  assertBusyIntegrationCredentials,
  BUSY_INTEGRATION_API_KEY_HEADER,
  BUSY_INTEGRATION_CLIENT_ID_HEADER,
} from "./busy-integration-auth.js";
import type { BusyPayloadImportResult } from "./busy-import.service.js";
import { BusyImportService } from "./busy-import.service.js";

const busyIntegrationActor: AuthenticatedActor = { role: ACTOR_ROLE.SYSTEM };

@Controller("integrations/busy/v1")
export class BusyIntegrationController {
  constructor(
    private readonly busyImport: BusyImportService,
    private readonly itemCodes: ItemCodesService,
  ) {}

  @Get("health")
  getHealth(@Headers() headers: Record<string, string | string[] | undefined>) {
    const auth = assertBusyIntegrationCredentials(headers);
    return {
      status: "ok",
      service: "volt-rewards-busy-receiver",
      version: "v1",
      clientId: auth.clientId,
      requiredHeaders: [BUSY_INTEGRATION_CLIENT_ID_HEADER, BUSY_INTEGRATION_API_KEY_HEADER],
    };
  }

  @Post("vouchers/upsert")
  async upsertVoucher(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
  ) {
    const auth = assertBusyIntegrationCredentials(headers);
    const importedAt = new Date();
    const result = await this.busyImport
      .importBusyVoucherPayload(body, importedAt, busyIntegrationActor)
      .catch(mapDomainError);

    return {
      accepted: true,
      receivedAt: importedAt.toISOString(),
      clientId: auth.clientId,
      ...toVoucherImportResponse(result),
    };
  }

  @Post("item-codes/full-sync")
  async fullSyncItemCodes(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
  ) {
    const auth = assertBusyIntegrationCredentials(headers);
    const syncedAt = new Date();
    const result = await this.itemCodes
      .syncFromBusyItemMasterPayload(body, {
        mode: "FULL",
        syncedAt,
        actor: busyIntegrationActor,
      })
      .catch(mapDomainError);

    return {
      accepted: true,
      mode: "FULL",
      receivedAt: syncedAt.toISOString(),
      clientId: auth.clientId,
      ...result,
    };
  }

  @Post("item-codes/upsert")
  async upsertItemCodes(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
  ) {
    const auth = assertBusyIntegrationCredentials(headers);
    const syncedAt = new Date();
    const result = await this.itemCodes
      .syncFromBusyItemMasterPayload(body, {
        mode: "DELTA",
        syncedAt,
        actor: busyIntegrationActor,
      })
      .catch(mapDomainError);

    return {
      accepted: true,
      mode: "DELTA",
      receivedAt: syncedAt.toISOString(),
      clientId: auth.clientId,
      ...result,
    };
  }
}

function toVoucherImportResponse(result: BusyPayloadImportResult) {
  if (result.kind === "sale") {
    return {
      kind: "sale",
      externalInvoiceId: result.importedInvoice.externalInvoiceId,
      invoiceId: result.importedInvoice.invoiceId,
      invoiceNumber: result.importedInvoice.invoiceNumber,
      lineCount: result.importedInvoice.lineCount,
      qrUnitCount: result.importedInvoice.qrUnitCount,
    };
  }

  if (result.kind === "return") {
    return {
      kind: "return",
      externalReturnId: result.importedReturnVoucher.externalReturnId,
      returnVoucherId: result.importedReturnVoucher.returnVoucherId,
      returnNumber: result.importedReturnVoucher.returnNumber,
      originalInvoiceId: result.importedReturnVoucher.originalInvoiceId,
      lineCount: result.importedReturnVoucher.lineCount,
      allocationCount: result.importedReturnVoucher.allocationCount,
      reviewNeededCount: result.importedReturnVoucher.reviewNeededCount,
    };
  }

  return {
    kind: "ignored",
    voucherType: result.voucherType,
    reason: result.reason,
  };
}

function mapDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw new BadRequestException({ message: error.message, code: error.code });
  }
  throw error;
}
