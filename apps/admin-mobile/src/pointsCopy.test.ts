import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(decodeURIComponent(new URL("../App.tsx", import.meta.url).pathname), "utf8");

test("Admin Mobile active UI copy does not display loyalty points as rupees", () => {
  assert.equal(appSource.includes("Rs."), false);
  assert.equal(appSource.includes("₹"), false);
  assert.equal(appSource.includes("Points/Rs"), false);
  assert.equal(appSource.includes("Rs spent"), false);
});

test("Admin Mobile keeps point and INR labels distinct", () => {
  assert.match(appSource, /function formatPoints\(value: number\): string/);
  assert.match(appSource, /QR points/);
  assert.match(appSource, /Points spent/);
  assert.doesNotMatch(appSource, /Required points/);
  assert.doesNotMatch(appSource, /Internal INR/);
});
