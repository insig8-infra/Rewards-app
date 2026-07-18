import assert from "node:assert/strict";
import test from "node:test";
import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ACTION, ACTOR_ROLE } from "@volt-rewards/domain";
import { ActorGuard } from "./actor.guard.js";
import type { RequestWithActor } from "./authenticated-actor.js";
import type { MobileAuthService } from "./mobile-auth.service.js";
import { RequireAction } from "./require-action.decorator.js";

class GuardedController {
  @RequireAction(ACTION.ADMIN_PRINT_QR)
  printQr(): void {}

  @RequireAction(ACTION.QR_SCAN)
  scanQr(): void {}
}

test("ActorGuard attaches a permitted actor from request headers", () => {
  const request: RequestWithActor = {
    headers: {
      "x-actor-role": ACTOR_ROLE.STAFF,
      "x-actor-user-id": "user_staff_1",
    },
  };
  const guard = new ActorGuard(new Reflector());

  assert.equal(guard.canActivate(createContext(request, GuardedController.prototype.printQr)), true);
  assert.deepEqual(request.actor, {
    role: ACTOR_ROLE.STAFF,
    userId: "user_staff_1",
  });
});

test("ActorGuard rejects missing actor headers on protected routes", () => {
  const guard = new ActorGuard(new Reflector());

  assert.throws(
    () => guard.canActivate(createContext({ headers: {} }, GuardedController.prototype.printQr)),
    (error) => error instanceof UnauthorizedException,
  );
});

test("ActorGuard rejects actors without the required permission", () => {
  const guard = new ActorGuard(new Reflector());

  assert.throws(
    () =>
      guard.canActivate(
        createContext(
          {
            headers: {
              "x-actor-role": ACTOR_ROLE.CONTRACTOR,
              "x-actor-contractor-id": "contractor_1",
            },
          },
          GuardedController.prototype.printQr,
        ),
      ),
    (error) => error instanceof ForbiddenException,
  );
});

test("ActorGuard allows Contractor scan scope headers", () => {
  const request: RequestWithActor = {
    headers: {
      "x-actor-role": ACTOR_ROLE.CONTRACTOR,
      "x-actor-contractor-id": "contractor_1",
    },
  };
  const guard = new ActorGuard(new Reflector());

  assert.equal(guard.canActivate(createContext(request, GuardedController.prototype.scanQr)), true);
  assert.deepEqual(request.actor, {
    role: ACTOR_ROLE.CONTRACTOR,
    contractorId: "contractor_1",
  });
});

test("ActorGuard attaches a permitted actor from bearer session", async () => {
  const request: RequestWithActor = {
    headers: {
      authorization: "Bearer session-token-1",
    },
  };
  const guard = new ActorGuard(new Reflector(), {
    resolveBearerActor: (token: string) =>
      Promise.resolve({
        sessionId: "session_1",
        actor: {
          role: ACTOR_ROLE.TEAM_MEMBER,
          contractorId: "contractor_1",
          teamMemberMobile: "9876543210",
        },
        expiresAt: new Date("2026-07-01T23:59:59.999Z"),
        requiresMpinSetup: false,
      }),
  } as unknown as MobileAuthService);

  assert.equal(await guard.canActivate(createContext(request, GuardedController.prototype.scanQr)), true);
  assert.deepEqual(request.actor, {
    role: ACTOR_ROLE.TEAM_MEMBER,
    contractorId: "contractor_1",
    teamMemberMobile: "9876543210",
  });
});

function createContext(request: RequestWithActor, handler: () => void): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => GuardedController,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
