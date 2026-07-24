import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

interface ExpoAppConfig {
  readonly expo?: {
    readonly ios?: {
      readonly bundleIdentifier?: string;
      readonly buildNumber?: string;
      readonly infoPlist?: Record<string, unknown>;
    };
    readonly icon?: string;
    readonly splash?: {
      readonly image?: string;
      readonly resizeMode?: string;
      readonly backgroundColor?: string;
    };
    readonly android?: {
      readonly package?: string;
      readonly versionCode?: number;
      readonly permissions?: readonly string[];
      readonly adaptiveIcon?: {
        readonly foregroundImage?: string;
        readonly backgroundColor?: string;
      };
    };
    readonly plugins?: readonly unknown[];
  };
}

interface EasConfig {
  readonly build?: {
    readonly production?: {
      readonly autoIncrement?: boolean;
      readonly android?: { readonly buildType?: string };
      readonly ios?: { readonly simulator?: boolean };
    };
  };
}

const appConfig = JSON.parse(readFileSync(decodeURIComponent(new URL("../app.json", import.meta.url).pathname), "utf8")) as ExpoAppConfig;
const easConfig = JSON.parse(readFileSync(decodeURIComponent(new URL("../eas.json", import.meta.url).pathname), "utf8")) as EasConfig;

test("Volt Admin declares iOS and Android release identifiers", () => {
  assert.equal(appConfig.expo?.ios?.bundleIdentifier, "com.insig8.voltadmin");
  assert.equal(appConfig.expo?.ios?.buildNumber, "1");
  assert.equal(appConfig.expo?.android?.package, "com.insig8.voltadmin");
  assert.equal(appConfig.expo?.android?.versionCode, 1);
});

test("Volt Admin declares native camera permission config for return QR scan", () => {
  assert.match(String(appConfig.expo?.ios?.infoPlist?.NSCameraUsageDescription ?? ""), /returned product QR labels/i);
});

test("Volt Admin configures SecureStore native backup handling", () => {
  const secureStorePlugin = findPlugin(appConfig.expo?.plugins ?? [], "expo-secure-store");
  assert.ok(secureStorePlugin);
  assert.equal(secureStorePlugin.options.configureAndroidBackup, true);
});

test("Volt Admin configures Expo Camera for return QR scanning without microphone access", () => {
  const cameraPlugin = findPlugin(appConfig.expo?.plugins ?? [], "expo-camera");
  assert.ok(cameraPlugin);
  assert.match(String(cameraPlugin.options.cameraPermission ?? ""), /returned product QR labels/i);
  assert.equal(cameraPlugin.options.microphonePermission, false);
  assert.equal(cameraPlugin.options.recordAudioAndroid, false);
  assert.equal(cameraPlugin.options.barcodeScannerEnabled, true);
});

test("Volt Admin configures native photo-library permission copy for ImagePicker", () => {
  const imagePickerPlugin = findPlugin(appConfig.expo?.plugins ?? [], "expo-image-picker");
  assert.ok(imagePickerPlugin);
  assert.match(String(imagePickerPlugin.options.photosPermission ?? ""), /contractor and staff photos/i);
  assert.equal(imagePickerPlugin.options.microphonePermission, false);
});

test("Volt Admin production EAS profile targets Android and iOS release builds", () => {
  assert.equal(easConfig.build?.production?.autoIncrement, true);
  assert.equal(easConfig.build?.production?.android?.buildType, "app-bundle");
  assert.equal(easConfig.build?.production?.ios?.simulator, false);
});

test("Volt Admin references local PNG icon and splash assets", () => {
  assert.equal(appConfig.expo?.icon, "./assets/icon.png");
  assert.equal(appConfig.expo?.splash?.image, "./assets/splash.png");
  assert.equal(appConfig.expo?.splash?.resizeMode, "contain");
  assert.equal(appConfig.expo?.splash?.backgroundColor, "#F1F8F7");
  assert.equal(appConfig.expo?.android?.adaptiveIcon?.foregroundImage, "./assets/adaptive-foreground.png");
  assert.equal(appConfig.expo?.android?.adaptiveIcon?.backgroundColor, "#00535B");

  assert.deepEqual(readPngDimensions("../assets/icon.png"), { width: 1024, height: 1024 });
  assert.deepEqual(readPngDimensions("../assets/adaptive-foreground.png"), { width: 1024, height: 1024 });
  assert.deepEqual(readPngDimensions("../assets/splash.png"), { width: 1242, height: 2436 });
});

function findPlugin(plugins: readonly unknown[], pluginName: string): { readonly options: Record<string, unknown> } | null {
  for (const plugin of plugins) {
    if (plugin === pluginName) {
      return { options: {} };
    }
    if (Array.isArray(plugin) && plugin[0] === pluginName) {
      return {
        options: typeof plugin[1] === "object" && plugin[1] !== null ? plugin[1] as Record<string, unknown> : {},
      };
    }
  }
  return null;
}

function readPngDimensions(relativePath: string): { readonly width: number; readonly height: number } {
  const png = readFileSync(decodeURIComponent(new URL(relativePath, import.meta.url).pathname));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.subarray(12, 16).toString("ascii"), "IHDR");
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}
