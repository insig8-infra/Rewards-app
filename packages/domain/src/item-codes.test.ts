import assert from "node:assert/strict";
import test from "node:test";
import {
  DomainError,
  ITEM_CODE_STATUS,
  resolveItemCodePrintPoints,
  resolveItemCodeStatus,
  validateItemCodeRewardRule,
} from "./index.js";

test("ItemCode reward rule accepts exactly one active fixed or percent rule", () => {
  assert.deepEqual(validateItemCodeRewardRule({ fixedPoints: 25 }), {
    fixedPoints: 25,
    percentOfPricePoints: null,
    status: ITEM_CODE_STATUS.IN_USE,
  });
  assert.deepEqual(validateItemCodeRewardRule({ percentOfPricePoints: 0.25 }), {
    fixedPoints: null,
    percentOfPricePoints: 0.25,
    status: ITEM_CODE_STATUS.IN_USE,
  });
  assert.deepEqual(validateItemCodeRewardRule({}), {
    fixedPoints: null,
    percentOfPricePoints: null,
    status: ITEM_CODE_STATUS.NOT_IN_USE,
  });
});

test("ItemCode reward rule rejects conflicting and non-positive active values", () => {
  assert.throws(
    () => validateItemCodeRewardRule({ fixedPoints: 10, percentOfPricePoints: 1 }),
    (error) => error instanceof DomainError && error.code === "ITEM_CODE_REWARD_RULE_CONFLICT",
  );
  assert.throws(
    () => validateItemCodeRewardRule({ fixedPoints: 0 }),
    (error) => error instanceof DomainError && error.code === "ITEM_CODE_FIXED_POINTS_INVALID",
  );
  assert.throws(
    () => validateItemCodeRewardRule({ percentOfPricePoints: 0 }),
    (error) => error instanceof DomainError && error.code === "ITEM_CODE_PERCENT_POINTS_INVALID",
  );
});

test("ItemCode point resolution freezes fixed or percent-of-price points for QR print", () => {
  assert.equal(resolveItemCodePrintPoints({
    status: ITEM_CODE_STATUS.IN_USE,
    price: 100,
    fixedPoints: 18,
  }), 18);
  assert.equal(resolveItemCodePrintPoints({
    status: ITEM_CODE_STATUS.IN_USE,
    price: 100,
    percentOfPricePoints: 10,
  }), 10);
  assert.equal(resolveItemCodePrintPoints({
    status: ITEM_CODE_STATUS.IN_USE,
    price: 2850,
    percentOfPricePoints: 0.5,
  }), 14);
});

test("ItemCode status reflects BUSY presence before reward-rule completeness", () => {
  assert.equal(resolveItemCodeStatus({ busyActive: true, fixedPoints: 10 }), ITEM_CODE_STATUS.IN_USE);
  assert.equal(resolveItemCodeStatus({ busyActive: true }), ITEM_CODE_STATUS.NOT_IN_USE);
  assert.equal(resolveItemCodeStatus({ busyActive: false, fixedPoints: 10 }), ITEM_CODE_STATUS.NOT_IN_BUSY);
});

test("ItemCode print points reject missing rule and not-in-BUSY rows", () => {
  assert.throws(
    () => resolveItemCodePrintPoints({ status: ITEM_CODE_STATUS.NOT_IN_USE, price: 100 }),
    (error) => error instanceof DomainError && error.code === "ITEM_CODE_REWARD_RULE_REQUIRED",
  );
  assert.throws(
    () => resolveItemCodePrintPoints({ status: ITEM_CODE_STATUS.NOT_IN_BUSY, price: 100, fixedPoints: 10 }),
    (error) => error instanceof DomainError && error.code === "ITEM_CODE_NOT_IN_BUSY",
  );
});
