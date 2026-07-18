import assert from "node:assert/strict";
import test from "node:test";
import { ACTION, ACTOR_ROLE, can } from "./index.js";

test("Contractor cannot self-register but can manage own site", () => {
  assert.equal(can(ACTOR_ROLE.CONTRACTOR, ACTION.CONTRACTOR_SELF_REGISTER), false);
  assert.equal(can(ACTOR_ROLE.CONTRACTOR, ACTION.CONTRACTOR_MANAGE_OWN_SITE), true);
  assert.equal(can(ACTOR_ROLE.CONTRACTOR, ACTION.QR_SCAN), true);
  assert.equal(can(ACTOR_ROLE.CONTRACTOR, ACTION.CONTRACTOR_VIEW_REWARDS), true);
  assert.equal(can(ACTOR_ROLE.CONTRACTOR, ACTION.PROMOTION_VIEW), true);
});

test("Team Member can scan but cannot manage sites or view rewards", () => {
  assert.equal(can(ACTOR_ROLE.TEAM_MEMBER, ACTION.QR_SCAN), true);
  assert.equal(can(ACTOR_ROLE.TEAM_MEMBER, ACTION.TEAM_MEMBER_SCAN), true);
  assert.equal(can(ACTOR_ROLE.TEAM_MEMBER, ACTION.TEAM_MEMBER_MANAGE_SITE), false);
  assert.equal(can(ACTOR_ROLE.TEAM_MEMBER, ACTION.TEAM_MEMBER_VIEW_REWARDS), false);
  assert.equal(can(ACTOR_ROLE.TEAM_MEMBER, ACTION.CONTRACTOR_VIEW_REWARDS), false);
  assert.equal(can(ACTOR_ROLE.TEAM_MEMBER, ACTION.PROMOTION_VIEW), true);
});

test("STAFF can cancel/reverse QR but cannot export or fulfill rewards", () => {
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_PRINT_QR), true);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_CANCEL_QR), true);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_REVERSE_QR), true);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_VIEW_CONTRACTOR), true);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_REGISTER_CONTRACTOR), false);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_EDIT_CONTRACTOR), false);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_MANAGE_STAFF), false);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.REPORT_EXPORT), false);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_FULFILL_REWARD), false);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_MANAGE_REWARD_CATALOG), false);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_MANAGE_PROMOTIONS), false);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_VIEW_ITEM_CODES), true);
  assert.equal(can(ACTOR_ROLE.STAFF, ACTION.ADMIN_MANAGE_ITEM_CODES), false);
});

test("OWNER can manage staff, export reports, fulfill rewards, reward catalog, and promotions", () => {
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_PRINT_QR), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_VIEW_CONTRACTOR), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_REGISTER_CONTRACTOR), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_EDIT_CONTRACTOR), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_MANAGE_STAFF), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.REPORT_EXPORT), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_FULFILL_REWARD), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_MANAGE_REWARD_CATALOG), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_MANAGE_PROMOTIONS), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_VIEW_ITEM_CODES), true);
  assert.equal(can(ACTOR_ROLE.OWNER, ACTION.ADMIN_MANAGE_ITEM_CODES), true);
});
