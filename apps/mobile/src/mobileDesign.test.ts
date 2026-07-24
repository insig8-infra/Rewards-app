import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { theme } from "./theme";

describe("mobile design tokens", () => {
  it("keeps high-frequency controls at mobile-safe touch sizes", () => {
    assert.equal(theme.touch.compact, 44);
    assert.equal(theme.touch.control, 48);
    assert.equal(theme.touch.primary, 52);
    assert.ok(theme.touch.bottomTab >= 72);
  });

  it("keeps the Volt mobile typography scale compact and readable", () => {
    assert.equal(theme.typography.title, 28);
    assert.equal(theme.typography.screenTitle, 26);
    assert.equal(theme.typography.sectionHeading, 18);
    assert.equal(theme.typography.cardTitle, 16);
    assert.equal(theme.typography.body, 15);
    assert.equal(theme.typography.metadata, 11);
  });

  it("keeps motion bounded for native-feeling feedback", () => {
    assert.ok(theme.motion.pressMs <= 150);
    assert.ok(theme.motion.sheetMs >= 180 && theme.motion.sheetMs <= 250);
    assert.ok(theme.motion.successMs >= 300 && theme.motion.successMs <= 500);
  });

  it("keeps phone proof dimensions and rail cards bounded", () => {
    assert.equal(theme.layout.minPhoneProofWidth, 360);
    assert.equal(theme.layout.maxPhonePreviewWidth, 480);
    assert.ok(theme.layout.screenGutter >= 16);
    assert.ok(theme.layout.rewardRailTileWidth <= 220);
  });
});
