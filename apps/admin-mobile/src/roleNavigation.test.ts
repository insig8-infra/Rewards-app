import assert from "node:assert/strict";
import test from "node:test";
import { canUseOwnerAction, tabsForRole } from "./roleNavigation.js";

test("OWNER sees reports tab and owner actions", () => {
  assert.deepEqual(tabsForRole("OWNER"), ["Dashboard", "ReturnScan", "Contractors", "Rewards", "Reports"]);
  assert.equal(canUseOwnerAction("OWNER"), true);
});

test("STAFF sees read-only reports but not owner actions", () => {
  assert.deepEqual(tabsForRole("STAFF"), ["Dashboard", "ReturnScan", "Contractors", "Rewards", "Reports"]);
  assert.equal(canUseOwnerAction("STAFF"), false);
});
