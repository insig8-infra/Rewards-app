import test from "node:test";
import assert from "node:assert/strict";
import { isLocalDevPromotionAsset } from "./promotionPresentation";

test("detects local dev promotion placeholder media", () => {
  assert.equal(
    isLocalDevPromotionAsset("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="),
    true,
  );
  assert.equal(isLocalDevPromotionAsset("https://cdn.example.test/promotion.jpg"), false);
  assert.equal(isLocalDevPromotionAsset(undefined), false);
});
