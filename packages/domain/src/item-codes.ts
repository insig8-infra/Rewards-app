import { DomainError } from "./types.js";

export const ITEM_CODE_STATUS = {
  IN_USE: "IN_USE",
  NOT_IN_USE: "NOT_IN_USE",
  NOT_IN_BUSY: "NOT_IN_BUSY",
} as const;

export type ItemCodeStatus = (typeof ITEM_CODE_STATUS)[keyof typeof ITEM_CODE_STATUS];

export const ITEM_CODE_REWARD_RULE_TYPE = {
  FIXED: "FIXED",
  PERCENT_OF_PRICE: "PERCENT_OF_PRICE",
  NONE: "NONE",
} as const;

export type ItemCodeRewardRuleType =
  (typeof ITEM_CODE_REWARD_RULE_TYPE)[keyof typeof ITEM_CODE_REWARD_RULE_TYPE];

export interface ItemCodeRewardRuleInput {
  readonly fixedPoints?: number | null;
  readonly percentOfPricePoints?: number | null;
}

export interface ResolvedItemCodeRewardRule {
  readonly fixedPoints: number | null;
  readonly percentOfPricePoints: number | null;
  readonly status: ItemCodeStatus;
}

export interface ItemCodePointResolutionInput extends ItemCodeRewardRuleInput {
  readonly status: ItemCodeStatus;
  readonly price: number;
}

export function resolveItemCodeStatus(input: ItemCodeRewardRuleInput & { readonly busyActive: boolean }): ItemCodeStatus {
  if (!input.busyActive) {
    return ITEM_CODE_STATUS.NOT_IN_BUSY;
  }

  return hasExactlyOneRewardRule(input) ? ITEM_CODE_STATUS.IN_USE : ITEM_CODE_STATUS.NOT_IN_USE;
}

export function validateItemCodeRewardRule(input: ItemCodeRewardRuleInput): ResolvedItemCodeRewardRule {
  const hasFixed = input.fixedPoints !== null && input.fixedPoints !== undefined;
  const hasPercent = input.percentOfPricePoints !== null && input.percentOfPricePoints !== undefined;

  if (hasFixed && hasPercent) {
    throw new DomainError(
      "ITEM_CODE_REWARD_RULE_CONFLICT",
      "Use either Absolute Points or percent-of-price for an ItemCode, not both.",
    );
  }

  if (hasFixed) {
    if (!Number.isInteger(input.fixedPoints) || input.fixedPoints <= 0) {
      throw new DomainError("ITEM_CODE_FIXED_POINTS_INVALID", "Absolute Points must be a positive whole number.");
    }

    return {
      fixedPoints: input.fixedPoints,
      percentOfPricePoints: null,
      status: ITEM_CODE_STATUS.IN_USE,
    };
  }

  if (hasPercent) {
    if (!Number.isFinite(input.percentOfPricePoints) || input.percentOfPricePoints <= 0) {
      throw new DomainError(
        "ITEM_CODE_PERCENT_POINTS_INVALID",
        "Percent-of-price points must be a positive percentage.",
      );
    }

    return {
      fixedPoints: null,
      percentOfPricePoints: input.percentOfPricePoints,
      status: ITEM_CODE_STATUS.IN_USE,
    };
  }

  return {
    fixedPoints: null,
    percentOfPricePoints: null,
    status: ITEM_CODE_STATUS.NOT_IN_USE,
  };
}

export function resolveItemCodePrintPoints(input: ItemCodePointResolutionInput): number {
  if (input.status === ITEM_CODE_STATUS.NOT_IN_BUSY) {
    throw new DomainError("ITEM_CODE_NOT_IN_BUSY", "ItemCode is no longer present in BUSY and cannot be printed.");
  }

  const rule = validateItemCodeRewardRule(input);
  if (rule.status === ITEM_CODE_STATUS.NOT_IN_USE) {
    throw new DomainError("ITEM_CODE_REWARD_RULE_REQUIRED", "ItemCode needs Absolute Points or percent-of-price before QR print.");
  }

  if (rule.fixedPoints !== null) {
    return rule.fixedPoints;
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new DomainError("ITEM_CODE_PRICE_INVALID", "ItemCode price must be available before percent-of-price QR print.");
  }

  return Math.round(input.price * (rule.percentOfPricePoints ?? 0) / 100);
}

export function hasExactlyOneRewardRule(input: ItemCodeRewardRuleInput): boolean {
  const hasFixed = input.fixedPoints !== null && input.fixedPoints !== undefined;
  const hasPercent = input.percentOfPricePoints !== null && input.percentOfPricePoints !== undefined;
  return hasFixed !== hasPercent;
}
