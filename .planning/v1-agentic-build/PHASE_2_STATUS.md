# Phase 2 Status - Persistence And QR Scan Slice

Updated: 2026-06-22

## Completed

- Prisma 7.8.0 added for PostgreSQL schema, migration, and generated client workflow.
- API Prisma config added with root `.env` loading and safe local development fallback.
- Prisma schema added for the main v1 product surface: identity, contractors, team members, sites, BUSY invoices, QR units/tokens, scan attempts, points ledger, rewards, audit events, and promotions.
- Nest `PrismaModule` and `PrismaService` added using the Prisma PostgreSQL adapter.
- QR scan backend slice added:
  - HMAC hashing for QR token lookup.
  - Repository interface for persistence boundary.
  - Prisma repository with transaction for QR claim, scan attempt, contractor balance increment, and points ledger entry.
  - In-memory repository for fast service tests.
  - `POST /scan/qr` controller shell.
- Domain `scanQr` now supports persisted `currentBalance` for correct ledger balance calculation.
- API test command fixed to run both root-level and nested tests.
- NPM override added for Prisma CLI transitive `@hono/node-server` advisory.

## Files Added

- `apps/api/prisma.config.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/prisma/prisma.module.ts`
- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/src/qr/qr-token.ts`
- `apps/api/src/qr/qr-scan.repository.ts`
- `apps/api/src/qr/qr-scan.service.ts`
- `apps/api/src/qr/prisma-qr-scan.repository.ts`
- `apps/api/src/qr/in-memory-qr-scan.repository.ts`
- `apps/api/src/qr/scan.controller.ts`
- `apps/api/src/qr/qr.module.ts`
- `apps/api/src/qr/qr-scan.service.test.ts`

## Files Updated

- `package.json`
- `package-lock.json`
- `.gitignore`
- `.env.example`
- `apps/api/package.json`
- `apps/api/src/app.module.ts`
- `packages/domain/src/qr.ts`
- `packages/domain/src/qr.test.ts`

## Verification

- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.

Current test count: 21 passing.

## Important Implementation Notes

- Raw QR token values are not persisted by the backend slice; lookup uses HMAC hashes.
- The Prisma repository uses `updateMany` constrained by `PRINTED_UNCLAIMED` and active token before committing a successful scan.
- The contractor balance update uses an atomic increment and writes the resulting balance into the points ledger.
- The API still lacks real auth guards; `actorRole`, `contractorId`, and `siteId` are accepted in the controller body only as a temporary shell for this slice.
- No real migration was applied because no live PostgreSQL instance is configured in this workspace.

## Next Slice

QR print and seedable persistence were completed in `PHASE_3_EXECUTION_PLAN.md` and `PHASE_3_STATUS.md`.

Next backend slice:

1. Add auth/session model decisions for OWNER and STAFF API access.
2. Add Nest guards/decorators for actor role and actor user id.
3. Remove temporary `actorRole` body trust from high-risk controller shells.
4. Add audit event actor linkage where a real actor user id exists.
5. Add negative tests for unauthorized QR print, scan, cancel, reverse, and reward fulfillment paths.
