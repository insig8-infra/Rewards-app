# Phase 1-5 Audit - Pre-Proceed Check

Updated: 2026-06-22

## Verdict

Phases 1 through 5 are built according to their approved slice boundaries, not according to the full v1 product scope.

It is safe to proceed with the full product build using the mock BUSY adapter. The immediate Admin Web QR print foundation gap was closed in Phase 6: database-backed invoice list/detail endpoints, real persisted invoice line ids in the UI, and print history.

## Automated Verification

- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- `npm run typecheck` passed.
- `npm run lint` passed when run sequentially.
- `npm test` passed with 36 tests.
- `npm run build --workspace @volt-rewards/admin-web` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.

Note: Running root `lint`, `typecheck`, and `test` concurrently can race on Prisma client generation. Sequential execution is clean.

## Phase Findings

### Phase 1 - Architecture And Domain Core Start

Status: PASS for phase scope.

Built:

- Architecture, auth/permissions, and CI/CD drafts.
- TypeScript npm workspace.
- Shared domain package.
- QR lifecycle helpers.
- Reward ledger helpers.
- Role permission matrix.
- NestJS/Fastify API shell.
- Domain/API smoke tests.

Gaps:

- Expected for phase: no production API persistence, auth sessions, mobile app, or web app.

### Phase 2 - Persistence And QR Scan Slice

Status: PASS for phase scope.

Built:

- Prisma/PostgreSQL schema and generated client workflow.
- QR scan repository boundary.
- Prisma scan repository with transaction for QR claim, scan attempt, contractor balance update, and points ledger entry.
- HMAC QR token lookup so raw QR tokens are not persisted.
- `POST /scan/qr` controller shell.
- Tests for scan success, replaced token, and contractor/site ownership denial.

Gaps:

- Expected for phase: no real login/session model.
- Expected for phase: no live PostgreSQL migration execution in this workspace.

### Phase 3 - QR Print And Seed Harness

Status: PASS for phase scope.

Built:

- Mock BUSY invoice import.
- Unit-level `NOT_PRINTED` QR placeholders at import time.
- QR print service and Prisma repository.
- Raw QR token returned only at print time; HMAC token hash persisted.
- Import -> print -> scan repository-level test.
- Prisma seed path and migration SQL.
- Local database runbook.

Gaps:

- Expected for phase: no real BUSY connector.
- Expected for phase: no Admin Web UI.
- Expected for phase: no persistent reprint endpoint yet.

### Phase 4 - Backend Actor Guard Boundary

Status: PASS for phase scope.

Built:

- Header-backed temporary actor context.
- `ActorGuard`, `@RequireAction`, and `@CurrentActor`.
- Admin Web mock BUSY and QR print endpoints protected with `ADMIN_PRINT_QR`.
- QR scan endpoint protected with `QR_SCAN`.
- Controller tests proving forged body actor fields are ignored.

Gaps:

- Expected for phase: not production auth. OWNER/STAFF login, Contractor MPIN, and Team Member OTP remain future slices.
- Expected for phase: scan still uses temporary contractor scope header until real sessions exist.

### Phase 5 - Admin Web QR Print Shell

Status: PARTIAL by product requirements, PASS for phase shell scope.

Built:

- Next.js Admin Web app.
- QR print workflow as first screen.
- Central API client with actor headers.
- Test proving QR print request body does not carry actor authority fields.
- Mock BUSY invoice list/import UI.
- Line selection, pre-checked selection, quantity clamping, print action, and printed token display.
- Responsive CSS and production web build.

Known gap closed in Phase 6:

- Admin Web no longer hardcodes mock line templates or `line_1` / `line_2` ids after import.
- Mock BUSY fixtures have been updated to realistic electric-shop invoices and should remain the source of mock invoice truth until actual BUSY API integration is available.
- Backend now exposes `GET /admin-web/invoices` and `GET /admin-web/invoices/:invoiceId`.
- Admin Web print history endpoint/UI is implemented.
- Broader non-camera Admin Web workflows are documented but not implemented yet.
- This is a sequencing gap, not a scope reduction: Admin Web must still implement all non-camera Admin Mobile workflows.

Confirmed scope rule:

- Admin Web has no returned-product QR status scan, cancel, or reverse product endpoints in v1. Those remain Admin Mobile only.

## Proceed Direction

Proceed with mock BUSY as the active invoice source. Real BUSY API integration is not a blocker for full product development.

Phase 6 completed:

1. `GET /admin-web/invoices`.
2. `GET /admin-web/invoices/:invoiceId`.
3. Backend line-level availability from persisted invoice lines.
4. Admin Web loading real persisted line ids instead of mock templates.
5. Print history endpoint and UI.
6. Tests proving browser/API line ids match the database-backed print service.
7. Admin Web navigation/route structure that makes room for all non-camera admin workflows.

Continue the full product build on mock BUSY. Admin Web must be built as the full browser admin portal: dashboard, contractor management, staff management, reward fulfillment, reports/exports, promotions, analytics, and QR printing. Returned-product QR status scan/cancel/reverse remains Admin Mobile only.
