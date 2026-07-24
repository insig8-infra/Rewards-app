import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(decodeURIComponent(new URL("../App.tsx", import.meta.url).pathname), "utf8");

test("mobile icons use the dynamic-font capable Feather import instead of the brittle static import", () => {
  assert.match(appSource, /@react-native-vector-icons\/feather"/);
  assert.doesNotMatch(appSource, /@react-native-vector-icons\/feather\/static/);
  assert.match(appSource, /import \* as Font from "expo-font"/);
  assert.match(appSource, /function useFeatherFontReady/);
  assert.match(appSource, /Font\.loadAsync/);
  assert.match(appSource, /@react-native-vector-icons\/feather\/fonts\/Feather\.ttf/);
});

test("reward image cards fall back to a designed illustration when media fails to load", () => {
  assert.match(appSource, /function RewardImage/);
  assert.match(appSource, /const \[imageFailed, setImageFailed\] = useState\(false\)/);
  assert.match(appSource, /onError=\{\(\) => setImageFailed\(true\)\}/);
  assert.match(appSource, /styles\.rewardIllustrationFrame/);
});
