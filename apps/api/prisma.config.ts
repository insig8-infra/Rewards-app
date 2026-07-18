import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
import { getPrismaCliDatabaseUrl } from "./src/env/database-connection.js";

const envCandidates = [
  resolve(import.meta.dirname, "../../.env"),
  resolve(import.meta.dirname, "../../.env.local"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), ".env.local"),
];

const loaded = new Set<string>();
for (const envPath of envCandidates) {
  if (!existsSync(envPath) || loaded.has(envPath)) {
    continue;
  }

  loaded.add(envPath);
  loadEnv({
    path: envPath,
    override: envPath.endsWith(".env.local"),
  });
}

const prismaCliDatabaseUrl = getPrismaCliDatabaseUrl();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: prismaCliDatabaseUrl,
  },
});
