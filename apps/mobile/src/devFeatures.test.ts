import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveMobileDevFeatures } from "./devFeatures";

test("mobile dev fallbacks are disabled in production mode", () => {
  const features = resolveMobileDevFeatures({ isDev: false });

  assert.equal(features.allowManualQrEntry, false);
  assert.equal(features.showMockOtp, false);
});

test("mobile dev fallbacks are enabled by default in local dev mode", () => {
  const features = resolveMobileDevFeatures({ isDev: true });

  assert.equal(features.allowManualQrEntry, true);
  assert.equal(features.showMockOtp, true);
});

test("mobile dev fallbacks can be disabled together for UAT discipline", () => {
  const features = resolveMobileDevFeatures({
    isDev: true,
    env: { EXPO_PUBLIC_ENABLE_DEV_FALLBACKS: "false" },
  });

  assert.equal(features.allowManualQrEntry, false);
  assert.equal(features.showMockOtp, false);
});

test("mobile dev fallback switches are individually disableable", () => {
  const features = resolveMobileDevFeatures({
    isDev: true,
    env: {
      EXPO_PUBLIC_ENABLE_MANUAL_QR_ENTRY: "0",
      EXPO_PUBLIC_SHOW_MOCK_OTP: "off",
    },
  });

  assert.equal(features.allowManualQrEntry, false);
  assert.equal(features.showMockOtp, false);
});
