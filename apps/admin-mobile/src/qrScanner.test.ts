import assert from "node:assert/strict";
import test from "node:test";
import { normalizeQrScannerData, shouldAcceptQrScannerData } from "./qrScanner.js";

test("normalizeQrScannerData trims returned-product QR payloads", () => {
  assert.equal(normalizeQrScannerData("\nreturn-token-1 "), "return-token-1");
});

test("shouldAcceptQrScannerData rejects blank or duplicate return QR scans", () => {
  assert.equal(shouldAcceptQrScannerData("", ""), false);
  assert.equal(shouldAcceptQrScannerData("return-token-1", "return-token-1"), false);
  assert.equal(shouldAcceptQrScannerData("return-token-2", "return-token-1"), true);
});
