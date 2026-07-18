# Phase 10 Status - Runtime And Database Gate

Updated: 2026-06-30

## Current Status

Complete after 2026-06-30 correction.

Phase 10 was initially over-claimed as a full runtime gate. The first passing gate proved API health, Supabase connectivity, and direct API contractor persistence, but it did not prove the exact Admin Web browser actor contract. The gate has now been strengthened and rerun.

The Supabase project id is available: `ovysivbhmzdihugfjbov`.

`.env.local` exists and contains `DATABASE_URL` and `SUPABASE_DATABASE_PASSWORD`.

## Required Before Runtime Gate Can Pass

- `DATABASE_URL`: PostgreSQL connection string for application/runtime access.
- For this Phase 10 dev gate, `DATABASE_URL` should be a Supabase direct/session PostgreSQL URL because Prisma CLI currently reads `DATABASE_URL` from `prisma.config.ts`.
- `DIRECT_URL`: optional/future split for deployments where runtime uses a pooled URL and migrations use a direct/session URL.

The Supabase API secret key is not enough for Prisma migrations or direct PostgreSQL access.

## Files Planned For This Phase

- `.planning/v1-agentic-build/PHASE_10_EXECUTION_PLAN.md`
- `.planning/v1-agentic-build/PHASE_10_STATUS.md`
- `.env.example`
- `apps/api/src/env/load-api-env.ts`
- `apps/api/src/main.ts`
- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/prisma.config.ts`
- `apps/api/prisma/seed.ts`
- `tools/verify-local-runtime.mjs`

## Completed

- Added Phase 10 execution plan.
- Added API env loader that reads root `.env` and `.env.local`.
- Wired env loading into API startup, Prisma service, Prisma seed, Prisma config, and runtime checker.
- Added `DIRECT_URL`, `SUPABASE_PROJECT_ID`, and `SUPABASE_SECRET_KEY` placeholders to `.env.example`.
- Updated runtime checker to fail clearly when `DATABASE_URL` is missing.
- Added `prisma:migrate:deploy` script for applying existing migrations to the Supabase dev database.
- Added support for keeping the Supabase database password in `SUPABASE_DATABASE_PASSWORD`; runtime tooling applies it to `DATABASE_URL` in memory without printing it.
- Applied Prisma migration `202606220001_init` to Supabase.
- Seeded demo OWNER, STAFF, contractor, site, invoice, invoice lines, and QR placeholders.
- Started API on `127.0.0.1:3000`.
- Started Admin Web on `127.0.0.1:3001`.
- Fixed runtime checker to use the seeded OWNER user id for audited contractor creation.
- Fixed runtime checker response parsing so success bodies are not consumed by assertion messages.
- Added deterministic seeded Admin Web dev actors:
  - `dev-owner-user`
  - `dev-staff-user`
- Updated runtime checker to assert those exact Admin Web dev actors exist in Supabase.
- Updated runtime checker to create contractors using `dev-owner-user`, matching the browser header contract.
- Extended runtime checker to create a runtime invoice/line/QR unit and verify QR print persistence through the API, including `QrUnit.printedByUserId`.
- Added client-side contractor photo normalization so real device uploads are stored as small profile-image data URLs during the local/data-URL phase.
- Added domain validation to reject oversized inline contractor photo payloads.

## Verification

- `node --check tools/verify-local-runtime.mjs` passed.
- `npm run typecheck` passed.
- `npm test` passed: 52 tests.
- `npm run lint` passed.
- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- Initial `npm run runtime:check` failed as expected when `DATABASE_URL` was missing from `.env.local`.
- After `DATABASE_URL` was added, `npm run prisma:migrate:deploy --workspace @volt-rewards/api` reached Supabase with network approval but failed with Prisma `P1000` authentication failure.
- A direct `pg` connection probe failed with PostgreSQL `28P01 password authentication failed for user "postgres"`.
- After adding `SUPABASE_DATABASE_PASSWORD`, `npm run prisma:migrate:deploy --workspace @volt-rewards/api` passed.
- `npm run db:seed --workspace @volt-rewards/api` passed.
- `npm run runtime:check` passed.
- 2026-07-01 rerun note: in the default sandbox, Node `fetch` can fail before reaching the local API even when `curl` to API/Admin Web returns HTTP 200. The runtime gate must be rerun with approved network access before accepting or rejecting the gate.
- `curl http://127.0.0.1:3000/api/health` returned HTTP 200.
- `curl http://127.0.0.1:3001` returned HTTP 200.
- Reproduction before correction:
  - `POST /api/admin-web/contractors` with `x-actor-user-id: dev-owner-user` returned HTTP 500 because `AuditEvent.actorUserId` referenced a non-existent user.
  - API logs also showed QR print failing on `QrUnit.printedByUserId_fkey` for the same dev actor problem.
  - Browser upload of a 761,855 byte JPEG as a raw data URL caused a Prisma interactive transaction timeout.
- Verification after correction:
  - The same Admin Web-style contractor create request with `dev-owner-user` returned HTTP 201.
  - `npm run runtime:check` passed with API, database, contractor persistence, and QR actor paths.
  - Browser UAT on `/contractors` uploaded `Sample_References/SCR-20260622-ooce.jpeg`, received HTTP 201, persisted a 15,255 character compressed `data:image/jpeg` value, and showed the new contractor in the visible list.
- `npm run typecheck` passed.
- `npm test` passed: 53 tests.
- `npm run lint` passed.

## Residual Risk

- Supabase is currently the dev database provider, but final managed database/provider choice remains governed by `DEC-022`.
- `.env.local` must remain uncommitted.
- API and Admin Web are running in this session; if the terminal sessions stop, restart them before browser/UAT checks.
- Contractor photos are still stored as compressed inline data URLs for local workflow continuity. Production should move profile photos to object storage/media service before launch.
