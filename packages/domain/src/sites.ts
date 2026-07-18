import { DomainError } from "./types.js";

export interface SiteProfileInput {
  readonly clientName: string;
  readonly flatOrApartmentNo?: string;
  readonly buildingName?: string;
  readonly area?: string;
  readonly city?: string;
}

export interface NormalizedSiteProfile {
  readonly clientName: string;
  readonly flatOrApartmentNo?: string;
  readonly buildingName?: string;
  readonly area?: string;
  readonly city?: string;
}

const maxFieldLength = 120;

export function normalizeSiteProfile(input: SiteProfileInput): NormalizedSiteProfile {
  const clientName = normalizeRequiredField(input.clientName, "SITE_CLIENT_NAME_INVALID");

  return {
    clientName,
    ...normalizeOptionalField("flatOrApartmentNo", input.flatOrApartmentNo),
    ...normalizeOptionalField("buildingName", input.buildingName),
    ...normalizeOptionalField("area", input.area),
    ...normalizeOptionalField("city", input.city),
  };
}

function normalizeRequiredField(value: string, errorCode: string): string {
  const normalized = normalizeText(value);
  if (!normalized || normalized.length > maxFieldLength) {
    throw new DomainError(errorCode, "Site field is required and must be 120 characters or fewer.");
  }
  return normalized;
}

function normalizeOptionalField<Key extends keyof NormalizedSiteProfile>(
  key: Key,
  value: string | undefined,
): Partial<Pick<NormalizedSiteProfile, Key>> {
  const normalized = normalizeText(value ?? "");
  if (!normalized) {
    return {};
  }
  if (normalized.length > maxFieldLength) {
    throw new DomainError("SITE_FIELD_TOO_LONG", "Site fields must be 120 characters or fewer.");
  }
  return { [key]: normalized } as Partial<Pick<NormalizedSiteProfile, Key>>;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
