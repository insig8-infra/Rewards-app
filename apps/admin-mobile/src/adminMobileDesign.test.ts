import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(decodeURIComponent(new URL("../App.tsx", import.meta.url).pathname), "utf8");

test("Admin Mobile dashboard keeps an operational command hierarchy", () => {
  assert.match(appSource, /function OperatorSummaryCard/);
  assert.match(appSource, /Scan returned product/);
  assert.match(appSource, /Label removal required/);
  assert.match(appSource, /function CompactQrStatus/);
  assert.match(appSource, /Manager actions/);
  assert.match(appSource, /Staff access/);
  assert.match(appSource, /@react-native-vector-icons\/feather"/);
  assert.doesNotMatch(appSource, /@react-native-vector-icons\/feather\/static/);
  assert.match(appSource, /import \* as Font from "expo-font"/);
  assert.match(appSource, /function useFeatherFontReady/);
  assert.match(appSource, /Font\.loadAsync/);
  assert.match(appSource, /@react-native-vector-icons\/feather\/fonts\/Feather\.ttf/);
  assert.doesNotMatch(appSource, /title\.slice\(0, 1\)\.toUpperCase/);
  assert.doesNotMatch(appSource, /detail="Return Scan"/);
});

test("Admin Mobile Return Scan keeps explicit state and confirmation primitives", () => {
  assert.match(appSource, /function ReturnStep/);
  assert.match(appSource, /function StateCard/);
  assert.match(appSource, /function LightMetric/);
  assert.match(appSource, /Physical label check required/);
  assert.match(appSource, /QR label removed and discarded/);
});

test("Admin Mobile secondary surfaces keep role-aware operational polish", () => {
  assert.doesNotMatch(appSource, /MADM-|WEB-|REP-|PLAT-/);
  assert.doesNotMatch(appSource, /Catalog Management|Catalog readiness|Mobile preview|No export access/);
  assert.match(appSource, /function MiniFact/);
  assert.match(appSource, /function StaffScreen/);
  assert.match(appSource, /Manager controls/);
  assert.match(appSource, /function ReportDownloadButton/);
  assert.match(appSource, /Download center/);
  assert.match(appSource, /downloadReport/);
});
