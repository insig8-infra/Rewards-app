# Phase 31 Plan - Neon Test Database Migration

Status: Complete - Output And Trajectory Gates Passed  
Created: 2026-07-17  
Source: User-created Neon project and decision to prepare a real Test API Deployment before BUSY connector testing

## Intent

Move the development/test database target from the current Supabase pooler override to Neon Postgres before UAT and BUSY connector testing. This phase uses a clean Neon database initialized by Prisma migrations and seed data, not a Supabase dump/restore, unless verification proves existing data must be preserved.

## Requirements Covered

- `WEB-019`, `WEB-020`, `WEB-023`: BUSY receiver needs a real backend database behind the Test API.
- `ITEM-001` through `ITEM-009`: ItemCodes must persist correctly on the selected managed Postgres provider.
- `RWD-023`, `QR-019`, `QR-020`: QR points/returns behavior must keep working after provider switch.
- Architecture DEC-022: managed PostgreSQL provider selection must be deliberate, not implicit Supabase lock-in.
- Architecture DEC-052: media remains local for development/test until storage is separately selected and verified.

## Context Read

- `OPEN_QUESTIONS.md`
- `architecture/DECISIONS.md` DEC-022, DEC-022A, DEC-052
- `PHASE_30_STATUS.md`
- Current API env loaders and Prisma config
- Neon Prisma migration documentation via Context7

## Open Questions Review

Resolved for this phase:

1. Use Neon Postgres for the next test/staging database path.
2. Use a clean database initialized by Prisma migrations and seed for pre-UAT connector testing.
3. Use Neon pooled connection for API runtime and Neon direct connection for Prisma CLI/schema operations.
4. Keep media in local placeholder mode for this phase; object storage provider selection remains separate.

Still deferred:

1. Final production hosting provider for the API.
2. Final production object storage provider and media egress strategy.
3. BUSY connector credentials and public Test API deployment URL.

## Output Eval Criteria

1. Env loading prefers Neon when `NEON_CONNECTION_STRING` is present, even if old Supabase env vars remain in `.env.local`.
2. `DATABASE_URL` resolves to Neon pooled connection and `DIRECT_URL` resolves to Neon direct connection.
3. Prisma migrations apply cleanly to Neon.
4. Seed runs cleanly against Neon.
5. API tests pass with Neon-preferring config.
6. Database readback confirms core seeded tables exist on Neon.
7. Documentation records the provider decision and residual storage/deployment gaps.

## Trajectory Eval Criteria

1. No secrets are printed or committed.
2. Phase does not conflate database migration with API deployment.
3. Supabase Storage is not treated as solved; it remains a separate production decision.
4. Existing business/domain tests remain the proof of behavior after provider switch.
5. Any network/sandbox failures are diagnosed and rerun with explicit escalation.

## Implementation Tasks

- [x] Add shared database env resolution helper.
- [x] Update API runtime env loader and Prisma config to use Neon before Supabase.
- [x] Add `.env.example` Neon placeholders.
- [x] Build/test API after config change.
- [x] Run Prisma deploy migrations against Neon.
- [x] Run seed against Neon.
- [x] Verify seeded DB readback without printing secrets.
- [x] Update architecture/open-question notes.
- [x] Close output/trajectory evals and phase status.

## Delivery Notes - 2026-07-17

- Added shared database env resolution in `apps/api/src/env/database-connection.ts`.
- Neon now wins when `NEON_CONNECTION_STRING` is present; Supabase DB env vars are fallback only.
- Runtime database access uses `NEON_CONNECTION_STRING`.
- Prisma CLI/migration access uses `NEON_DIRECT_URL` when present.
- Applied all 10 Prisma migrations to Neon.
- Seeded Neon through the existing seed script.
- Updated BUSY developer requirements markdown/PDF so it no longer exposes localhost as a remote test base URL.
- Added DEC-054 for Neon test/staging Postgres selection.

## Verification Summary - 2026-07-17

- `npm run test --workspace @volt-rewards/api` - PASS, 115 tests.
- `npm run prisma:migrate:deploy --workspace @volt-rewards/api` - PASS on Neon after network approval.
- `npm run db:seed --workspace @volt-rewards/api` - PASS on Neon after sandbox/network approval.
- Neon readback - PASS: 10 migrations, 7 users, 3 contractors, 5 reward items, 1 BUSY invoice.
- BUSY PDF text check - PASS: no `127.0.0.1` or `localhost`; Test API Deployment wording present.
- BUSY PDF page 1 render inspection - PASS.

## Residual Gaps

- Test API still needs a public HTTPS deployment before the BUSY developer can call the receiver remotely.
- BUSY connector credentials still need to be generated and configured for the deployed Test API.
- Production object storage remains undecided; local/test media remains placeholder mode by default.
- Neon connection strings currently use `sslmode=require`; the PostgreSQL client emitted a forward-looking warning that `sslmode=verify-full` can be used to preserve current strict verification behavior in future pg versions.
