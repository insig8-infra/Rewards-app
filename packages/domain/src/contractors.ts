import { DomainError } from "./types.js";

export interface ContractorProfileInput {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly belongsToNote?: string;
}

export interface NormalizedContractorProfile {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly belongsToNote?: string;
}

export const MAX_CONTRACTOR_PHOTO_DATA_URL_LENGTH = 80_000;
export const MAX_CONTRACTOR_PHOTO_URL_LENGTH = 2_048;
export const MAX_CONTRACTOR_BELONGS_TO_NOTE_LENGTH = 1_000;

export function normalizeContractorProfile(input: ContractorProfileInput): NormalizedContractorProfile {
  const name = input.name.trim().replace(/\s+/g, " ");
  const mobileNumber = normalizeIndianMobileNumber(input.mobileNumber);
  const photoUrl = normalizeContractorPhotoUrl(input.photoUrl);
  const belongsToNote = normalizeContractorBelongsToNote(input.belongsToNote);

  if (name.length < 2) {
    throw new DomainError("CONTRACTOR_NAME_INVALID", "Contractor name is required.");
  }

  return {
    name,
    mobileNumber,
    ...(photoUrl ? { photoUrl } : {}),
    ...(belongsToNote ? { belongsToNote } : {}),
  };
}

export function normalizeIndianMobileNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  const mobileNumber = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
    throw new DomainError("CONTRACTOR_MOBILE_INVALID", "Contractor mobile number must be a valid 10 digit Indian mobile number.");
  }

  return mobileNumber;
}

function normalizeContractorPhotoUrl(input: string | undefined): string | undefined {
  const photoUrl = input?.trim();
  if (!photoUrl) {
    return undefined;
  }

  const maxLength = photoUrl.startsWith("data:image/")
    ? MAX_CONTRACTOR_PHOTO_DATA_URL_LENGTH
    : MAX_CONTRACTOR_PHOTO_URL_LENGTH;
  if (photoUrl.length > maxLength) {
    throw new DomainError("CONTRACTOR_PHOTO_TOO_LARGE", "Contractor photo is too large.");
  }

  return photoUrl;
}

export function normalizeContractorBelongsToNote(input: string | null | undefined): string | undefined {
  const note = input?.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!note) {
    return undefined;
  }
  if (note.length > MAX_CONTRACTOR_BELONGS_TO_NOTE_LENGTH) {
    throw new DomainError(
      "CONTRACTOR_BELONGS_TO_NOTE_TOO_LONG",
      `Contractor association note must be ${MAX_CONTRACTOR_BELONGS_TO_NOTE_LENGTH} characters or fewer.`,
    );
  }
  return note;
}

export function formatContractorCode(sequenceNumber: number): string {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber <= 0) {
    throw new DomainError("CONTRACTOR_CODE_SEQUENCE_INVALID", "Contractor code sequence must be positive.");
  }

  return `CTR-${String(sequenceNumber).padStart(6, "0")}`;
}
