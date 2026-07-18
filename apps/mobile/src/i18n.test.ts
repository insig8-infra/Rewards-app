import assert from "node:assert/strict";
import test from "node:test";
import { nextLanguage, t } from "./i18n";

test("language toggle switches between English and Hindi", () => {
  assert.equal(nextLanguage("en"), "hi");
  assert.equal(nextLanguage("hi"), "en");
});

test("required mobile shell copy exists in both languages", () => {
  assert.equal(t("en", "scanHistory"), "Scan History");
  assert.equal(t("hi", "scanHistory"), "स्कैन हिस्ट्री");
  assert.equal(t("en", "recentContractor"), "Recent contractor");
  assert.equal(t("hi", "recentContractor"), "हाल का कॉन्ट्रैक्टर");
  assert.equal(t("en", "balanceBook"), "Balance Book");
  assert.equal(t("hi", "balanceBook"), "बैलेंस बुक");
  assert.equal(t("en", "redeemNow"), "Get Now");
  assert.equal(t("hi", "redeemNow"), "अभी लें");
  assert.equal(t("en", "chosen"), "Claim Raised");
  assert.equal(t("en", "fulfilled"), "Delivered");
  assert.equal(t("en", "eligible"), "Get Now");
  assert.equal(t("en", "contractorAccess"), "Full app");
  assert.equal(t("hi", "contractorAccess"), "फुल ऐप");
});
