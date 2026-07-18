import assert from "node:assert/strict";
import test from "node:test";
import { ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import {
  assertBusyIntegrationCredentials,
  BUSY_INTEGRATION_API_KEY_HEADER,
  BUSY_INTEGRATION_CLIENT_ID_HEADER,
} from "./busy-integration-auth.js";

test("BUSY integration credentials pass with configured client id and API key", () => {
  withBusyCredentialEnv(() => {
    const result = assertBusyIntegrationCredentials({
      [BUSY_INTEGRATION_CLIENT_ID_HEADER]: "busy-test-client",
      [BUSY_INTEGRATION_API_KEY_HEADER]: "busy-test-key",
    });

    assert.deepEqual(result, { clientId: "busy-test-client" });
  });
});

test("BUSY integration credentials reject missing server configuration", () => {
  withBusyCredentialEnv(() => {
    delete process.env.BUSY_INTEGRATION_CLIENT_ID;

    assert.throws(
      () =>
        assertBusyIntegrationCredentials({
          [BUSY_INTEGRATION_CLIENT_ID_HEADER]: "busy-test-client",
          [BUSY_INTEGRATION_API_KEY_HEADER]: "busy-test-key",
        }),
      ServiceUnavailableException,
    );
  });
});

test("BUSY integration credentials reject invalid API key", () => {
  withBusyCredentialEnv(() => {
    assert.throws(
      () =>
        assertBusyIntegrationCredentials({
          [BUSY_INTEGRATION_CLIENT_ID_HEADER]: "busy-test-client",
          [BUSY_INTEGRATION_API_KEY_HEADER]: "wrong-key",
        }),
      UnauthorizedException,
    );
  });
});

function withBusyCredentialEnv(run: () => void): void {
  const originalClientId = process.env.BUSY_INTEGRATION_CLIENT_ID;
  const originalApiKey = process.env.BUSY_INTEGRATION_API_KEY;
  process.env.BUSY_INTEGRATION_CLIENT_ID = "busy-test-client";
  process.env.BUSY_INTEGRATION_API_KEY = "busy-test-key";
  try {
    run();
  } finally {
    restoreEnv("BUSY_INTEGRATION_CLIENT_ID", originalClientId);
    restoreEnv("BUSY_INTEGRATION_API_KEY", originalApiKey);
  }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

