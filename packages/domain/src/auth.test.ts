import assert from "node:assert/strict";
import test from "node:test";
import { assertMatchingMpin, assertValidMpin, assertValidOtp, normalizeAuthMobileNumber } from "./auth.js";
import { DomainError } from "./types.js";

test("normalizeAuthMobileNumber accepts 10 digit and +91 mobile numbers", () => {
  assert.equal(normalizeAuthMobileNumber("98765 43210"), "9876543210");
  assert.equal(normalizeAuthMobileNumber("+919876543210"), "9876543210");
});

test("normalizeAuthMobileNumber rejects invalid mobile numbers", () => {
  assert.throws(
    () => normalizeAuthMobileNumber("12345"),
    (error) => error instanceof DomainError && error.code === "AUTH_MOBILE_INVALID",
  );
});

test("assertValidMpin requires exactly four digits", () => {
  assert.doesNotThrow(() => assertValidMpin("1234"));
  assert.throws(
    () => assertValidMpin("12345"),
    (error) => error instanceof DomainError && error.code === "AUTH_MPIN_INVALID",
  );
});

test("assertMatchingMpin requires matching valid MPIN values", () => {
  assert.doesNotThrow(() => assertMatchingMpin("4321", "4321"));
  assert.throws(
    () => assertMatchingMpin("4321", "1234"),
    (error) => error instanceof DomainError && error.code === "AUTH_MPIN_MISMATCH",
  );
});

test("assertValidOtp requires exactly six digits", () => {
  assert.doesNotThrow(() => assertValidOtp("123456"));
  assert.throws(
    () => assertValidOtp("1234"),
    (error) => error instanceof DomainError && error.code === "AUTH_OTP_INVALID",
  );
});
