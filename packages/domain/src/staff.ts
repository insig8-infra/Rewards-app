import { DomainError } from "./types.js";

export interface StaffProfileInput {
  readonly name: string;
  readonly mobileNumber: string;
}

export interface NormalizedStaffProfile {
  readonly name: string;
  readonly mobileNumber: string;
}

export function normalizeStaffProfile(input: StaffProfileInput): NormalizedStaffProfile {
  const name = input.name.trim().replace(/\s+/g, " ");
  const mobileNumber = normalizeStaffMobileNumber(input.mobileNumber);

  if (name.length < 2) {
    throw new DomainError("STAFF_NAME_INVALID", "Staff name is required.");
  }

  return {
    name,
    mobileNumber,
  };
}

export function normalizeStaffMobileNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  const mobileNumber = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
    throw new DomainError("STAFF_MOBILE_INVALID", "Staff mobile number must be a valid 10 digit Indian mobile number.");
  }

  return mobileNumber;
}

export function assertValidStaffPin(pin: string): void {
  if (!/^\d{4}$/.test(pin)) {
    throw new DomainError("STAFF_PIN_INVALID", "Staff PIN must be a 4 digit number.");
  }
}
