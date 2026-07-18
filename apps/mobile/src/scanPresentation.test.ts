import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldShowScanPoints } from "./scanPresentation";

test("Contractor scan success can show points and balance", () => {
  assert.equal(shouldShowScanPoints("CONTRACTOR"), true);
});

test("Team Member scan success hides points and balance", () => {
  assert.equal(shouldShowScanPoints("TEAM_MEMBER"), false);
});
