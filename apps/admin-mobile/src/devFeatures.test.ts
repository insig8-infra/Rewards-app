import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAdminMobileDevFeatures } from "./devFeatures.js";

test("Admin Mobile dev fallbacks are disabled in production mode", () => {
  const features = resolveAdminMobileDevFeatures({ isDev: false });

  assert.equal(features.allowManualQrEntry, false);
  assert.equal(features.prefillSeededAdminLogin, false);
  assert.equal(features.showMockOtp, false);
});

test("Admin Mobile dev fallbacks are enabled by default in local dev mode", () => {
  const features = resolveAdminMobileDevFeatures({ isDev: true });

  assert.equal(features.allowManualQrEntry, true);
  assert.equal(features.prefillSeededAdminLogin, true);
  assert.equal(features.showMockOtp, true);
});

test("Admin Mobile dev fallbacks can be disabled together for stricter UAT", () => {
  const features = resolveAdminMobileDevFeatures({
    isDev: true,
    env: { EXPO_PUBLIC_ENABLE_DEV_FALLBACKS: "false" },
  });

  assert.equal(features.allowManualQrEntry, false);
  assert.equal(features.prefillSeededAdminLogin, false);
  assert.equal(features.showMockOtp, false);
});

test("Admin Mobile dev fallbacks cannot be enabled in production mode by public env flags", () => {
  const features = resolveAdminMobileDevFeatures({
    isDev: false,
    env: { EXPO_PUBLIC_ENABLE_DEV_FALLBACKS: "true" },
  });

  assert.equal(features.allowManualQrEntry, false);
  assert.equal(features.prefillSeededAdminLogin, false);
  assert.equal(features.showMockOtp, false);
});

test("Admin Mobile dev fallback switches are individually disableable", () => {
  const features = resolveAdminMobileDevFeatures({
    isDev: true,
    env: {
      EXPO_PUBLIC_ENABLE_MANUAL_QR_ENTRY: "0",
      EXPO_PUBLIC_PREFILL_ADMIN_LOGIN: "false",
      EXPO_PUBLIC_SHOW_MOCK_OTP: "off",
    },
  });

  assert.equal(features.allowManualQrEntry, false);
  assert.equal(features.prefillSeededAdminLogin, false);
  assert.equal(features.showMockOtp, false);
});
