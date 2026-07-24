import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(decodeURIComponent(new URL("../App.tsx", import.meta.url).pathname), "utf8");

test("End-user MPIN reveal controls use an icon-only accessible button", () => {
  assert.match(appSource, /function SecretVisibilityButton/);
  assert.match(appSource, /accessibilityLabel=\{visibilityLabel\}/);
  assert.match(appSource, /@react-native-vector-icons\/feather"/);
  assert.doesNotMatch(appSource, /@react-native-vector-icons\/feather\/static/);
  assert.match(appSource, /Font\.loadAsync/);
  assert.match(appSource, /props\.visible \? "eye-off" : "eye"/);
  assert.doesNotMatch(appSource, /styles\.eyeShape|styles\.eyePupil|styles\.eyeSlash/);
  assert.doesNotMatch(appSource, /<Text style=\{styles\.secureRevealText\}>/);
  assert.doesNotMatch(appSource, /<Text style=\{styles\.pinRevealText\}>/);
});

test("Contractor login and profile MPIN fields share the icon reveal control", () => {
  const secretVisibilityUsages = appSource.match(/<SecretVisibilityButton/g) ?? [];
  assert.ok(secretVisibilityUsages.length >= 2);
  assert.match(appSource, /fieldLabel=\{props\.label\}/);
  assert.match(appSource, /revealLabel=\{props\.revealLabel/);
  assert.match(appSource, /hideLabel=\{props\.hideLabel/);
});
