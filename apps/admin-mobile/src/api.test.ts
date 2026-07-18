import assert from "node:assert/strict";
import test from "node:test";
import { lookupRewardClaim, sendRewardFulfillmentOtp } from "./api.js";

const otpResponse = {
  challengeId: "otp-challenge-1",
  claimId: "CLM-ACTIVE01",
  expiresAt: "2026-07-08T10:00:00.000Z",
  delivery: {
    channel: "MOCK_SMS_TO_CONTRACTOR",
    status: "MOCK_RETURNED_FOR_LOCAL_DEV",
    mockOtp: "123456",
  },
};

const claimLookupResponse = {
  claim: {
    rewardClaimId: "reward-claim-1",
    claimId: "CLM-ACTIVE01",
    contractorId: "contractor-1",
    rewardId: "reward-1",
    rewardName: "Premium Toolbox",
    status: "CHOSEN",
    pointsDeducted: 500,
    chosenAt: "2026-07-07T09:00:00.000Z",
  },
  contractor: {
    contractorId: "contractor-1",
    contractorCode: "CON-0001",
    name: "Mahesh Patil",
    mobileNumber: "9000001002",
    currentTier: "Gold",
    totalAccumulatedPoints: 2600,
    pointsAvailable: 2100,
  },
  canSendOtp: true,
  canFulfill: true,
};

test("sendRewardFulfillmentOtp omits JSON content-type when POST has no body", async (t) => {
  const originalFetch = globalThis.fetch;
  let capturedInit: RequestInit | undefined;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedInit = init;
    return {
      ok: true,
      json: async () => otpResponse,
    } as Response;
  }) as typeof fetch;

  await sendRewardFulfillmentOtp("admin-token", "CLM-ACTIVE01");

  const headers = capturedInit?.headers as Record<string, string>;
  assert.equal(capturedInit?.method, "POST");
  assert.equal(capturedInit?.body, undefined);
  assert.equal(headers.authorization, "Bearer admin-token");
  assert.equal(headers["content-type"], undefined);
});

test("lookupRewardClaim keeps JSON content-type when POST sends a body", async (t) => {
  const originalFetch = globalThis.fetch;
  let capturedInit: RequestInit | undefined;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedInit = init;
    return {
      ok: true,
      json: async () => claimLookupResponse,
    } as Response;
  }) as typeof fetch;

  await lookupRewardClaim("admin-token", "CLM-ACTIVE01");

  const headers = capturedInit?.headers as Record<string, string>;
  assert.equal(capturedInit?.method, "POST");
  assert.equal(capturedInit?.body, JSON.stringify({ claimId: "CLM-ACTIVE01" }));
  assert.equal(headers.authorization, "Bearer admin-token");
  assert.equal(headers["content-type"], "application/json");
});
