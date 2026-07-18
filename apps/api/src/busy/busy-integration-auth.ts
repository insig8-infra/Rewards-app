import { ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";

export const BUSY_INTEGRATION_CLIENT_ID_HEADER = "x-volt-client-id";
export const BUSY_INTEGRATION_API_KEY_HEADER = "x-volt-api-key";

export interface BusyIntegrationAuthResult {
  readonly clientId: string;
}

export function assertBusyIntegrationCredentials(
  headers: Record<string, string | string[] | undefined>,
): BusyIntegrationAuthResult {
  const expectedClientId = process.env.BUSY_INTEGRATION_CLIENT_ID?.trim();
  const expectedApiKey = process.env.BUSY_INTEGRATION_API_KEY?.trim();

  if (!expectedClientId || !expectedApiKey) {
    throw new ServiceUnavailableException({
      code: "BUSY_INTEGRATION_NOT_CONFIGURED",
      message: "BUSY integration credentials are not configured.",
    });
  }

  const clientId = getSingleHeader(headers, BUSY_INTEGRATION_CLIENT_ID_HEADER);
  const apiKey = getSingleHeader(headers, BUSY_INTEGRATION_API_KEY_HEADER);

  if (!clientId || !apiKey || !secureEquals(clientId, expectedClientId) || !secureEquals(apiKey, expectedApiKey)) {
    throw new UnauthorizedException({
      code: "BUSY_INTEGRATION_UNAUTHORIZED",
      message: "BUSY integration credentials are invalid.",
    });
  }

  return { clientId };
}

function getSingleHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const direct = headers[name] ?? headers[name.toLowerCase()];
  const value = direct ?? findHeaderCaseInsensitive(headers, name);
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function findHeaderCaseInsensitive(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | string[] | undefined {
  const normalizedName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === normalizedName) {
      return value;
    }
  }
  return undefined;
}

function secureEquals(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
