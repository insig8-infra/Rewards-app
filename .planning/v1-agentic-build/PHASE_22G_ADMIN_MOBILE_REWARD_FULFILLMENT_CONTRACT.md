# Phase 22G Contract - Admin Mobile Reward Fulfillment Completion

Status: Completed
Created: 2026-07-08
Completed: 2026-07-08

## Source Inputs

- `AGENTS.md`
- `APPROACH.md`
- `ITERATION_CYCLE_AUDIT_2026-07-08.md`
- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `PHASE_22E_REWARD_FULFILLMENT_CONTRACT.md`
- `PHASE_22E_UAT5_REWARD_SEMANTICS_CONTRACT.md`
- `PHASE_22F_REWARD_CATALOG_MANAGEMENT_CONTRACT.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `.planning/v1-agentic-build/skills/ai_driven_sdlc_iteration/SKILL.md`

## Requirement IDs

- `MADM-001` through `MADM-008`: Admin Mobile identity/session baseline.
- `MADM-012`: OWNER dashboard includes reward fulfillment.
- `MADM-024`: Only OWNER can fulfill rewards from Admin Mobile by Claim ID, active Claim Desk, claim verification, contractor OTP, OTP entry, and mark `Delivered`; STAFF can view Reward History but cannot fulfill.
- `MADM-026`: Admin Mobile PIN reveal/hide remains preserved.
- `MADM-027`: OWNER reward catalog management remains available; STAFF must not access catalog management.
- `WEB-032` through `WEB-035`: Reward claim semantics, active Claim Desk, history, and claim-detail field constraints reused from Admin Web.
- `RWD-018`, `RWD-019`, `RWD-026`, `RWD-036`, `RWD-037`: Claim Raised, cancellation, Delivered, and history semantics.

## Open Questions

No user decision blocks Phase 22G.

Relevant open questions carried as explicit boundaries:

- Production OTP/SMS provider, failed-attempt limits, and message copy remain launch hardening. Phase 22G uses the existing mock/local OTP delivery response.
- Native iOS/Android device validation remains required before store-readiness. Expo Web UAT is acceptable for this development slice.
- Reports/promotions remain future slices and must not be pulled into Phase 22G.

## Conflict Resolution

Earlier Admin Mobile baseline hid the `Rewards` tab for STAFF. `MADM-024` and later reward-claim clarifications now require STAFF to view Reward History while still being blocked from fulfillment and catalog management.

Phase 22G resolves this by:

- Showing `Rewards` to STAFF as a history-only surface.
- Showing OWNER the active Claim Desk, fulfillment panel, Reward History, and existing catalog management.
- Keeping all fulfillment and catalog APIs server-side OWNER-only.

## Spec-To-Eval Criteria

BDD/state-action-outcome scenarios:

- Given OWNER is logged into Admin Mobile, when they open Rewards, then active `Claim Raised` requests are visible in a Claim Desk with Claim ID, contractor, phone, reward, Rs spent, and raised time.
- Given OWNER selects `CLM-STALE01`, when they send OTP, then the app shows `Claim Request No longer available. History recorded.`, refreshes Claim Desk, and keeps the stale claim only in history.
- Given OWNER selects `CLM-ACTIVE01`, when they send OTP and enter the returned mock OTP, then Mark Delivered succeeds, the claim leaves Claim Desk, and Reward History shows `Delivered`.
- Given STAFF is logged into Admin Mobile, when they open Rewards, then they see Reward History only and no Claim Desk, OTP, Delivered, or catalog-management controls.
- Given STAFF calls fulfillment/catalog APIs directly, then backend returns permission denial.

Business invariants:

- Claim Desk contains active `CHOSEN` claims only, displayed as `Claim Raised`.
- Delivered claims cannot be fulfilled again.
- Cancelled/revoked/delivered claims are historical entries, not fulfillable work.
- Claim details do not show contractor account totals such as Available Balance or Lifetime Total.

Role/permission invariants:

- OWNER can list active claims, lookup Claim ID, send OTP, and fulfill.
- STAFF can list reward history.
- STAFF cannot list active fulfillable claims, send OTP, fulfill, or manage catalog.

Data persistence/readback invariants:

- OTP send creates an OTP challenge and audit event.
- Fulfillment verifies challenge id + OTP, marks claim `FULFILLED`, writes reward fulfillment ledger/audit events, and returns fulfilled readback.
- After stale or fulfilled mutation, app reloads active claims and history.

UI/UX acceptance criteria:

- Rewards screen is role-aware.
- OWNER lands on daily reward operations first, not catalog setup.
- Catalog management remains available as a lower-frequency OWNER section.
- STAFF history uses search/filter-lite visual scanning through readable rows, not raw IDs only.
- Mobile text fits in rows/buttons at Expo Web mobile width.

Security acceptance criteria:

- Admin Mobile controller exposes reward fulfillment endpoints with `ADMIN_FULFILL_REWARD`.
- Reward History uses `REPORT_VIEW`.
- Catalog endpoints remain `ADMIN_MANAGE_REWARD_CATALOG`.
- Backend actor context is used, not client-sent role fields.

Explicit non-goals:

- Production SMS provider integration.
- Native camera/device validation.
- Reports and promotions.
- Admin Mobile CSV upload.

## UI Experience Contract

Surface: Admin Mobile `Rewards` tab.

Personas:

- OWNER.
- STAFF.

Primary job:

- OWNER: verify and fulfill a contractor reward handover.
- STAFF: inspect reward lifecycle history.

Screen map:

- `Rewards` top-level tab.
- OWNER sections:
  - Claim Desk.
  - Claim verification and OTP handover.
  - Reward History.
  - Catalog Management.
- STAFF sections:
  - Reward History only.

Entry path:

- Bottom tab `Rewards`.
- OWNER dashboard reward-fulfillment prompt remains informational for now.

Navigation/back behavior:

- Top-level tab; no modal navigation in this slice.
- Pull-to-refresh reloads claims, history, and catalog as role permits.

Primary actions:

- OWNER selects claim.
- OWNER sends OTP.
- OWNER enters OTP and marks Delivered.

Secondary actions:

- OWNER can lookup by Claim ID.
- OWNER can refresh.
- OWNER can continue catalog management.
- STAFF can refresh history.

Data shown:

- Claim ID.
- Contractor name and phone.
- Reward name.
- Reward points spent.
- Claim raised time.
- Claim lifecycle status.
- Delivered timestamp where applicable.

Data identity source:

- Contractor name: `contractor.name` from backend read model.
- Phone: `contractor.mobileNumber`.
- Claim ID/status/reward/points: `RewardClaim` read model.

Asset strategy:

- Fulfillment/history does not require reward images.
- Existing catalog-management reward images remain unchanged.

Empty/loading/success/error/denied states:

- Loading: status text.
- Empty Claim Desk: no active requests.
- Stale claim: backend message displayed.
- Delivered success: success status and refreshed lists.
- STAFF denied: no fulfillment/catalog sections rendered.

Role differences:

- OWNER: Claim Desk + History + Catalog.
- STAFF: History only.

Reference inputs used:

- Admin Mobile existing visual system.
- Phase 22E Admin Web semantics.
- Product-grade standard for role-aware operations surfaces.

Mobile/desktop layout expectations:

- Expo Web mobile-width UAT for Admin Mobile.
- No text overflow in claim rows, action buttons, or OTP panel.

Persistence/API readback after mutation:

- After OTP send failure/success and fulfillment, reload active claims and history.

Exact UAT target:

- Admin Mobile Web: `http://127.0.0.1:3003`
- Browser profile: clean isolated/incognito-like session by default.

## Architecture Touchpoints

- API:
  - Add Admin Mobile reward-claim endpoints mirroring Admin Web claim semantics.
  - Preserve OWNER-only fulfillment and catalog permissions.
  - Expose STAFF reward history through `REPORT_VIEW`.
- Admin Mobile:
  - Add claim/history API client types and calls.
  - Make Rewards tab role-aware.
  - Update STAFF tab set to include Rewards.
  - Preserve catalog management for OWNER only.
- Tests:
  - Admin Mobile role navigation.
  - API actor-context tests for Admin Mobile reward claim endpoints.
  - API/Admin Mobile typechecks.

## Tests And Evals

Unit:

- Update `roleNavigation.test.ts` so STAFF has Rewards history tab and no owner actions.

Integration/API:

- Add controller actor-context tests for Admin Mobile reward claim list/history/lookup/send OTP/fulfill.
- Existing permission tests continue to prove STAFF cannot fulfill or manage catalog while STAFF can `REPORT_VIEW`.

UI/E2E:

- Expo Web UAT after implementation:
  - OWNER Rewards loads Claim Desk, History, and Catalog.
  - OWNER stale claim path.
  - OWNER active claim OTP and Delivered path.
  - STAFF Rewards loads History only.

Output eval:

- `npm run test:api`
- `npm run test:admin-mobile`
- Admin Mobile Expo Web visible workflow UAT.

Trajectory eval:

- Confirm source docs were read.
- Confirm open questions were carried as boundaries.
- Confirm conflict between old STAFF tab baseline and `MADM-024` was resolved explicitly.
- Update `PHASE_22_STATUS.md` after verification.

## Exit Gates

- [x] Requirement IDs satisfied or explicitly bounded.
- [x] Output eval verdict recorded.
- [x] Trajectory eval verdict recorded.
- [x] OWNER can fulfill from Admin Mobile.
- [x] STAFF can view Reward History from Admin Mobile but cannot fulfill or manage catalog.
- [x] Backend permission gates enforce the same behavior.
- [x] No product workflow completion claim without UAT/readback evidence.

## Completion Notes

Delivered:

- Admin Mobile reward-claim endpoints added for active Claim Desk, Reward History, Claim ID lookup, OTP send, and fulfillment.
- Admin Mobile reward fulfillment audit surface records `ADMIN_MOBILE`.
- OWNER Rewards tab now shows Claim Desk, selected claim detail, OTP handover, Reward History, and existing catalog management.
- STAFF Rewards tab now shows Reward History only, with no Claim Desk, OTP, Delivered, or catalog-management controls.
- Admin Mobile role navigation now exposes `Rewards` to STAFF for history-only access.
- Shared Admin Mobile buttons and actionable rows expose semantic button/checkbox accessibility roles.
- Admin Mobile API client no longer sends `content-type: application/json` on bodyless POST requests.
- Seed reset now removes seeded reward fulfillment ledger artifacts so repeated UAT does not hit idempotency-key collisions.

Output eval:

- `npm run test:api` passed: 79 tests.
- `npm run test:admin-mobile` passed: 4 tests.
- Browser UAT confirmed OWNER Claim Desk, stale-claim handling, active OTP generation, `CLM-ACTIVE01` fulfillment readback with HTTP `201` and status `FULFILLED`, and STAFF history-only access.
- Post-UAT seed reset passed, and direct API readback confirmed `CLM-ACTIVE01` and `CLM-STALE01` are active `CHOSEN` mock claims again for manual UAT.

Trajectory eval:

- The slice followed the contract-first loop and carried open questions as boundaries.
- The harness caught three issues before completion was accepted: non-semantic React Native Web pressables, incorrect JSON content-type on bodyless POST, and seed idempotency cleanup for repeated UAT.
- A broad text assertion initially produced a false positive because older Delivered claims existed in history; final verification now requires specific API readback or exact claim response evidence.
- Future fulfillment UAT must verify the specific claim ID after mutation, not only that the word `Delivered` appears anywhere on the screen.

Evidence:

- `/tmp/rewards-phase22g-owner-final.png`
- `/tmp/rewards-phase22g-staff.png`
