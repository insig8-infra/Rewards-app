import assert from "node:assert/strict";
import test from "node:test";
import { normalizeQrScannerData, shouldAcceptQrScannerData } from "./qrScanner.js";

test("normalizeQrScannerData trims QR payloads from camera scans", () => {
  assert.equal(normalizeQrScannerData("  qr-token-1\n"), "qr-token-1");
});

test("shouldAcceptQrScannerData rejects blank or duplicate camera scans", () => {
  assert.equal(shouldAcceptQrScannerData("  ", ""), false);
  assert.equal(shouldAcceptQrScannerData("qr-token-1", "qr-token-1"), false);
  assert.equal(shouldAcceptQrScannerData("qr-token-2", "qr-token-1"), true);
});
