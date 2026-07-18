# Phase 22I - Promotions Implementation Plan

Status: Implemented - Automated Verification Passed, Visible Browser UAT Queued
Owner: Codex
Date: 2026-07-08

## Source Contracts

- `AGENTS.md`
- `.planning/v1-agentic-build/APPROACH.md`
- `.planning/v1-agentic-build/REQUIREMENTS_LEDGER.md`
- `.planning/v1-agentic-build/ROADMAP.md`
- `.planning/v1-agentic-build/OPEN_QUESTIONS.md`
- `.planning/v1-agentic-build/SECURITY_AND_EVALUATION_PLAN.md`
- `.planning/v1-agentic-build/PHASE_22H_REPORTS_PROMOTIONS_DECISION_CONTRACT.md`

## Open-Question Gate

No new user decision is required before this implementation pass.

Locked decisions carried forward:

- Promotions are all-user banners for Contractor and Team Member users.
- Promotions appear on dashboard/high-attention areas without interrupting login, scan, reward claim, or operational messaging.
- OWNER manages promotions from Admin Web.
- STAFF has no promotion-management permission.
- Promotions can use image/GIF/animated-image media.
- Optional expiry is supported.
- No scheduler, advanced targeting, WhatsApp/report sharing, or tier/city/category/persona targeting in this pass.
- Promotion management must live behind a clear `Manage Promotions` entry inside Promotions, not dumped on an unrelated landing page.

## Build Scope

1. Backend
   - Add promotion-management and promotion-view permissions.
   - Add the minimum schema fields needed for media overlay style controls.
   - Create Admin Web promotion endpoints for list/create/update/activate/deactivate.
   - Create mobile active-promotion endpoint for Contractor and Team Member bearer sessions.
   - Validate status, expiry, media type/size, and all-user targeting.
   - Record audit events for create/update/activate/deactivate.

2. Admin Web
   - Replace placeholder Promotions page with OWNER-only real workspace.
   - Keep landing focused on active/draft/archived summary and preview.
   - Put creation/editing inside an explicit `Manage Promotions` mode.
   - Support media upload, media URL, title/body, overlay text, overlay text color, font size, font style, and optional expiry.

3. Mobile End-User App
   - Replace static hardcoded dashboard promotion with API-driven active promotion banners.
   - Show active non-expired promotions for Contractor and Team Member.
   - Keep banners non-blocking and visually aligned with current mobile dashboard style.

4. Seed/UAT
   - Seed one active all-user promotion and one inactive/expired scenario for visibility testing.
   - Keep sample data human-readable and client-demo suitable.

## Out of Scope

- Admin Mobile promotion management.
- Scheduled start windows beyond optional expiry.
- Persona, tier, city, product-category, or individual-contractor targeting.
- Push notifications.
- Campaign analytics beyond audit events.

## Acceptance Criteria

- OWNER can create, edit, activate, and deactivate promotions from Admin Web.
- STAFF cannot access or mutate promotion management APIs.
- Contractor and Team Member APIs return only `ACTIVE`, non-expired, all-user promotions.
- Expired or archived promotions never appear in the end-user app.
- Promotion media upload accepts PNG/JPG/JPEG/GIF under 2 MB and rejects invalid files before storage.
- Admin Web landing keeps management behind `Manage Promotions`.
- Contractor dashboard and Team Member scan landing show active banners without blocking core workflows.
- Create/update/activate/deactivate writes audit events.

## Verification Plan

- Domain permission tests.
- API promotion visibility and validation tests.
- Admin Web API client route tests.
- Workspace typechecks for API, Admin Web, Mobile, and Domain.
- Seed/migration check against local Supabase-backed dev environment before manual UAT.

## Implementation Result

Completed on 2026-07-08.

Built:

- OWNER-only Admin Web promotions management behind `Manage Promotions`.
- Backend management and mobile visibility APIs.
- Supabase migration and seed data for active, expired, and archived promotion scenarios.
- End-user mobile API-driven promotion banners for Contractor and Team Member surfaces.
- Audit events and strict validation for media, activation readiness, expiry, and all-user targeting.

Verified:

- `npm run typecheck --workspace @volt-rewards/domain`
- `npm run prisma:generate --workspace @volt-rewards/api`
- `npm run typecheck --workspace @volt-rewards/api`
- `npm run typecheck --workspace @volt-rewards/admin-web`
- `npm run typecheck --workspace @volt-rewards/mobile`
- `npm run test --workspace @volt-rewards/domain`
- `npm run test --workspace @volt-rewards/api`
- `npm run test --workspace @volt-rewards/admin-web`
- `npm run prisma:migrate:deploy --workspace @volt-rewards/api`
- `npm run db:seed --workspace @volt-rewards/api`
- API runtime smoke for health, OWNER list, STAFF denial, and Contractor active visibility.

Residual:

- Visible Browser UAT for `/promotions` and end-user banner rendering remains queued because the session still has process-count warnings and the current in-app Browser availability check returned no browser instances.
