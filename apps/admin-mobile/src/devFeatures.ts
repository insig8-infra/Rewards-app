declare const __DEV__: boolean | undefined;

export interface DevFeatureInput {
  readonly isDev?: boolean;
  readonly env?: Readonly<Record<string, string | undefined>>;
}

export interface AdminMobileDevFeatures {
  readonly allowManualQrEntry: boolean;
  readonly prefillSeededAdminLogin: boolean;
  readonly showMockOtp: boolean;
}

export function resolveAdminMobileDevFeatures(input: DevFeatureInput = {}): AdminMobileDevFeatures {
  const isDevBuild = input.isDev === true;
  const env = input.env ?? {};
  const disableAll = isFalse(env.EXPO_PUBLIC_ENABLE_DEV_FALLBACKS);
  const canUseDevFallbacks = isDevBuild && !disableAll;

  return {
    allowManualQrEntry: canUseDevFallbacks && !isFalse(env.EXPO_PUBLIC_ENABLE_MANUAL_QR_ENTRY),
    prefillSeededAdminLogin: canUseDevFallbacks && !isFalse(env.EXPO_PUBLIC_PREFILL_ADMIN_LOGIN),
    showMockOtp: canUseDevFallbacks && !isFalse(env.EXPO_PUBLIC_SHOW_MOCK_OTP),
  };
}

export function getRuntimeAdminMobileDevFeatures(): AdminMobileDevFeatures {
  return resolveAdminMobileDevFeatures({
    isDev: typeof __DEV__ === "boolean" ? __DEV__ : false,
    env: readRuntimeEnv(),
  });
}

function readRuntimeEnv(): Readonly<Record<string, string | undefined>> {
  return {
    EXPO_PUBLIC_ENABLE_DEV_FALLBACKS: process.env.EXPO_PUBLIC_ENABLE_DEV_FALLBACKS,
    EXPO_PUBLIC_ENABLE_MANUAL_QR_ENTRY: process.env.EXPO_PUBLIC_ENABLE_MANUAL_QR_ENTRY,
    EXPO_PUBLIC_PREFILL_ADMIN_LOGIN: process.env.EXPO_PUBLIC_PREFILL_ADMIN_LOGIN,
    EXPO_PUBLIC_SHOW_MOCK_OTP: process.env.EXPO_PUBLIC_SHOW_MOCK_OTP,
  };
}

function isFalse(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}
