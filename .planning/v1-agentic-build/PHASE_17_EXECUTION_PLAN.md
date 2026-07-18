# Phase 17 Execution Plan - Admin Mobile Auth And Operations Baseline

Status: Active. Phase-relevant open questions were reviewed on 2026-07-06.

## Goal

Create the first product-grade Admin Mobile baseline as a separate mobile app surface for OWNER and STAFF: PIN login, persisted admin sessions, role-specific navigation, operational dashboard, contractor access, and a visible return-scan entry surface.

This phase establishes the Admin Mobile app and admin auth foundation before implementing every Admin Mobile workflow in depth.

## Source Requirements

- `PLAT-003`
- `PLAT-004`
- `PLAT-006`
- `PLAT-008`
- `PLAT-009`
- `PLAT-010`
- `PLAT-012`
- `MADM-001` through `MADM-012`
- `MADM-016` through `MADM-024`
- `WEB-014` through `WEB-017`
- `QR-011` through `QR-018`

## Scope

Included:

- New separate Admin Mobile Expo/React Native workspace: `apps/admin-mobile`.
- Admin Mobile app identity: `Volt Admin`.
- OWNER/STAFF PIN login through backend API, not dev actor headers.
- Persisted OWNER/STAFF bearer sessions using existing `AuthSession` infrastructure.
- Role-specific app navigation:
  - OWNER: Dashboard, Return Scan, Contractors, Reports.
  - STAFF: Dashboard, Return Scan, Contractors.
- OWNER dashboard sections for profile, contractor count, QR status summary, staff-management entry, reward-fulfillment entry, and recent activity.
- STAFF dashboard limited to recent return/cancel/reverse activity and operational shortcuts.
- Contractors screen:
  - OWNER can reach registration/edit/deactivate entry points where existing shared services support them.
  - STAFF can view contractor list/detail only.
- Return Scan surface:
  - Visible token-entry lookup for Expo Web/local UAT.
  - Camera scan remains a native follow-up unless simulator/device camera validation is completed in this phase.
  - Cancel/reverse controls are shown only when backend support and QR state allow them.
- API readback after admin login and contractor list/dashboard fetch.
- Product-grade UI contract, visible-control UAT, screenshot evidence, console check, and status document.

Excluded:

- Full native camera scanning if no simulator/device validation is available.
- Full reports/export implementation.
- Promotion management.
- Deep contractor analytics.
- Final production SMS/WhatsApp provider.
- Production auth lockout/rate-limit rules until the auth-hardening slice.
- Store listing assets, legal copy, and production developer-account setup.

## Open Questions

Relevant questions from `OPEN_QUESTIONS.md`:

- Admin Mobile: Should STAFF have Reports tab removed completely or have read-only reports accessible elsewhere?
- Admin Mobile: Should OWNER reward fulfillment be in Dashboard, Reports, Contractors, or a dedicated flow?
- Admin Mobile: Can OWNER edit STAFF mobile number, or only deactivate and recreate?
- Auth: What lockout/rate-limit rules apply after failed MPIN or OTP attempts?
- OTP/SMS: Which production provider should deliver OTP/PIN messages?

Blocking before implementation:

- None for this baseline. Current requirements already specify OWNER and STAFF tab differences.

Needed before phase completion:

- Record explicit baseline assumptions for STAFF Reports, OWNER reward fulfillment placement, and staff mobile edit scope.

Safe to defer with explicit assumption:

- Production lockout/rate-limit defaults.
- Production SMS/WhatsApp provider.
- Native camera scan validation.
- Full reports/export and promotion rules.

User decisions or phase assumptions recorded:

- Historical Phase 17 baseline: STAFF Admin Mobile used Dashboard, Return Scan, and Contractors only.
- Supersession note: Phase 25F/post-demo correction updates `MADM-010`; STAFF now has Dashboard, Return Scan, Contractors, Rewards, and Reports with restricted/read-only behavior. Staff management remains OWNER-only.
- OWNER reward fulfillment is surfaced from the OWNER Dashboard as a first baseline, matching `MADM-012`; it can later become a dedicated workflow screen if UAT shows it needs faster access.
- OWNER cannot edit staff mobile number in this phase; existing foundation supports create/reset/deactivate/reactivate, and mobile-number edits remain deferred.
- Admin Mobile camera is not claimed complete until native simulator/device UAT proves it. Expo Web uses token-entry lookup only.

## UI Experience Contract

- Surface: Admin Mobile app, Expo/React Native, separate from the end-user `Volt Rewards` app.
- Persona: OWNER and STAFF.
- Primary job: OWNER/STAFF can quickly see operational status, process returned-product QR work, and reach contractor/staff/reward tasks according to role.
- Screen map:
  - Auth stack: Login, Loading/Restore Session.
  - OWNER tabs: Dashboard, Return Scan, Contractors, Reports.
  - STAFF tabs: Dashboard, Return Scan, Contractors.
  - Stack screens: Contractor Detail, Contractor Create/Edit, Staff Management, Reward Fulfillment, Return Scan Result/Confirm, Profile/Logout.
- Entry path: App launch -> role choice -> mobile + PIN -> role-specific tabs.
- Navigation/back behavior: Bottom tabs for role top-level areas; stack push for detail/create/edit/confirm/result screens; visible back on pushed screens; Android hardware back remains native validation item.
- Dashboard impact: Login lands on role dashboard. OWNER sees profile, total contractors, QR status summary, staff/reward shortcuts, and recent activity. STAFF sees limited recent return/cancel/reverse activity and no owner-only actions.
- Primary action: Return Scan QR.
- Secondary actions: Contractors, Staff Management, Reward Fulfillment, Reports, Logout.
- Data shown: Admin human name, role, mobile, contractor count, QR status counts, recent activity, contractor list/detail, permission-denied messaging.
- Data identity source: `User.displayName` and `User.mobileNumber` for OWNER/STAFF/Contractor names; contractor data from existing admin contractor APIs; dashboard data from admin dashboard service.
- Asset strategy: No decorative image assets required for this operational baseline. Use icons/status tokens; profile photos render where present.
- Empty/loading/success/error/denied states: Required for login, dashboard fetch, contractor list, return scan lookup, STAFF denied owner actions, and network errors.
- Role differences: OWNER can see Reports tab and owner-only management shortcuts. STAFF has no Reports tab, no Staff Management, no Reward Fulfillment, no contractor mutation actions, and no export controls.
- Reference inputs used: `FRONTEND_EXPERIENCE_STANDARD.md`, `PRODUCT_GRADE_PLATFORM_STANDARD.md`, current end-user mobile navigation baseline, and Admin Web operational patterns. PayTM/PhonePe task-first mobile patterns may influence hierarchy; no copied branding/assets.
- Mobile/desktop layout expectations: Native mobile first; Expo Web at mobile viewport used as supplemental local UAT.
- Persistence/API readback after mutation: Admin login session readback through protected dashboard call; contractor/staff/reward mutations must read back from API when included.
- Exact UAT URL, simulator, or device target: Expo Web target to be assigned when the app starts locally, expected port `3003` unless occupied. Native simulator/device is required before claiming camera/store-readiness beyond baseline.

## Architecture Touchpoints

- Domain services: Role permissions, admin auth validation, QR lifecycle, contractor management, staff management, reward fulfillment.
- API routes:
  - `POST /api/auth/admin/login`
  - `GET /api/admin-mobile/dashboard`
  - Admin Mobile wrappers or shared guarded routes for contractors/staff/rewards where needed.
  - Return scan lookup/cancel/reverse routes when implemented.
- Database tables: `User`, `StaffProfile`, `AuthSession`, `Contractor`, `QrUnit`, `QrToken`, `PointsLedgerEntry`, `RewardClaim`, `AuditEvent`.
- UI surfaces: `apps/admin-mobile`.
- Background jobs: None.
- Audit events: Admin login, contractor/staff/reward mutations, QR cancel/reverse.

## Tests And Evals

- Unit: Admin auth validation and session creation; role navigation helpers where extracted.
- Integration: API admin login, bearer protected dashboard, OWNER/STAFF denied paths.
- API contract: Admin login returns role, user profile, session, expiry, and permissions-safe actor context.
- UI/E2E: Visible OWNER login, STAFF login, role tab differences, dashboard load, contractor list, denied owner action for STAFF.
- Frontend experience quality: Required.
- Product-grade platform review: Required.
- Browser workflow UAT:
  - Exact URL(s): Admin Mobile Expo Web local URL, expected `http://127.0.0.1:3003`.
  - Persona/actor context: OWNER and STAFF.
  - Hydration/console/network check: Required.
  - Visible-control interaction proof: Required.
  - Happy path: OWNER PIN login -> dashboard -> contractors.
  - Edit/update path: Only if contractor/staff mutation screens are included in this phase.
  - Delete/deactivate/cancel path: Only if mutation screens are included in this phase.
  - Denied/read-only role path: STAFF cannot see Reports tab or owner-only management actions.
  - Persistence checks after each mutation: Required for any mutation included.
  - Desktop/mobile layout checks: Mobile viewport primary; desktop web sanity only.
- Security: No admin dev actor headers in Admin Mobile app; bearer sessions only. Server-side role checks remain the authority.
- Manual review: Required against `SECURITY_AND_EVALUATION_PLAN.md`.

## Implementation Tasks

- [x] Bring forward Phase 17 open questions and record baseline assumptions.
- [x] Check current Expo and React Navigation docs through Context7.
- [x] Add Phase 17 architecture decision.
- [x] Implement admin PIN auth API and tests.
- [x] Seed valid dev OWNER/STAFF PIN hashes and document test logins.
- [x] Scaffold `apps/admin-mobile` as a separate Expo app workspace.
- [x] Build Admin Mobile auth stack and role-specific tab navigation.
- [x] Build OWNER and STAFF dashboards.
- [x] Build contractor list/detail baseline with STAFF read-only behavior.
- [x] Build return-scan token-entry surface with honest camera residual risk.
- [x] Add focused admin-mobile tests.
- [x] Run automated verification.
- [x] Run visible-control UAT and capture screenshot evidence.
- [x] Write `PHASE_17_STATUS.md`.

## Exit Gates

- [x] Requirement IDs satisfied for the Phase 17 baseline scope.
- [x] Phase-relevant open questions were brought forward before implementation.
- [x] User decisions or explicit assumptions were recorded.
- [x] UI experience contract completed.
- [x] Admin Mobile is a separate app surface, not hidden inside the end-user app.
- [x] OWNER/STAFF login uses backend PIN auth and bearer session, not dev actor headers.
- [x] OWNER and STAFF navigation differs as required.
- [x] STAFF denied/read-only behavior is tested.
- [x] Frontend experience quality gate completed.
- [x] Product-grade platform gate completed.
- [x] Tests pass.
- [x] Visible-control UAT completed at exact local target.
- [x] Browser console/network/hydration failures checked.
- [x] API/database readback completed for login and included mutations.
- [x] Security/eval gate completed.
- [x] Residual risks documented.
