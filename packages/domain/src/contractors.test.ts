import assert from "node:assert/strict";
import test from "node:test";
import {
  DomainError,
  MAX_CONTRACTOR_PHOTO_DATA_URL_LENGTH,
  MAX_CONTRACTOR_PHOTO_URL_LENGTH,
  formatContractorCode,
  normalizeContractorProfile,
} from "./index.js";

test("normalizeContractorProfile trims names and normalizes Indian mobile numbers", () => {
  assert.deepEqual(
    normalizeContractorProfile({
      name: "  Ramesh   Electricals ",
      mobileNumber: "+91 98765-43210",
      photoUrl: " https://cdn.test/ramesh.jpg ",
    }),
    {
      name: "Ramesh Electricals",
      mobileNumber: "9876543210",
      photoUrl: "https://cdn.test/ramesh.jpg",
    },
  );
});

test("normalizeContractorProfile rejects invalid contractor names and mobile numbers", () => {
  assert.throws(
    () => normalizeContractorProfile({ name: "Ramesh", mobileNumber: "12345" }),
    (error) => error instanceof DomainError && error.code === "CONTRACTOR_MOBILE_INVALID",
  );

  assert.throws(
    () => normalizeContractorProfile({ name: " A ", mobileNumber: "9876543210" }),
    (error) => error instanceof DomainError && error.code === "CONTRACTOR_NAME_INVALID",
  );
});

test("normalizeContractorProfile rejects oversized contractor photo payloads", () => {
  assert.throws(
    () =>
      normalizeContractorProfile({
        name: "Ramesh",
        mobileNumber: "9876543210",
        photoUrl: `data:image/jpeg;base64,${"a".repeat(MAX_CONTRACTOR_PHOTO_DATA_URL_LENGTH)}`,
      }),
    (error) => error instanceof DomainError && error.code === "CONTRACTOR_PHOTO_TOO_LARGE",
  );

  assert.throws(
    () =>
      normalizeContractorProfile({
        name: "Ramesh",
        mobileNumber: "9876543210",
        photoUrl: `https://cdn.test/${"a".repeat(MAX_CONTRACTOR_PHOTO_URL_LENGTH)}.jpg`,
      }),
    (error) => error instanceof DomainError && error.code === "CONTRACTOR_PHOTO_TOO_LARGE",
  );
});

test("formatContractorCode creates stable auto-generated contractor ids", () => {
  assert.equal(formatContractorCode(1), "CTR-000001");
  assert.equal(formatContractorCode(42), "CTR-000042");
});
