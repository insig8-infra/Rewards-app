import {
  ACTOR_ROLE,
  DomainError,
  REWARD_CLAIM_STATUS,
  type ActorRole,
  type ContractorPoints,
  type LedgerEntry,
  type RewardCatalogItem,
  type RewardClaim,
} from "./types.js";

export function redeemReward(
  contractor: ContractorPoints,
  reward: RewardCatalogItem,
  input: { readonly claimId: string; readonly rewardClaimId: string },
): { readonly contractor: ContractorPoints; readonly claim: RewardClaim; readonly ledgerEntry: LedgerEntry } {
  if (contractor.availablePoints < reward.pointsRequired) {
    throw new DomainError("REWARD_INSUFFICIENT_POINTS", "Contractor does not have enough points.");
  }

  const balanceAfter = contractor.availablePoints - reward.pointsRequired;

  return {
    contractor: { ...contractor, availablePoints: balanceAfter },
    claim: {
      id: input.rewardClaimId,
      claimId: input.claimId,
      contractorId: contractor.contractorId,
      rewardItemId: reward.id,
      pointsDeducted: reward.pointsRequired,
      status: REWARD_CLAIM_STATUS.CHOSEN,
    },
    ledgerEntry: {
      type: "reward_redeem",
      contractorId: contractor.contractorId,
      pointsDelta: -reward.pointsRequired,
      balanceAfter,
      sourceId: input.rewardClaimId,
    },
  };
}

export function cancelChosenReward(
  contractor: ContractorPoints,
  claim: RewardClaim,
): { readonly contractor: ContractorPoints; readonly claim: RewardClaim; readonly ledgerEntry: LedgerEntry } {
  if (claim.status !== REWARD_CLAIM_STATUS.CHOSEN) {
    throw new DomainError("REWARD_CANCEL_INVALID_STATUS", "Only chosen, uncollected rewards can be cancelled.");
  }

  const balanceAfter = contractor.availablePoints + claim.pointsDeducted;

  return {
    contractor: { ...contractor, availablePoints: balanceAfter },
    claim: { ...claim, status: REWARD_CLAIM_STATUS.CANCELLED_BY_CONTRACTOR },
    ledgerEntry: {
      type: "reward_cancel_restore",
      contractorId: contractor.contractorId,
      pointsDelta: claim.pointsDeducted,
      balanceAfter,
      sourceId: claim.id,
    },
  };
}

export function fulfillReward(
  claim: RewardClaim,
  input: { readonly actorRole: ActorRole; readonly otpVerified: boolean },
): RewardClaim {
  if (input.actorRole !== ACTOR_ROLE.OWNER && input.actorRole !== ACTOR_ROLE.ADMIN) {
    throw new DomainError("REWARD_FULFILL_OWNER_ONLY", "Only OWNER/Admin can fulfill rewards in v1.");
  }

  if (!input.otpVerified) {
    throw new DomainError("REWARD_FULFILL_OTP_REQUIRED", "Contractor OTP verification is required.");
  }

  if (claim.status !== REWARD_CLAIM_STATUS.CHOSEN) {
    throw new DomainError("REWARD_FULFILL_INVALID_STATUS", "Only chosen rewards can be fulfilled.");
  }

  return { ...claim, status: REWARD_CLAIM_STATUS.FULFILLED };
}

export function revokeUnfulfilledRewardDueToReturn(
  contractor: ContractorPoints,
  claim: RewardClaim,
): { readonly contractor: ContractorPoints; readonly claim: RewardClaim; readonly ledgerEntry: LedgerEntry } {
  if (claim.status !== REWARD_CLAIM_STATUS.CHOSEN) {
    throw new DomainError(
      "REWARD_REVOKE_INVALID_STATUS",
      "Only chosen, unfulfilled rewards can be revoked due to return.",
    );
  }

  const balanceAfter = contractor.availablePoints + claim.pointsDeducted;

  return {
    contractor: { ...contractor, availablePoints: balanceAfter },
    claim: { ...claim, status: REWARD_CLAIM_STATUS.REVOKED_DUE_TO_RETURN },
    ledgerEntry: {
      type: "reward_revoked_due_to_return",
      contractorId: contractor.contractorId,
      pointsDelta: claim.pointsDeducted,
      balanceAfter,
      sourceId: claim.id,
    },
  };
}
