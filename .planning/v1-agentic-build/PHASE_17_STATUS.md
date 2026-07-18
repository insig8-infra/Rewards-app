# Phase 17 Status - Admin Mobile Auth And Operations Baseline

Status: Complete for the approved baseline scope on 2026-07-06.

## Scope Delivered

- Created separate Admin Mobile app workspace: `apps/admin-mobile`.
- Added Admin Mobile app identity: `Volt Admin`.
- Added backend admin PIN login: `POST /api/auth/admin/login`.
- OWNER and STAFF Admin Mobile sessions use bearer `AuthSession` records, not Admin Web dev actor headers.
- Added seeded local Admin Mobile logins:
  - OWNER: `9000000091` / PIN `1111` / Shishir Mehta.
  - STAFF: `9000000092` / PIN `2222` / Aarti Deshmukh.
- Added protected Admin Mobile routes:
  - `GET /api/admin-mobile/dashboard`
  - `GET /api/admin-mobile/contractors`
  - `GET /api/admin-mobile/contractors/:contractorId`
- Built role-specific Admin Mobile navigation:
  - OWNER: Dashboard, Return Scan, Contractors, Reports.
  - STAFF: Dashboard, Return Scan, Contractors.
- Built dashboard readback, contractor list/detail readback, STAFF read-only contractor detail, and return-scan token-entry validation.
- Updated local CORS defaults and `.env.local`/`.env.example` to include Admin Mobile Expo Web on port `3003`.
- Added site-level `scanCount` to admin contractor detail API responses so mobile site rows do not render blank scan counts.

## UAT Findings Fixed During Phase

- Admin Mobile web login initially failed with CORS from `http://127.0.0.1:3003`; fixed API default CORS and local env CORS origins.
- Dashboard recent activity initially emitted React key warnings because the API returns `auditEventId`, not `id`; fixed the mobile API contract and row key.
- Contractor detail initially rendered `ARCHIVED ·  scans`; fixed backend contract to return site-level scan counts.
- Removed the non-functional OWNER `Add` control from the contractor list. Contractor create/edit/deactivate should be added only in a planned mutation slice with full UAT.

## Verification

Automated gates:

- `npm run typecheck` passed.
- `npm test` passed.
- `npm run lint` passed.
- `git diff --check` passed.

Runtime targets verified:

- API: `http://127.0.0.1:3000`
- Admin Mobile Web UAT: `http://127.0.0.1:3003`

Browser UAT used Playwright because the Codex in-app browser endpoint was unavailable in this environment.

## Evidence

- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-login-clean.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-owner-dashboard-final.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-owner-contractors-final.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-owner-contractor-detail-final.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-back-to-contractors.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-staff-login.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-staff-dashboard.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-staff-contractors.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-staff-contractor-detail.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-return-scan.png`
- `.planning/v1-agentic-build/evidence/phase17-admin-mobile-return-scan-validation.png`

Browser console result:

- No app errors after fixes.
- Remaining development warning: React Native Web reports deprecated `shadow*` style props and recommends `boxShadow`.
- Remaining development verbose note: browser warns that the password field is not inside a form on Expo Web. Native apps are unaffected; web polish can address this if Admin Mobile Web becomes a supported browser surface.

## Residual Risks And Deferred Work

- Native iOS/Android simulator or physical-device camera validation was not completed. Camera QR scan must not be claimed complete yet.
- Return Scan currently supports token-entry UAT validation only. QR lookup, cancel, and reverse action wiring remain the next QR return operations slice.
- Admin Mobile contractor create/edit/deactivate mutation screens were not included in this baseline. The backend wrappers exist, but the mobile UI intentionally does not show fake controls.
- OWNER staff management, reward fulfillment, and reports are surfaced as dashboard/report baseline affordances, not full deep mobile workflows yet.
- Store readiness still needs native build validation, app icons/splash assets, permissions review, privacy copy, and App Store/Play Store release checks.
