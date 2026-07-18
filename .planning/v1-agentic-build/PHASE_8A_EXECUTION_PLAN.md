# Phase 8A Execution Plan - Runtime Persistence Gate Correction

## Goal

Correct the Phase 8 drift from implementation-level verification to true runtime verification. A management slice cannot be treated as complete until the Admin Web, API, and database path works end to end.

## Why This Exists

Phase 8 delivered contractor-management code and UI, but the browser workflow was not persisted through a live API/database during verification. That violated the agentic engineering rule in `AGENTS.md`: slices must be verified against the affected domain rules, data model, APIs, UI surfaces, tests, and security gates.

## Source Requirements

- AGENTS.md Required Workflow
- WEB-002
- WEB-003
- WEB-014
- WEB-015
- MADM-017 through MADM-023
- SECURITY_AND_EVALUATION_PLAN.md CI/runtime gates

## Tasks

- [x] Correct Admin Web API base URL to use the API global prefix: `http://127.0.0.1:3000/api`.
- [x] Add CORS configuration for Admin Web origins.
- [x] Add `.env.example` values for `CORS_ORIGIN` and `NEXT_PUBLIC_API_BASE_URL`.
- [x] Add a local runtime gate script that verifies:
  - API health.
  - Database connectivity.
  - Contractor create through API.
  - Contractor list returns the persisted contractor and photo value.
- [x] Add test coverage for the Admin Web default API base URL.
- [x] Update runtime/database runbook.
- [x] Mark Phase 8 persistence as blocked until the runtime gate passes.

## Out Of Scope

- Installing PostgreSQL on the developer machine.
- Choosing production media storage.
- Implementing object storage uploads.
- Staff management.

## Acceptance Criteria

- Static verification still passes: typecheck, tests, lint, Prisma validate, Admin Web build, audit.
- `npm run runtime:check` exists and fails clearly when API or DB is unavailable.
- Contractor management is not called end-to-end complete until `npm run runtime:check` passes against a live API and database.

## Current Runtime Result

`npm run runtime:check` currently fails because the API is not listening on `127.0.0.1:3000`.

The local machine also does not currently expose `psql` or `docker` on PATH, so local PostgreSQL setup is not yet verified from this session.

## Next Required Step

Before staff management or any new feature slice:

1. Install/start local PostgreSQL or provide a reachable dev PostgreSQL URL.
2. Create `.env` from `.env.example`.
3. Run migrations and seed.
4. Start API on `127.0.0.1:3000`.
5. Run `npm run runtime:check`.
6. Only then restore Phase 8 to end-to-end complete.
