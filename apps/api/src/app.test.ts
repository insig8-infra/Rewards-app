import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { Test } from "@nestjs/testing";
import { AppModule } from "./app.module.js";
import {
  ACTOR_ROLE,
  DomainError,
  QR_STATUS,
  QR_TOKEN_STATUS,
  REWARD_CLAIM_STATUS,
} from "@volt-rewards/domain";
import { HealthController } from "./health/health.controller.js";
import { DomainPreviewController } from "./domain/domain-preview.controller.js";

test("health endpoint returns ok", async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const controller = moduleRef.get(HealthController);

  assert.deepEqual(controller.getHealth(), { status: "ok", service: "volt-rewards-api" });

  await moduleRef.close();
});

test("domain preview reprint endpoint invalidates old token", async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const controller = moduleRef.get(DomainPreviewController);

  const response = controller.reprintQr({
    qr: {
      id: "qr_1",
      status: QR_STATUS.PRINTED_UNCLAIMED,
      expiresAt: new Date("2026-08-01T00:00:00.000Z"),
      activeToken: { value: "token_v1", status: QR_TOKEN_STATUS.ACTIVE },
      tokenHistory: [],
      points: 100,
    },
    input: {
      actorRole: ACTOR_ROLE.OWNER,
      replacementToken: "token_v2",
      now: "2026-06-22T00:00:00.000Z",
    },
  });

  assert.equal(response.activeToken.value, "token_v2");
  assert.equal(response.status, QR_STATUS.REPRINTED);
  assert.equal(response.tokenHistory[0]?.status, QR_TOKEN_STATUS.INVALIDATED);

  await moduleRef.close();
});

test("domain preview reward fulfill keeps STAFF denied by domain rule", async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const controller = moduleRef.get(DomainPreviewController);

  assert.throws(
    () =>
      controller.fulfillReward({
        claim: {
          id: "claim_1",
          claimId: "CLAIM-001",
          contractorId: "contractor_1",
          rewardItemId: "reward_1",
          pointsDeducted: 800,
          status: REWARD_CLAIM_STATUS.CHOSEN,
        },
        input: {
          actorRole: ACTOR_ROLE.STAFF,
          otpVerified: true,
        },
      }),
    (error) => error instanceof DomainError && error.code === "REWARD_FULFILL_OWNER_ONLY",
  );

  await moduleRef.close();
});
