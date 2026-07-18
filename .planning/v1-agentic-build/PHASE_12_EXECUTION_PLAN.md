# Phase 12 Execution Plan - End-User Sites And Scan History API Foundation

## Goal

Implement the backend foundation that the Contractor and Team Member mobile app will use for mandatory site selection, site management, QR scanning, and scan history.

## Source Requirements

- `SITE-001`
- `SITE-002`
- `SITE-003`
- `SITE-004`
- `SITE-005`
- `SITE-006`
- `SITE-007`
- `SITE-008`
- `SITE-009`
- `SITE-010`
- `AUTH-022`
- `AUTH-026`
- `SCAN-001`
- `SCAN-002`
- `SCAN-003`
- `SCAN-005`
- `SCAN-006`
- `SCAN-007`
- `SCAN-008`
- `SCAN-009`
- `SCAN-010`

## Scope

Included:

- Domain validation for contractor site input.
- Contractor site API:
  - `GET /contractor/sites`
  - `POST /contractor/sites`
  - `PATCH /contractor/sites/:siteId`
  - `POST /contractor/sites/:siteId/archive`
- Team Member read-only site API:
  - `GET /team-member/sites`
- Scan history API:
  - `GET /scan/history`
- Scan-attempt persistence updates so failed attempts keep contractor context when available.
- Team Member scan-attempt attribution by mobile/session fields without creating durable Team Member profiles.
- Backend enforcement that Team Members cannot create/edit/archive sites.
- Audit events for Contractor site create/update/archive.
- Runtime gate extension for site and scan-history APIs.

Excluded:

- Real Contractor MPIN login/session APIs.
- Real Team Member OTP request/verify APIs.
- Mobile app UI implementation.
- Phone contacts integration.
- Hindi/English UI.
- Reward and balance-book UI/history.

## Open Questions And Phase Assumptions

- `Sites` question 2 remains open: whether a contractor can scan through a default site. Phase 12 assumption: no default-site bypass; an active site id is required.
- `Sites` question 4 remains open: controlled city/area lists. Phase 12 assumption: free-text fields.
- `Team Member` question 4 remains open: current daily session vs all scans for selected contractor. Phase 12 assumption: scan history API returns persisted attempts for the selected contractor, with filters; UI can later narrow defaults.
- Real auth is deferred. Phase 12 continues using guarded development actor headers already established in `API_CONTRACTS_DRAFT.md`.

## Architecture Touchpoints

- Domain services: site input normalization/validation.
- API routes: contractor sites, team-member sites, scan history.
- Database tables: `Site`, `ScanAttempt`, `AuditEvent`.
- Existing QR scan service: pass Team Member mobile/session/device attribution into persisted scan attempts.
- UI surfaces: none in this phase.

## Tests And Evals

- Unit:
  - Site input normalization and validation.
  - QR scan service records contractor context and Team Member mobile/session attribution for success and failure paths.
- API/service:
  - Contractor can list/create/update/archive own sites.
  - Team Member can list active sites but cannot mutate them.
  - Scan history returns successful and failed attempts with actor type and Team Member metadata.
- Runtime:
  - `npm run runtime:check` verifies live API/database site and scan-history paths.
- Security:
  - Contractor scope comes from guarded actor context, not request body.
  - Team Member mutation attempts are denied by action policy.
  - Site archive is soft/inactive, not hard delete.

## Implementation Tasks

- [x] Add domain site validation helpers and tests.
- [x] Add scan attempt metadata fields to Prisma schema and migration.
- [x] Add Sites API service/repository/controllers/module and tests.
- [x] Extend QR scan persistence with Team Member mobile/session metadata.
- [x] Add scan history service endpoint and tests.
- [x] Wire modules and update API contracts.
- [x] Extend runtime gate.
- [x] Run verification gates.
- [x] Record phase status and residual risks.

## Exit Gates

- [x] Requirement IDs satisfied.
- [x] Tests pass.
- [x] Database schema validates and migration is applied to dev database.
- [x] Runtime gate passes against local API and Supabase PostgreSQL.
- [x] Contractor-only site mutation is enforced server-side.
- [x] Team Member read-only site access is enforced server-side.
- [x] Scan history includes success/failure attempts and Team Member attribution.
- [x] Residual risks documented.
