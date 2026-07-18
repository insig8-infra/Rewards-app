# Phase 16 Execution Plan - Product-Grade Mobile App Baseline

Status: Active. Phase-relevant open questions were brought forward and answered on 2026-07-05.

## Goal

Convert the current end-user mobile visible shell into a production-grade mobile app baseline with real navigation, dashboard landing, human data, reward images, and product-grade screen flows for Contractor and Team Member.

This phase is a correction gate before adding new feature breadth.

## Source Requirements

- `PLAT-006` through `PLAT-012`
- `AUTH-002` through `AUTH-026`
- `SITE-001` through `SITE-010`
- `CAPP-001` through `CAPP-013`
- `TMEM-001` through `TMEM-007`
- `SCAN-001` through `SCAN-012`
- `RWD-001` through `RWD-025`

## Scope

Included:

- Mobile screen map for Contractor and Team Member.
- Real app navigation: auth stack, authenticated app stack, top-level tabs, workflow/detail screens, visible back affordances, and Android back behavior plan.
- Contractor main dashboard after login.
- Team Member limited scan-first landing.
- Realistic seed/UAT contractor, owner, staff, site, invoice, and reward labels.
- Contractor human names sourced from `User.displayName`.
- Reward catalog tile/detail presentation with `imageUrl` or temporary assets.
- Product-grade empty/loading/error/permission/success states for affected screens.
- Visible-control UAT and screenshot evidence.

Excluded:

- Native camera scanning implementation unless required by the chosen navigation refactor.
- Production SMS/OTP provider.
- Final client reward catalog and final client-provided imagery.
- Admin Mobile return scan/cancel/reverse.
- Reports/exports/promotions feature breadth.

## Open Questions

Relevant questions from `OPEN_QUESTIONS.md`:

- Final top-level Contractor tabs: keep Home/Scan/History/Rewards, add Profile/Sites, or use a dashboard plus profile menu?
- Team Member landing decision: scan-first limited dashboard versus direct Scan screen with contractor identity header.
- Reward asset source for development: generated temporary images, curated royalty-free images, or client-provided placeholders.
- Whether contractor identity needs only human display name now, or future fields for legal name/business name/shop name should be planned but not implemented.
- Which existing seeded/UAT records must be preserved for tests and which can be renamed/reseeded for client-facing data.

Blocking before implementation:

- [Resolved] Contractor top-level navigation choice.
- [Resolved] Team Member landing choice.
- [Resolved] Temporary reward asset source.

Needed before phase completion:

- Seed/UAT rename policy.
- Confirmation that `User.displayName` remains sufficient for current human-name needs.

Safe to defer with explicit assumption:

- Final client reward images and final reward catalog values.
- Final App Store/Play Store listing assets.

User decisions recorded:

- Contractor top-level tabs stay Dashboard/Home, Scan, History, and Rewards; Sites/Profile/Help are reached from dashboard/profile/menu actions.
- Team Member uses a scan-first limited dashboard/screen with contractor identity and selected-site context.
- Use replaceable temporary generated/catalog reward images through `RewardCatalogItem.imageUrl` until final client imagery is available.

## UI Experience Contract

- Surface: End-user mobile app, Expo/React Native.
- Persona: Contractor and Team Member.
- Primary job: Contractor can understand balance/tier/status and quickly scan/redeem/manage sites; Team Member can select site, scan QR, and review allowed scan attempts.
- Screen map: Auth stack; Contractor authenticated stack with Dashboard/Home, Scan, History, Rewards top-level tabs plus Sites, Profile, Help/About, MPIN, reward detail, balance book, site create/edit, and scan result stack screens; Team Member limited stack with scan-first dashboard/screen, site selection, scan result, and allowed history.
- Entry path: App launch -> auth persona selection -> login/OTP -> persona landing.
- Navigation/back behavior: Stack back on detail/create/edit/result screens, bottom tabs only for approved top-level screens, Android hardware back plan, unsaved-form protection.
- Dashboard impact: Contractor dashboard must show identity, available points, total accumulated points, tier, scan action, selected-site context, recent activity, and reward prompts.
- Primary action: Scan QR.
- Secondary actions: View rewards, view history, manage sites/profile, change MPIN, help/support, logout.
- Data shown: Human contractor name, photo/avatar, mobile, tier, balances, selected site, scan history, rewards with images/progress/status/Claim ID.
- Data identity source: Contractor name from `User.displayName`; photo from `User.photoUrl`; reward image from `RewardCatalogItem.imageUrl`.
- Asset strategy: Replaceable temporary generated/catalog reward images stored through `RewardCatalogItem.imageUrl`; final client imagery remains a later content replacement task.
- Empty/loading/success/error/denied states: Designed for auth, site list, scan result, history, rewards, balance book, and Team Member denied paths.
- Role differences: Contractor full app; Team Member limited scan/site/history access only.
- Reference inputs used: PayTM/PhonePe-style mobile patterns as inspiration only; `PRODUCT_GRADE_PLATFORM_STANDARD.md`; `FRONTEND_EXPERIENCE_STANDARD.md`.
- Mobile/desktop layout expectations: Native mobile first; Expo Web used only as supplemental UAT until native simulator/device validation is available.
- Persistence/API readback after mutation: Login/session, site create/edit/archive, scan, reward redeem/cancel, language, recent contractor, and seed data readback.
- Exact UAT URL, simulator, or device target: Expo Web `http://127.0.0.1:3002` for local visible-control UAT; native simulator/device target to be recorded when available.

## Architecture Touchpoints

- Domain services: Role permissions, rewards, scan history, site permissions.
- API routes: Contractor auth, Team Member auth, sites, scan, history, rewards, balance book.
- Database tables: `User`, `Contractor`, `Site`, `ScanAttempt`, `RewardCatalogItem`, `RewardClaim`, `PointsLedgerEntry`, `AuthSession`, `OtpChallenge`.
- UI surfaces: `apps/mobile`.
- Background jobs: None.
- Audit events: Existing high-risk mutations remain audited; add only if navigation change exposes new mutation path.

## Tests And Evals

- Unit: navigation helper/state tests where extracted; existing i18n/history/reward tests preserved.
- Integration: API behavior unchanged unless response contracts change.
- API contract: Verify `imageUrl`, `displayName`, tier, balance, reward status, and Claim ID fields remain present.
- UI/E2E: Visible-control UAT for Contractor login/dashboard/scan/site/history/rewards and Team Member OTP/scan/history.
- Frontend experience quality: Required.
- Product-grade platform review: Required.
- Browser workflow UAT:
  - Exact URL(s): `http://127.0.0.1:3002`
  - Persona/actor context: Contractor and Team Member.
  - Hydration/console/network check: Required.
  - Visible-control interaction proof: Required.
  - Happy path: Contractor login -> dashboard -> scan; rewards view; Team Member OTP -> scan.
  - Edit/update path: Contractor site edit and profile/MPIN path where included.
  - Delete/deactivate/cancel path: Site archive and reward cancel.
  - Denied/read-only role path: Team Member site management and Contractor-only rewards blocked/hidden.
  - Persistence checks after each mutation: API/database readback.
  - Desktop/mobile layout checks: Mobile width primary; web viewport check only as supplemental.
- Security: No client-only authorization; secure storage boundaries unchanged.
- Manual review: Required against `PRODUCT_GRADE_PLATFORM_STANDARD.md`.

## Implementation Tasks

- [x] Bring forward and answer the Phase 16 open questions.
- [x] Write final mobile screen map and navigation contract.
- [x] Choose and document navigation implementation approach using current Expo/React Native docs.
- [x] Refactor mobile app into product-grade route/screen structure.
- [x] Build Contractor dashboard landing.
- [x] Build Team Member limited landing.
- [x] Move Profile, Sites, Reward Detail, and Balance Book flows into stack screens with back behavior.
- [x] Populate and render reward image assets.
- [x] Rename seed/UAT user/site/reward data to realistic client-facing examples.
- [x] Run automated tests, lint, typecheck, and visible-control UAT.
- [x] Capture screenshot evidence and update phase status.

## Exit Gates

- [x] Requirement IDs satisfied for the Phase 16 baseline scope.
- [x] Phase-relevant open questions were brought forward before implementation.
- [x] User decisions or explicit assumptions were recorded.
- [x] UI experience contract completed for every affected UI surface.
- [x] Product-grade mobile screen map implemented.
- [x] Contractor login lands on dashboard.
- [x] Team Member landing is limited and scan-first.
- [x] Back behavior exists for Profile, Sites, Reward Detail, and Balance Book stack screens.
- [x] Human names display from `User.displayName`.
- [x] Seed/UAT data uses realistic names/sites/products/rewards for the seeded client-facing records.
- [x] Reward tiles/details render image assets or documented temporary assets.
- [x] Frontend experience quality gate completed.
- [x] Product-grade platform gate completed for the Phase 16 baseline scope.
- [x] Tests pass.
- [x] Visible-control UAT completed at the exact target.
- [x] Console/network/hydration failures checked.
- [x] Each UI mutation verified through persisted API/database readback where exercised.
- [x] Residual risks documented in `PHASE_16_STATUS.md`.
