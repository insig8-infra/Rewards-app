# Architecture Draft - Volt Rewards V1

Status: Draft for review before code generation.

## Documentation Checked

Context7 was used for current framework documentation:

- Expo: `/expo/expo`
- Next.js: `/vercel/next.js`
- NestJS: `/nestjs/docs.nestjs.com`

Relevant findings:

- Expo supports Android/iOS React Native apps, camera permissions, contacts access, and production build/submission workflows.
- Next.js App Router supports production admin web routes, server/client components, and server-side web behavior.
- NestJS supports modular TypeScript APIs with controllers/providers, guards, validation, testing, and OpenAPI documentation.

## Recommended Baseline Stack

Use a TypeScript-first monorepo:

- Mobile: Expo/React Native for `Volt Rewards` and `Volt Admin`.
- Admin web: Next.js App Router for `Volt Admin Web Portal`.
- Backend API: NestJS.
- Database: PostgreSQL.
- API contract: OpenAPI generated from backend.
- Test strategy: backend unit/integration tests, API contract tests, web E2E tests, mobile workflow checks where practical.
- Mobile release posture: implementation must stay compatible with public Play Store and App Store launch from the start.

Rationale:

- The requirements need Android and iOS from one codebase.
- The admin web portal needs a production dashboard/report workflow.
- The backend must enforce domain rules, roles, audit, and state machines.
- TypeScript across clients and backend reduces contract drift.

## System Components

### Backend/API

Responsibilities:

- Auth and sessions.
- Role permissions.
- Contractor, Team Member session, OWNER, and STAFF behavior.
- Sites.
- BUSY invoice/return adapter.
- QR unit lifecycle.
- Scan attempts.
- Points ledger.
- Reward catalog, redemption, cancellation, and fulfillment.
- Reports and exports.
- Promotions.
- Audit events.

### End-User Mobile App

Responsibilities:

- Contractor login, first-login SET MPIN, MPIN change.
- Team Member contractor mobile lookup, OTP, Recent contractor.
- Hindi/English switching on every screen/page.
- Contractor Home, Sites, Scan, Scan History, Rewards.
- Contractor full Scan History across sites and Team Member scans.
- Team Member site selection, Scan QR, and restricted Scan History for sites the Team Member scanned or attempted.
- Banner/ad placements.
- Client-approved Stitch screenshots in `Sample_References/Screenshots from Stitch/` are the primary mobile visual direction, implemented through Volt Rewards theme tokens and without copying Stitch editor chrome.

The app must not decide core QR, points, reward, or permission validity locally.

### Admin Mobile App

Responsibilities:

- OWNER and STAFF login.
- OWNER dashboard, staff management, contractor management, reward fulfillment.
- STAFF limited dashboard, return scan, contractor view-only.
- Return Scan status/cancel/reverse workflows that require mobile camera scanning.

The backend must enforce OWNER-only and STAFF-denied behavior across mobile and web surfaces.

### Admin Web Portal

Responsibilities:

- All non-camera OWNER/STAFF admin workflows available in Admin Mobile.
- `Print QR codes` landing workflow.
- BUSY invoice selection.
- Pre-checked line items.
- Quantity reduction.
- Unit-level QR generation.
- QR label print and print history.
- Dashboards, contractor management, staff management, reward fulfillment, reports/exports, promotions, and analytics by role.

Admin Web does not implement returned-product QR status scan, cancel, or reverse in v1 because those flows require mobile camera scanning and label-removed/discarded confirmation.

## Module Boundaries

Backend modules:

- `auth`
- `users`
- `roles`
- `sites`
- `busy`
- `qr`
- `scans`
- `points`
- `rewards`
- `admin`
- `reports`
- `promotions`
- `audit`
- `notifications`

Domain services should be framework-independent where possible so they can be unit tested without HTTP or UI.

## Key Architectural Rules

- Domain state transitions happen in backend services.
- Every high-risk mutation writes an audit event.
- Ledger entries are append-only.
- Derived balances are recalculated or checked from ledger entries.
- QR token validation never trusts client-provided point values.
- Role permission checks exist at backend guards/policies and are mirrored in UI only for usability.
- BUSY integration starts as a mock adapter until real sample data exists.
- Reports read from normalized internal tables, not directly from BUSY.

## Environment Strategy

- Local: mock BUSY adapter, local database, local SMS/OTP simulator.
- Staging: test SMS provider, non-production data, real-like deployment.
- Production: real SMS provider, real BUSY connector after field mapping, locked secrets, backups, observability.

## Initial CI Gates

- Type check.
- Lint/format.
- Backend unit tests.
- Backend integration tests.
- Web build.
- Mobile type/build check.
- Secret scan.
- Dependency scan.

## Decisions Still Needed

- Package manager and monorepo tool.
- ORM/database migration tool.
- SMS/OTP provider.
- QR label rendering/printing implementation.
- Hosting provider.
- Production BUSY connector shape.
