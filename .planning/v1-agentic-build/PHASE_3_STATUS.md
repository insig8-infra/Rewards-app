# Phase 3 Status - QR Print And Seed Harness

Updated: 2026-06-22

## Completed

- Domain QR print rules added:
  - OWNER/STAFF may print QR.
  - Contractor/Team Member may not print QR.
  - Quantity must be positive and cannot exceed non-returned, not-yet-printed units.
  - QR expiry remains 45 days.
- Mock BUSY import slice added:
  - Mock invoice fixture.
  - BUSY import service and repository interface.
  - Prisma repository that upserts invoices and invoice lines.
  - Unit-level `NOT_PRINTED` QR placeholders created at import time.
  - Admin Web mock import controller shell.
- QR print slice added:
  - QR print service and repository interface.
  - Prisma repository that transitions selected placeholders to `PRINTED_UNCLAIMED`.
  - Active QR token hashes persisted; raw token values are returned only in print results.
  - Admin Web QR print controller shell.
- Repository-level integration fixture added for import -> print -> scan tests.
- Prisma seed workflow added:
  - `tsx` dev dependency.
  - `apps/api/prisma/seed.ts`.
  - `db:seed` script.
- Initial SQL migration generated at `apps/api/prisma/migrations/202606220001_init/migration.sql`.
- Local database runbook added at `runbooks/LOCAL_DATABASE.md`.

## Files Added

- `packages/domain/src/qr-print.ts`
- `packages/domain/src/qr-print.test.ts`
- `apps/api/src/busy/mock-busy-invoices.ts`
- `apps/api/src/busy/busy-import.repository.ts`
- `apps/api/src/busy/busy-import.service.ts`
- `apps/api/src/busy/prisma-busy-import.repository.ts`
- `apps/api/src/busy/admin-web-busy.controller.ts`
- `apps/api/src/busy/busy.module.ts`
- `apps/api/src/qr/qr-print.repository.ts`
- `apps/api/src/qr/qr-print.service.ts`
- `apps/api/src/qr/prisma-qr-print.repository.ts`
- `apps/api/src/qr/admin-web-qr.controller.ts`
- `apps/api/src/testing/in-memory-platform.repository.ts`
- `apps/api/src/qr/qr-print-flow.test.ts`
- `apps/api/prisma/seed.ts`
- `apps/api/prisma/migrations/202606220001_init/migration.sql`
- `.planning/v1-agentic-build/runbooks/LOCAL_DATABASE.md`

## Files Updated

- `package.json`
- `package-lock.json`
- `apps/api/package.json`
- `apps/api/prisma.config.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/qr/qr-token.ts`
- `apps/api/src/qr/qr.module.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/permissions.ts`
- `packages/domain/src/permissions.test.ts`

## Verification

- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.

Current test count: 27 passing.

## Important Implementation Notes

- The real BUSY connector remains deferred; this slice uses mock invoice data behind a service boundary.
- Printing chooses existing `NOT_PRINTED` placeholders rather than creating scannable QR units directly from request quantities.
- The API still accepts `actorRole` and optional `actorUserId` in Admin Web controller bodies. This is temporary and must be replaced with auth guards before real UI work depends on it.
- The seed creates QR placeholders only. It does not create active QR tokens because token generation must happen only at print time.
- The initial migration SQL was generated without applying it to a live database.

## Next Slice

Backend auth/authorization guards for high-risk controller shells were completed in `PHASE_4_EXECUTION_PLAN.md` and `PHASE_4_STATUS.md`.

Next slice: start the Admin Web UI shell against the guarded backend contracts.
