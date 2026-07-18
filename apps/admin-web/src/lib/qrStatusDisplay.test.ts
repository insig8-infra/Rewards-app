import assert from "node:assert/strict";
import test from "node:test";
import { getQrStatusBadgeClassName, getQrStatusDisplayLabel, getQrStatusDisplays } from "./qrStatusDisplay";

test("QR status display labels match approved invoice item statuses", () => {
  assert.equal(getQrStatusDisplayLabel("NOT_PRINTED"), "Not_Printed");
  assert.equal(getQrStatusDisplayLabel("PRINTED_UNCLAIMED"), "Printed");
  assert.equal(getQrStatusDisplayLabel("REPRINTED"), "Reprinted");
  assert.equal(getQrStatusDisplayLabel("SCANNED_CLAIMED"), "Claimed");
  assert.equal(getQrStatusDisplayLabel("CANCELLED"), "Cancelled");
  assert.equal(getQrStatusDisplayLabel("REVERSED"), "Reversed_AND_Cancelled");
});

test("QR status displays keep stable invoice item order and counts", () => {
  const displays = getQrStatusDisplays([
    "REVERSED",
    "PRINTED_UNCLAIMED",
    "NOT_PRINTED",
    "SCANNED_CLAIMED",
    "REPRINTED",
    "PRINTED_UNCLAIMED",
    "CANCELLED",
  ]);

  assert.deepEqual(
    displays.map((display) => [display.label, display.count]),
    [
      ["Not_Printed", 1],
      ["Printed", 2],
      ["Reprinted", 1],
      ["Claimed", 1],
      ["Cancelled", 1],
      ["Reversed_AND_Cancelled", 1],
    ],
  );
});

test("QR status badge class marks high-risk returned statuses distinctly", () => {
  assert.equal(getQrStatusBadgeClassName("NOT_PRINTED"), "badge qr-status");
  assert.equal(getQrStatusBadgeClassName("PRINTED_UNCLAIMED"), "badge qr-status good");
  assert.equal(getQrStatusBadgeClassName("REPRINTED"), "badge qr-status warn");
  assert.equal(getQrStatusBadgeClassName("REVERSED"), "badge qr-status danger");
});
