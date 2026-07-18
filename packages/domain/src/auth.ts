import { DomainError } from "./types.js";

export function normalizeAuthMobileNumber(input: string): string {
  const compact = input.replace(/[\s-]/g, "");
  const withoutCountryCode = compact.startsWith("+91") ? compact.slice(3) : compact;

  if (!/^[6-9]\d{9}$/.test(withoutCountryCode)) {
    throw new DomainError("AUTH_MOBILE_INVALID", "Mobile number must be a valid 10 digit Indian mobile number.");
  }

  return withoutCountryCode;
}

export function assertValidMpin(mpin: string): void {
  if (!/^\d{4}$/.test(mpin)) {
    throw new DomainError("AUTH_MPIN_INVALID", "MPIN must be exactly 4 digits.");
  }
}

export function assertMatchingMpin(newMpin: string, confirmMpin: string): void {
  assertValidMpin(newMpin);
  if (newMpin !== confirmMpin) {
    throw new DomainError("AUTH_MPIN_MISMATCH", "New MPIN and confirm MPIN must match.");
  }
}

export function assertValidOtp(otp: string): void {
  if (!/^\d{6}$/.test(otp)) {
    throw new DomainError("AUTH_OTP_INVALID", "OTP must be exactly 6 digits.");
  }
}
