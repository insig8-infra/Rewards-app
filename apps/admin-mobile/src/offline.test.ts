import assert from "node:assert/strict";
import test from "node:test";
import {
  isLikelyNetworkFailure,
  isOfflineNetworkState,
  normalizeNetworkError,
  NO_INTERNET_MESSAGE,
} from "./offline.js";

test("isOfflineNetworkState detects disconnected or unreachable internet states", () => {
  assert.equal(isOfflineNetworkState({ isConnected: false, isInternetReachable: true }), true);
  assert.equal(isOfflineNetworkState({ isConnected: true, isInternetReachable: false }), true);
  assert.equal(isOfflineNetworkState({ isConnected: true, isInternetReachable: true }), false);
  assert.equal(isOfflineNetworkState({ isConnected: null, isInternetReachable: null }), false);
});

test("normalizeNetworkError maps fetch network failures to required no-internet copy", () => {
  assert.equal(isLikelyNetworkFailure(new TypeError("Failed to fetch")), true);
  assert.equal(normalizeNetworkError(new TypeError("Failed to fetch")).message, NO_INTERNET_MESSAGE);
  assert.equal(normalizeNetworkError(new Error("QR lookup failed")).message, "QR lookup failed");
});
