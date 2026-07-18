import assert from "node:assert/strict";
import test from "node:test";
import { canShowTeamMemberHistory, describeHistoryScope } from "./historyScope";

test("Contractor history scope is full contractor history", () => {
  assert.equal(
    describeHistoryScope({
      role: "CONTRACTOR",
      contractorId: "contractor_1",
    }),
    "FULL_CONTRACTOR",
  );
});

test("Team Member history scope requires Team Member attribution", () => {
  assert.equal(
    describeHistoryScope({
      role: "TEAM_MEMBER",
      contractorId: "contractor_1",
      teamMemberMobile: "9876543210",
    }),
    "TEAM_MEMBER_ATTRIBUTED",
  );
  assert.equal(
    canShowTeamMemberHistory({
      role: "TEAM_MEMBER",
      contractorId: "contractor_1",
    }),
    false,
  );
  assert.equal(
    canShowTeamMemberHistory({
      role: "TEAM_MEMBER",
      contractorId: "contractor_1",
      teamMemberMobile: "9876543210",
    }),
    true,
  );
});
