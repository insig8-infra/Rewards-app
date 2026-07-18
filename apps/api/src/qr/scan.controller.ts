import { BadRequestException, Body, Controller, Get, Post, Query, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ACTION, ACTOR_ROLE, DomainError } from "@volt-rewards/domain";
import { ActorGuard } from "../auth/actor.guard.js";
import type { AuthenticatedActor } from "../auth/authenticated-actor.js";
import { CurrentActor } from "../auth/current-actor.decorator.js";
import { RequireAction } from "../auth/require-action.decorator.js";
import type { PersistedScanResult } from "./qr-scan.repository.js";
import { QrScanService } from "./qr-scan.service.js";

@Controller("scan")
@UseGuards(ActorGuard)
export class ScanController {
  constructor(private readonly scans: QrScanService) {}

  @Post("qr")
  @RequireAction(ACTION.QR_SCAN)
  scanQr(
    @CurrentActor() actor: AuthenticatedActor,
    @Body()
    body: {
      readonly token: string;
      readonly siteId: string;
      readonly teamMemberSessionId?: string;
      readonly deviceContext?: Record<string, unknown>;
      readonly now?: string;
    },
  ): ReturnType<QrScanService["scanQr"]> {
    if (!actor.contractorId) {
      throw new UnauthorizedException("Actor contractor scope is required for QR scan.");
    }
    if (actor.role === ACTOR_ROLE.TEAM_MEMBER && !actor.teamMemberMobile) {
      throw new UnauthorizedException("Team Member mobile is required for Team Member scans.");
    }

    return this.scans
      .scanQr({
        tokenValue: body.token,
        actorRole: actor.role,
        contractorId: actor.contractorId,
        siteId: body.siteId,
        ...(actor.teamMemberMobile ? { teamMemberMobile: actor.teamMemberMobile } : {}),
        ...(body.teamMemberSessionId ? { teamMemberSessionId: body.teamMemberSessionId } : {}),
        ...(isDeviceContext(body.deviceContext) ? { deviceContext: body.deviceContext } : {}),
        now: body.now ? new Date(body.now) : new Date(),
      })
      .catch((error: unknown) => {
        if (error instanceof DomainError) {
          throw new BadRequestException({ message: error.message, code: error.code });
        }
        throw error;
      }) as ReturnType<QrScanService["scanQr"]>;
  }

  @Get("cart")
  @RequireAction(ACTION.QR_SCAN)
  getCart(
    @CurrentActor() actor: AuthenticatedActor,
    @Query()
    query: {
      readonly siteId?: string;
    },
  ): ReturnType<QrScanService["getScanCart"]> {
    if (!actor.contractorId) {
      throw new UnauthorizedException("Actor contractor scope is required for scan cart.");
    }
    if (!query.siteId) {
      throw new BadRequestException("siteId is required.");
    }
    if (actor.role === ACTOR_ROLE.TEAM_MEMBER && !actor.teamMemberMobile) {
      throw new UnauthorizedException("Team Member mobile is required for Team Member scan cart.");
    }

    return this.scans.getScanCart({
      actorRole: actor.role,
      contractorId: actor.contractorId,
      siteId: query.siteId,
      ...(actor.teamMemberMobile ? { teamMemberMobile: actor.teamMemberMobile } : {}),
      now: new Date(),
    });
  }

  @Post("cart/commit")
  @RequireAction(ACTION.QR_SCAN)
  commitCart(
    @CurrentActor() actor: AuthenticatedActor,
    @Body()
    body: {
      readonly siteId: string;
      readonly teamMemberSessionId?: string;
      readonly now?: string;
    },
  ): ReturnType<QrScanService["commitScanCart"]> {
    if (!actor.contractorId) {
      throw new UnauthorizedException("Actor contractor scope is required for scan cart commit.");
    }
    if (actor.role === ACTOR_ROLE.TEAM_MEMBER && !actor.teamMemberMobile) {
      throw new UnauthorizedException("Team Member mobile is required for Team Member scan cart commit.");
    }

    return this.scans.commitScanCart({
      actorRole: actor.role,
      contractorId: actor.contractorId,
      siteId: body.siteId,
      ...(actor.teamMemberMobile ? { teamMemberMobile: actor.teamMemberMobile } : {}),
      ...(body.teamMemberSessionId ? { teamMemberSessionId: body.teamMemberSessionId } : {}),
      now: body.now ? new Date(body.now) : new Date(),
    });
  }

  @Get("history")
  @RequireAction(ACTION.QR_SCAN)
  listHistory(
    @CurrentActor() actor: AuthenticatedActor,
    @Query()
    query: {
      readonly siteId?: string;
      readonly result?: string;
      readonly limit?: string;
    },
  ): ReturnType<QrScanService["listScanHistory"]> {
    if (!actor.contractorId) {
      throw new UnauthorizedException("Actor contractor scope is required for scan history.");
    }
    if (actor.role === ACTOR_ROLE.TEAM_MEMBER && !actor.teamMemberMobile) {
      throw new UnauthorizedException("Team Member mobile is required for Team Member scan history.");
    }

    return this.scans.listScanHistory({
      actorRole: actor.role,
      contractorId: actor.contractorId,
      ...(actor.teamMemberMobile ? { teamMemberMobile: actor.teamMemberMobile } : {}),
      ...(query.siteId ? { siteId: query.siteId } : {}),
      ...(query.result ? { result: parseScanResult(query.result) } : {}),
      ...(query.limit ? { limit: Number.parseInt(query.limit, 10) } : {}),
    });
  }
}

const persistedScanResults = new Set<PersistedScanResult>([
  "RESERVED",
  "SUCCESS",
  "ALREADY_CLAIMED",
  "EXPIRED",
  "INVALID",
  "REPLACED",
  "CART_CAP_REACHED",
  "PERMISSION_DENIED",
]);

function parseScanResult(value: string): PersistedScanResult {
  if (!persistedScanResults.has(value as PersistedScanResult)) {
    throw new BadRequestException("Invalid scan result filter.");
  }
  return value as PersistedScanResult;
}

function isDeviceContext(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
