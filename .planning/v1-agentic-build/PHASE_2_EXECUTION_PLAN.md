# Phase 2 Execution Plan - Persistence And QR Scan Slice

## Goal

Introduce the production persistence foundation and replace request-provided QR scan state with a repository-backed backend service.

## Source Requirements

- QR-001 through QR-018
- SITE-001 through SITE-009
- RWD-001 through RWD-017
- MADM-001 through MADM-024
- REP-001 through REP-010
- PLAT-001 through PLAT-007

## Tasks

- [x] Add Prisma 7 schema and config for PostgreSQL.
- [x] Model users, roles, staff, contractors, team members, sites, BUSY invoices, invoice lines, QR units, QR tokens, scan attempts, points ledger, rewards, audit events, and promotions.
- [x] Generate Prisma client into API source generated directory.
- [x] Add Nest `PrismaModule` and `PrismaService` with PostgreSQL adapter.
- [x] Add QR token HMAC hashing so raw bearer QR tokens are not persisted.
- [x] Add QR scan repository interface.
- [x] Add Prisma-backed QR scan repository with transaction boundary for scan claim, scan attempt, contractor balance update, and ledger entry.
- [x] Add in-memory QR scan repository for fast service tests.
- [x] Add `POST /scan/qr` controller shell.
- [x] Add tests for scan success, replaced token, and contractor/site ownership denial.
- [x] Fix API test glob so root and nested tests both run.
- [x] Add dependency audit override for Prisma CLI transitive `@hono/node-server`.

## Out Of Scope

- Running real PostgreSQL migrations against a live database.
- Seed data.
- Auth guards and request identity extraction.
- QR print job generation.
- Real BUSY connector.
- Real SMS/OTP provider.
- Mobile or web UI.

## Acceptance Criteria

- Prisma schema validates.
- Generated Prisma client typechecks with Nest repository code.
- QR scan service never stores raw QR token values.
- Successful scan path has a transaction boundary in the Prisma repository.
- Replaced token and forbidden-site cases are tested.
- Existing API shell tests still run.
- Production dependency audit is clean.

## Verification

- `npm run prisma:validate --workspace @volt-rewards/api` - passed.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - 21 tests passing.
- `npm --cache .npm-cache audit --omit=dev` - found 0 vulnerabilities.

## Next Slice

Build the QR print path and seedable persistence harness:

1. Add initial migration workflow and local database runbook.
2. Add seed data for OWNER, STAFF, Contractor, Site, BUSY invoice, invoice line, and printable QR units.
3. Implement mock BUSY invoice import service.
4. Implement admin-web QR print service that creates QR units and active token hashes.
5. Add integration tests around import -> print -> scan using a test database or repository-level fixture.
