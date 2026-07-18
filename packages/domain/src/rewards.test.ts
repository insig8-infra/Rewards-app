import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTOR_ROLE,
  DomainError,
  REWARD_CLAIM_STATUS,
  cancelChosenReward,
  fulfillReward,
  redeemReward,
  revokeUnfulfilledRewardDueToReturn,
} from "./index.js";
import type { ContractorPoints, RewardCatalogItem } from "./index.js";

const contractor: ContractorPoints = {
  contractorId: "contractor_1",
  availablePoints: 1000,
  totalAccumulatedPoints: 1200,
  tier: "Silver",
};

const reward: RewardCatalogItem = {
  id: "reward_1",
  name: "Air Fryer",
  pointsRequired: 800,
};

test("redeemReward deducts points and creates Claim ID", () => {
  const result = redeemReward(contractor, reward, {
    claimId: "CLAIM-001",
    rewardClaimId: "claim_1",
  });

  assert.equal(result.contractor.availablePoints, 200);
  assert.equal(result.claim.status, REWARD_CLAIM_STATUS.CHOSEN);
  assert.equal(result.claim.claimId, "CLAIM-001");
  assert.equal(result.ledgerEntry.pointsDelta, -800);
});

test("redeemReward rejects insufficient points", () => {
  assert.throws(
    () =>
      redeemReward({ ...contractor, availablePoints: 500 }, reward, {
        claimId: "CLAIM-002",
        rewardClaimId: "claim_2",
      }),
    (error) => error instanceof DomainError && error.code === "REWARD_INSUFFICIENT_POINTS",
  );
});

test("cancelChosenReward restores points before physical collection", () => {
  const redeemed = redeemReward(contractor, reward, {
    claimId: "CLAIM-003",
    rewardClaimId: "claim_3",
  });

  const cancelled = cancelChosenReward(redeemed.contractor, redeemed.claim);

  assert.equal(cancelled.contractor.availablePoints, 1000);
  assert.equal(cancelled.claim.status, REWARD_CLAIM_STATUS.CANCELLED_BY_CONTRACTOR);
  assert.equal(cancelled.ledgerEntry.type, "reward_cancel_restore");
});

test("fulfillReward is OWNER-only and requires OTP", () => {
  const redeemed = redeemReward(contractor, reward, {
    claimId: "CLAIM-004",
    rewardClaimId: "claim_4",
  });

  assert.throws(
    () => fulfillReward(redeemed.claim, { actorRole: ACTOR_ROLE.STAFF, otpVerified: true }),
    (error) => error instanceof DomainError && error.code === "REWARD_FULFILL_OWNER_ONLY",
  );

  const fulfilled = fulfillReward(redeemed.claim, {
    actorRole: ACTOR_ROLE.OWNER,
    otpVerified: true,
  });

  assert.equal(fulfilled.status, REWARD_CLAIM_STATUS.FULFILLED);
});

test("revokeUnfulfilledRewardDueToReturn restores deducted reward points", () => {
  const redeemed = redeemReward(contractor, reward, {
    claimId: "CLAIM-005",
    rewardClaimId: "claim_5",
  });

  const revoked = revokeUnfulfilledRewardDueToReturn(redeemed.contractor, redeemed.claim);

  assert.equal(revoked.contractor.availablePoints, 1000);
  assert.equal(revoked.claim.status, REWARD_CLAIM_STATUS.REVOKED_DUE_TO_RETURN);
});
