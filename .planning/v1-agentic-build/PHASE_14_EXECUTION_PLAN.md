# Phase 14 Execution Plan - Mobile Experience Contract And Thin End-User Shell

## Goal

Create a visible, testable end-user mobile experience for Contractor and Team Member auth, site selection, scan entry, and scan history so backend API foundations can be validated through real user journeys.

This phase corrects the backend-only drift from Phases 12 and 13. It should not add more backend behavior unless the mobile experience contract exposes a specific gap.

## Source Requirements

- `AUTH-002` through `AUTH-014`
- `AUTH-019` through `AUTH-026`
- `PLAT-006` through `PLAT-008`
- `SITE-001` through `SITE-010`
- `SCAN-001` through `SCAN-012`

## Scope

Included:

- Mobile experience contract for Contractor and Team Member.
- Thin end-user mobile shell using Expo/React Native.
- PayTM/PhonePe-style Indian payments-app UX patterns as inspiration, implemented with Volt Rewards theme tokens and without copying external branding/assets.
- Hindi/English language toggle from day one.
- Contractor temporary MPIN login, SET MPIN, normal login, and change MPIN screens wired to existing APIs.
- Team Member contractor mobile entry, OTP request, OTP verify, and temporary session flow wired to existing APIs.
- Team Member Recent contractor local convenience state: at most one recent contractor, populated only after successful OTP login, with clear/remove control.
- Site list/selection and Contractor site create/edit/archive UI wired to existing APIs where already supported.
- Scan entry placeholder or camera path plan depending on tool availability.
- Scan History screen wired to existing API, with Contractor full-history view and Team Member restricted-history view.
- Loading, empty, validation-error, permission-denied, network-error, and success states.
- Store-ready mobile implementation constraints: native permission discipline, secure storage, release-build awareness, privacy-safe client behavior, and no dev-only shortcuts in production paths.
- UAT path for visible mobile flow validation.

Excluded:

- Production SMS/WhatsApp provider.
- Production MPIN/OTP lockout and rate limits.
- Final camera-performance hardening.
- Rewards, Balance Book, reward catalog, and fulfillment.
- Admin Mobile return-product cancel/reverse camera workflow.
- Production media/object storage.
- Final App Store / Play Store submission, listing screenshots, legal/privacy copy, and developer account transfer details.

## Open Questions

Relevant questions from `OPEN_QUESTIONS.md`:

- Team Member Scan History default behavior.
- Secure local Recent contractor behavior.
- Mobile UI references/branding sufficiency.
- Hindi/English scope for the first mobile shell.
- App Store and Play Store readiness expectations.

Blocking before implementation:

- None. User decisions recorded below.

Needed before phase completion:

- Verify whether the current Phase 12 scan-history API already supports the required Team Member restricted-history view. If not, record the backend API gap and implement the smallest server-side change needed.

Safe to defer with explicit assumption:

- Production SMS/WhatsApp provider selection remains deferred.
- Production lockout/rate-limit rules remain deferred.
- Final secure-storage hardening can be verified once mobile runtime/device testing is available, but the UI contract must include the intended behavior.
- Final store listing assets, legal/privacy copy, screenshots, and developer account transfer details remain deferred to launch hardening, while implementation remains store-ready from day one.

User decisions recorded:

- Do not use existing sample references for Phase 14 mobile design. Use PayTM/PhonePe-style mobile UX patterns as inspiration without copying branding/assets.
- Colors may be chosen during implementation, but must be controlled through theme tokens for easy later change.
- Hindi/English toggle must exist from day one.
- Contractor sees full scan history across all sites and Team Member scans.
- Team Member sees only scan history for sites they scanned for or attempted to scan for within allowed scope.
- Team Member login shows only one recent contractor, only after successful OTP login, with clear/remove control.
- Mobile apps must be implemented in a way that stays compatible with public App Store and Play Store launch.

## UI Experience Contract

Surface:

- End-user mobile app, `Volt Rewards`.

Persona:

- Contractor.
- Team Member.

Primary jobs:

- Contractor logs in, sets/changes MPIN, selects or manages site, scans QR, and reviews scan history.
- Team Member enters contractor mobile, completes OTP, selects site, scans QR, and reviews allowed scan history.

Entry path:

- App launch -> persona choice or login entry -> authenticated flow.

Primary actions:

- Login.
- Set MPIN.
- Verify OTP.
- Select site.
- Scan or enter QR token placeholder.
- View scan history.

Secondary actions:

- Forgot MPIN guidance.
- Change MPIN.
- Create/edit/archive site for Contractor.
- Retry OTP.
- Clear/remove recent contractor for Team Member.
- Switch Hindi/English.

Data shown:

- Contractor identity summary.
- Active site context.
- Site list.
- Scan result status.
- Contractor Scan History: full contractor scan history across sites and Team Member scans, with success/failure reasons and Team Member attribution where allowed.
- Team Member Scan History: only scans for sites the Team Member has scanned for or attempted to scan for within allowed scope.

Empty/loading/success/error/denied states:

- Required for each screen before completion.

Role differences:

- Contractor can manage own sites.
- Team Member can select active sites but cannot create/edit/archive sites.
- Team Member does not see full contractor list.
- Team Member sees at most one recent contractor after successful OTP login, and OTP remains mandatory every session.

Reference inputs used:

- `FRONTEND_EXPERIENCE_STANDARD.md`
- PayTM/PhonePe-style Indian payments-app UX patterns as inspiration only.
- Existing `Sample_References/` and `Stitch_Admin_design.md` are not the Phase 14 mobile design direction.

Mobile/desktop layout expectations:

- Primary validation target is mobile. Expo Web can supplement but cannot be the only proof for camera, contacts, secure storage, or native permission behavior.
- Layout must support Hindi and English text from day one.

Persistence/API readback after mutation:

- SET MPIN and login session validity verified by protected API route access.
- Recent contractor stored only after successful Team Member OTP login and removable through visible control.
- Site create/edit/archive verified through site list API readback.
- Scan attempt verified through scan history API readback.
- Scan history visibility verified separately for Contractor and Team Member.

Exact UAT URL, simulator, or device target:

- Expo Web mobile viewport at `http://127.0.0.1:3002`, backed by API `http://127.0.0.1:3000/api`.
- Native simulator/device camera validation remains deferred because Phase 14 uses QR token entry as the scan placeholder.

## Architecture Touchpoints

- Domain services: auth validation, site validation, scan history.
- API routes: existing Contractor auth, Team Member auth, contractor sites, team-member sites, scan, scan history.
- Database tables: `Contractor`, `AuthSession`, `OtpChallenge`, `Site`, `QrScanAttempt`.
- UI surfaces: end-user mobile app.
- Theme/localization: mobile theme tokens and translation resources.
- Background jobs: none.
- Audit events: no new high-risk mutation expected unless API gaps are found.

## Tests And Evals

- Unit: mobile utility/state helpers where added.
- Integration: API client contract tests for mobile calls where added.
- API contract: existing Phase 12/13 contracts reused; add gaps only if frontend contract exposes them.
- UI/E2E: mobile shell workflow smoke tests.
- Frontend experience quality: required before completion.
- Localization: Hindi/English toggle verified on each Phase 14 screen.
- Store readiness: release-build constraints, native permissions, secure storage, and no dev-only production path reviewed.
- Browser/mobile workflow UAT:
  - Exact URL(s): pending.
  - Persona/actor context: Contractor and Team Member.
  - Hydration/console/network check: required for Expo Web if used.
  - Visible-control interaction proof: required.
  - Happy path: Contractor auth/site/scan/history and Team Member OTP/site/scan/history.
  - Language path: switch Hindi/English and verify copy/layout on each screen.
  - Edit/update path: Contractor site edit.
  - Delete/deactivate/cancel path: Contractor site archive.
  - Denied/read-only role path: Team Member cannot create/edit/archive sites and cannot see full contractor scan history.
  - Recent path: Team Member recent contractor appears only after successful OTP login and can be cleared.
  - Persistence checks after each mutation: required.
  - Desktop/mobile layout checks: mobile required; desktop only if Expo Web is used for supplementary validation.
- Security: no token logging, no raw MPIN/OTP persistence in client state beyond form entry, bearer token handling reviewed.
- Native/platform: permissions and storage choices reviewed for public store readiness.
- Manual review: user validates visible mobile flow before phase completion.

## Implementation Tasks

- [x] Bring forward open questions and record answers.
- [x] Write detailed mobile screen contract.
- [x] Review current Expo/React Native docs through Context7 before mobile implementation details.
- [x] Inspect current `apps/*` structure and identify whether an end-user mobile app already exists.
- [x] Define mobile theme tokens and localization resources.
- [x] Build or extend the end-user mobile shell.
- [x] Wire Contractor auth screens to existing APIs.
- [x] Wire Team Member OTP screens to existing APIs.
- [x] Implement Team Member one-recent-contractor convenience state with clear/remove control.
- [x] Wire site selection and Contractor site management screens to existing APIs.
- [x] Wire scan entry/placeholder and scan history screens to existing APIs.
- [x] Verify scan-history API supports Contractor full history and Team Member restricted history; fix server-side if the UI contract exposes a gap.
- [x] Add focused tests.
- [x] Run typecheck/lint/tests.
- [x] Run visible-control mobile/web UAT and capture findings.
- [x] Update phase completion notes and residual risks.

## Exit Gates

- [x] Requirement IDs satisfied for the visible shell scope.
- [x] Phase-relevant open questions were brought forward before implementation.
- [x] User decisions or explicit assumptions were recorded.
- [x] UI experience contract completed.
- [x] Frontend experience quality gate completed.
- [x] Hindi/English toggle exists and is verified on every Phase 14 screen.
- [x] Store-ready mobile implementation constraints reviewed.
- [x] Tests pass.
- [x] Visible mobile workflow UAT completed.
- [x] Exact user-facing local/simulator URL or device target was tested.
- [x] Console/network/hydration failures were checked where applicable.
- [x] Each UI mutation verified through persisted API/database readback.
- [x] Denied paths tested.
- [x] Security/eval gate completed.
- [x] Residual risks documented.
