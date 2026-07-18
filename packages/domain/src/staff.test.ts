import assert from "node:assert/strict";
import test from "node:test";
import { DomainError, assertValidStaffPin, normalizeStaffProfile } from "./index.js";

test("normalizeStaffProfile trims names and normalizes Indian mobile numbers", () => {
  assert.deepEqual(
    normalizeStaffProfile({
      name: "  Priya   Sharma ",
      mobileNumber: "+91 98765-43210",
    }),
    {
      name: "Priya Sharma",
      mobileNumber: "9876543210",
    },
  );
});

test("normalizeStaffProfile rejects invalid staff names and mobile numbers", () => {
  assert.throws(
    () => normalizeStaffProfile({ name: "Priya", mobileNumber: "12345" }),
    (error) => error instanceof DomainError && error.code === "STAFF_MOBILE_INVALID",
  );

  assert.throws(
    () => normalizeStaffProfile({ name: " P ", mobileNumber: "9876543210" }),
    (error) => error instanceof DomainError && error.code === "STAFF_NAME_INVALID",
  );
});

test("assertValidStaffPin requires exactly four digits", () => {
  assert.doesNotThrow(() => assertValidStaffPin("4821"));

  assert.throws(
    () => assertValidStaffPin("12345"),
    (error) => error instanceof DomainError && error.code === "STAFF_PIN_INVALID",
  );

  assert.throws(
    () => assertValidStaffPin("12a4"),
    (error) => error instanceof DomainError && error.code === "STAFF_PIN_INVALID",
  );
});
