import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnvFile } from "dotenv";
import { applyDatabaseConnectionEnv } from "./database-connection.js";

const moduleDir = dirname(fileURLToPath(import.meta.url));

export function loadApiEnv(): void {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "../..", ".env"),
    resolve(process.cwd(), "../..", ".env.local"),
    resolve(moduleDir, "../../../.env"),
    resolve(moduleDir, "../../../.env.local"),
  ];

  const loaded = new Set<string>();
  for (const envPath of candidates) {
    if (!existsSync(envPath) || loaded.has(envPath)) {
      continue;
    }

    loaded.add(envPath);
    loadEnvFile({
      path: envPath,
      override: envPath.endsWith(".env.local"),
    });
  }

  applyDatabaseConnectionEnv();
}
