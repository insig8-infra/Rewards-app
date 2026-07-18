# Phase 3 Execution Plan - QR Print And Seed Harness

## Goal

Build the seedable backend foundation for Admin Web QR printing: mock BUSY import, unit-level `NOT_PRINTED` placeholders, QR print token generation, and import -> print -> scan verification.

## Source Requirements

- WEB-004 through WEB-012
- QR-001 through QR-010
- QR-005
- SCAN-001 through SCAN-009
- PLAT-005

## Tasks

- [x] Add domain QR print rules for OWNER/STAFF print permission.
- [x] Add domain QR print quantity validation.
- [x] Add domain 45-day QR expiry helper.
- [x] Add mock BUSY invoice fixture.
- [x] Add BUSY import service and repository boundary.
- [x] Add Prisma BUSY import repository.
- [x] Import mock BUSY invoice into invoice, line, and unit-level `NOT_PRINTED` QR placeholders.
- [x] Add Admin Web mock BUSY import controller shell.
- [x] Add QR print service and repository boundary.
- [x] Add Prisma QR print repository.
- [x] Generate raw QR token values only at print time and persist only HMAC hashes.
- [x] Add Admin Web QR print controller shell.
- [x] Add shared in-memory repository for import -> print -> scan tests.
- [x] Add TypeScript Prisma seed script.
- [x] Add local database runbook.
- [x] Generate initial SQL migration from Prisma schema without requiring a live database.
- [x] Add repository-level import -> print -> scan tests.

## Out Of Scope

- Real BUSY connector.
- Real Admin Web UI.
- Real auth/session guards.
- Live local PostgreSQL migration execution.
- Label printer integration and label layout.
- QR reprint endpoint persistence implementation.

## Acceptance Criteria

- Mock BUSY import creates unit-level `NOT_PRINTED` QR placeholders.
- Print quantity cannot exceed non-returned, not-yet-printed units.
- OWNER and STAFF can print; Contractor cannot.
- Printed QR units become scannable with 45-day expiry.
- Raw QR token values are returned for printing but not persisted.
- Import -> print -> scan path is covered by automated tests.
- Prisma schema and generated client still validate.
- Production dependency audit remains clean.

## Verification

- `npm run prisma:validate --workspace @volt-rewards/api` - passed.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - 27 tests passing.
- `npm --cache .npm-cache audit --omit=dev` - found 0 vulnerabilities.

## Next Slice

Implement server-side auth/authorization guards and request identity extraction before building the Admin Web QR UI:

1. Add auth/session model decisions for OWNER and STAFF API access.
2. Add Nest guards/decorators for actor role and actor user id.
3. Remove temporary `actorRole` body trust from high-risk controller shells.
4. Add audit event actor linkage where a real actor user id exists.
5. Add negative tests for unauthorized QR print, scan, cancel, reverse, and reward fulfillment paths.
