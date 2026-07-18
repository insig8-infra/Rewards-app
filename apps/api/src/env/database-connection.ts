const localDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/volt_rewards";

export function applyDatabaseConnectionEnv(): void {
  if (applyNeonDatabaseConnection()) {
    return;
  }

  applySupabaseDatabaseConnection();
}

export function getPrismaCliDatabaseUrl(): string {
  applyDatabaseConnectionEnv();
  return process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? localDatabaseUrl;
}

export function getRuntimeDatabaseUrl(): string {
  applyDatabaseConnectionEnv();
  return process.env.DATABASE_URL ?? localDatabaseUrl;
}

function applyNeonDatabaseConnection(): boolean {
  const neonRuntimeUrl = normalizePostgresUrl(process.env.NEON_CONNECTION_STRING);
  if (!neonRuntimeUrl) {
    return false;
  }

  process.env.DATABASE_URL = neonRuntimeUrl;

  const neonDirectUrl = normalizePostgresUrl(process.env.NEON_DIRECT_URL);
  if (neonDirectUrl) {
    process.env.DIRECT_URL = neonDirectUrl;
  } else {
    process.env.DIRECT_URL = process.env.DIRECT_URL ?? neonRuntimeUrl;
  }

  return true;
}

function applySupabaseDatabaseConnection(): void {
  const supabaseDatabaseUrl = buildSupabaseDatabaseUrl();
  if (supabaseDatabaseUrl) {
    process.env.DATABASE_URL = supabaseDatabaseUrl;
    process.env.DIRECT_URL = process.env.DIRECT_URL ?? supabaseDatabaseUrl;
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const databasePassword = process.env.SUPABASE_DATABASE_PASSWORD;

  if (!databaseUrl || !databasePassword) {
    return;
  }

  const parsedUrl = new URL(databaseUrl);
  parsedUrl.password = databasePassword;
  process.env.DATABASE_URL = parsedUrl.toString();
  process.env.DIRECT_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
}

function buildSupabaseDatabaseUrl(): string | undefined {
  const host = process.env.SUPABASE_POOLER_HOST;
  const user = process.env.SUPABASE_DATABASE_USER;
  const password = process.env.SUPABASE_DATABASE_PASSWORD;
  const databaseName = process.env.SUPABASE_DATABASE_NAME ?? "postgres";
  const port = process.env.SUPABASE_DATABASE_PORT ?? "5432";
  const sslMode = process.env.SUPABASE_DATABASE_SSLMODE ?? "require";
  const useLibpqCompat = process.env.SUPABASE_DATABASE_USE_LIBPQ_COMPAT === "true";

  if (!host || !user || !password) {
    return undefined;
  }

  const url = new URL(`postgresql://placeholder:placeholder@${host}:${port}/${databaseName}`);
  url.username = user;
  url.password = password;
  if (sslMode) {
    url.searchParams.set("sslmode", sslMode);
  }
  if (useLibpqCompat) {
    url.searchParams.set("uselibpqcompat", "true");
  }
  return url.toString();
}

function normalizePostgresUrl(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  if (/^postgres(ql)?:\/\//.test(normalized)) {
    return normalized;
  }

  const embeddedUrl = normalized.match(/postgres(ql)?:\/\/[^\s'"]+/)?.[0];
  return embeddedUrl;
}
