import type { RewardCatalogTile } from "./api";

const rewardStatusPriority: Record<RewardCatalogTile["status"], number> = {
  CHOSEN: 0,
  ELIGIBLE: 1,
  LOCKED: 2,
  FULFILLED: 3,
};

export type RewardsTab = "AVAILABLE" | "CLAIMS" | "DELIVERED";

export interface RewardCatalogSections {
  readonly available: readonly RewardCatalogTile[];
  readonly claims: readonly RewardCatalogTile[];
  readonly delivered: readonly RewardCatalogTile[];
}

export function selectFeaturedRewards(
  rewards: readonly RewardCatalogTile[],
  limit = 4,
): readonly RewardCatalogTile[] {
  return sortRewardsForContractor(rewards)
    .filter((reward) => reward.status !== "FULFILLED")
    .slice(0, limit);
}

export function splitRewardCatalog(rewards: readonly RewardCatalogTile[]): RewardCatalogSections {
  const sorted = sortRewardsForContractor(rewards);
  return {
    available: sorted.filter((reward) => reward.status === "ELIGIBLE" || reward.status === "LOCKED"),
    claims: sorted.filter((reward) => reward.status === "CHOSEN"),
    delivered: sorted.filter((reward) => reward.status === "FULFILLED"),
  };
}

function sortRewardsForContractor(rewards: readonly RewardCatalogTile[]): readonly RewardCatalogTile[] {
  return rewards.toSorted((left, right) => {
    const statusDifference = rewardStatusPriority[left.status] - rewardStatusPriority[right.status];
    if (statusDifference !== 0) {
      return statusDifference;
    }
    if (left.status === "LOCKED" && right.status === "LOCKED") {
      const gapDifference = left.pointsGap - right.pointsGap;
      if (gapDifference !== 0) {
        return gapDifference;
      }
    }
    const pointsDifference = left.pointsRequired - right.pointsRequired;
    if (pointsDifference !== 0) {
      return pointsDifference;
    }
    return left.name.localeCompare(right.name);
  });
}
