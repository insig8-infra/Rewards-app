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

  return {
    allowManualQrEntry: isDevBuild && !disableAll && !isFalse(env.EXPO_PUBLIC_ENABLE_MANUAL_QR_ENTRY),
    showMockOtp: isDevBuild && !disableAll && !isFalse(env.EXPO_PUBLIC_SHOW_MOCK_OTP),
  };
}

export function getRuntimeMobileDevFeatures(): MobileDevFeatures {
  return resolveMobileDevFeatures({
    isDev: typeof __DEV__ === "boolean" ? __DEV__ : false,
  });
}

function isFalse(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}
