# Local Database Runbook

## Purpose

Use this runbook when a slice needs a real local PostgreSQL database instead of repository-level in-memory tests.

## Prerequisites

- PostgreSQL running locally or a managed dev PostgreSQL project such as Supabase.
- `DATABASE_URL` set in `.env` or `.env.local`.
- If using Supabase with a placeholder password in `DATABASE_URL`, set `SUPABASE_DATABASE_PASSWORD` separately in `.env.local`; runtime tooling injects it in memory without printing it.
- Example local value:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/volt_rewards
```

## Workflow

From the repository root:

```bash
npm install
cp .env.example .env
npm run prisma:generate --workspace @volt-rewards/api
npm run prisma:validate --workspace @volt-rewards/api
npm run prisma:migrate:dev --workspace @volt-rewards/api
npm run db:seed --workspace @volt-rewards/api
```

Start the API and Admin Web in separate terminals:

```bash
npm run api:start
npm run dev --workspace @volt-rewards/admin-web
```

Runtime ports:

- Admin Web: `http://127.0.0.1:3001`
- API: `http://127.0.0.1:3000/api`
- API health: `http://127.0.0.1:3000/api/health`

Run the runtime gate before marking a slice end-to-end complete:

```bash
npm run runtime:check
```

This gate creates a test contractor through the API, verifies it is returned by the list endpoint with the stored photo value, and verifies QR print actor persistence.

In Codex sandboxed execution, Node `fetch` or PostgreSQL access can fail before reaching the local API or Supabase. If `npm run runtime:check` fails with a transport-level `fetch failed` while `curl http://127.0.0.1:3000/api/health` returns HTTP 200, rerun the same runtime gate with approved network access before accepting the result.

## Migration SQL Without A Live Database

The committed initial SQL migration can be regenerated without connecting to PostgreSQL:

```bash
npm run prisma:migrate:diff --workspace @volt-rewards/api
```

This writes:

```text
apps/api/prisma/migrations/202606220001_init/migration.sql
```

## Seed Data

The seed script creates:

- OWNER `Pratik Shah`
- STAFF `Neha Kulkarni`
- Contractor `Ramesh Sharma`
- Site `Joshi Residence, B-1202, Gulmohar Heights, Andheri West, Mumbai`
- Mock BUSY invoice `INV-1001`
- Realistic electric-shop invoice lines for Havells Wire, Atomberg Fan, and Wipro LED Bulb
- Reward catalog items with replaceable temporary image data URLs
- Unit-level QR placeholders in `NOT_PRINTED` status

The seed does not create active QR tokens. Tokens are generated only by the QR print service so raw QR token values are visible only at print time and are not persisted.

## Guardrails

- Do not point local agent tooling at production data.
- Do not commit `.env`.
- Do not store raw QR token values in seed data, migrations, logs, or database rows.
- Do not call a browser-only render check an end-to-end pass.
- Do not call direct API or hidden-input tests a UI workflow pass. UI-bearing slices need Browser UAT through visible controls at the exact tested URL.
- Admin Web management slices require `npm run runtime:check` or a slice-specific equivalent before completion.
- Run `npm --cache .npm-cache audit --omit=dev` after dependency changes.
