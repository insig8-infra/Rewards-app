# Phase 10 Execution Plan - Runtime And Database Gate

## Goal

Prove the local/dev runtime loop works end to end against a real PostgreSQL database before adding more product features.

## Source Requirements

- `AGENTS.md` required workflow.
- `PHASE_8A_STATUS.md` runtime persistence gate.
- `DEC-006`: PostgreSQL system of record.
- `DEC-009`: Prisma for database access and migrations.
- `DEC-022`: managed PostgreSQL provider not locked, Supabase is a viable candidate.

## Scope

Included:

- Load root `.env.local` consistently for API, Prisma seed/config, and runtime verification.
- Use Supabase PostgreSQL as the immediate dev database once `DATABASE_URL` and `DIRECT_URL` are available.
- Run migrations and seed against the configured database.
- Start API on `127.0.0.1:3000`.
- Start Admin Web on `127.0.0.1:3001`.
- Make `npm run runtime:check` pass.
- Verify contractor create/list/photo persistence through real API and database.

Excluded:

- Production deployment.
- Final database provider lock-in.
- Supabase Auth or Storage integration.
- Staff management or new product features.
- GitHub push/release setup.

## Open Questions

- Missing runtime database connection value in `.env.local`: `DATABASE_URL`.
- `DIRECT_URL` remains optional until deployment architecture needs separate pooled runtime and direct migration URLs.
- Whether to add GitHub remote and initial commit in this phase or keep repository publishing as a separate release-control phase.

## Architecture Touchpoints

- API runtime env loading.
- Prisma migration and seed env loading.
- Runtime verification script.
- PostgreSQL connection configuration.
- Contractor persistence path.

## Tests And Evals

- Static:
  - `node --check tools/verify-local-runtime.mjs`
  - `npm run typecheck`
  - `npm test`
  - `npm run lint`
  - `npm run prisma:validate --workspace @volt-rewards/api`
- Runtime:
  - `npm run runtime:check`
- Security:
  - Confirm secrets are not printed.
  - Confirm `.env.local` stays ignored by git.

## Implementation Tasks

- [x] Add `.env.local` loading for API runtime and Prisma tooling.
- [x] Make runtime checker fail clearly when `DATABASE_URL` is missing.
- [x] Add Supabase database variables to `.env.example` without real values.
- [x] Add Prisma migration deploy script for applying existing migrations to Supabase dev DB.
- [x] Run static verification.
- [x] Run runtime database gate after DB connection strings are provided.
- [x] Update Phase 10 status.

## Exit Gates

- [x] `.env.local` is loaded without printing secrets.
- [x] Database connection string is present and verified.
- [x] Migrations have run.
- [x] Seed has run.
- [x] API health passes.
- [x] Contractor create/list/photo persistence passes.
- [x] `npm run runtime:check` passes.
- [x] Residual risks documented.
