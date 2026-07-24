declare const __DEV__: boolean | undefined;

export interface DevFeatureInput {
  readonly isDev?: boolean;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

export interface MobileDevFeatures {
  readonly allowManualQrEntry: boolean;
  readonly showMockOtp: boolean;
}

export function resolveMobileDevFeatures(input: DevFeatureInput = {}): MobileDevFeatures {
  const isDevBuild = input.isDev === true;
  const env = input.env ?? {};
  const disableAll = isFalse(env.EXPO_PUBLIC_ENABLE_DEV_FALLBACKS);
  const explicitEnableAll = isTrue(env.EXPO_PUBLIC_ENABLE_DEV_FALLBACKS);
  const canUseDevFallbacks = isDevBuild || explicitEnableAll;

  return {
    allowManualQrEntry: canUseDevFallbacks && !disableAll && !isFalse(env.EXPO_PUBLIC_ENABLE_MANUAL_QR_ENTRY),
    showMockOtp: canUseDevFallbacks && !disableAll && !isFalse(env.EXPO_PUBLIC_SHOW_MOCK_OTP),
  };
}

export function getRuntimeMobileDevFeatures(): MobileDevFeatures {
  return resolveMobileDevFeatures({
    isDev: typeof __DEV__ === "boolean" ? __DEV__ : false,
    env: readRuntimeEnv(),
  });
}

function readRuntimeEnv(): Readonly<Record<string, string | undefined>> {
  return {
    EXPO_PUBLIC_ENABLE_DEV_FALLBACKS: process.env.EXPO_PUBLIC_ENABLE_DEV_FALLBACKS,
    EXPO_PUBLIC_ENABLE_MANUAL_QR_ENTRY: process.env.EXPO_PUBLIC_ENABLE_MANUAL_QR_ENTRY,
    EXPO_PUBLIC_SHOW_MOCK_OTP: process.env.EXPO_PUBLIC_SHOW_MOCK_OTP,
  };
}

function isFalse(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

function isTrue(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
