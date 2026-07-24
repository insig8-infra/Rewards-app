import assert from "node:assert/strict";
import test from "node:test";
import { canUseManagerAction, canUseOwnerAction, tabsForRole } from "./roleNavigation.js";

test("OWNER sees all mobile tabs and owner actions", () => {
  assert.deepEqual(tabsForRole("OWNER"), ["Dashboard", "ReturnScan", "Contractors", "Rewards", "Reports"]);
  assert.equal(canUseOwnerAction("OWNER"), true);
  assert.equal(canUseManagerAction("OWNER"), true);
});

test("ADMIN sees all mobile tabs and manager actions without owner-only authority", () => {
  assert.deepEqual(tabsForRole("ADMIN"), ["Dashboard", "ReturnScan", "Contractors", "Rewards", "Reports"]);
  assert.equal(canUseOwnerAction("ADMIN"), false);
  assert.equal(canUseManagerAction("ADMIN"), true);
});

test("STAFF sees read-only reports but not owner actions", () => {
  assert.deepEqual(tabsForRole("STAFF"), ["Dashboard", "ReturnScan", "Contractors", "Rewards", "Reports"]);
  assert.equal(canUseOwnerAction("STAFF"), false);
  assert.equal(canUseManagerAction("STAFF"), false);
});
