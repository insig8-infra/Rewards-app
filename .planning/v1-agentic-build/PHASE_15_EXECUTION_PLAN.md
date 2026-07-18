# Phase 15 Execution Plan - Rewards, Balance Book, And OWNER Fulfillment

## Goal

Deliver the first production-shaped Rewards slice: Contractor can view reward catalog eligibility, redeem an eligible reward, receive a Claim ID, cancel before physical collection, and review the Balance Book; OWNER can fulfill a claim from Admin Web through Claim ID lookup, OTP, and Delivered/Collected marking.

## Source Requirements

- `CAPP-001`
- `CAPP-006`
- `RWD-001` through `RWD-023`
- `MADM-024`
- `QR-017`
- `QR-018`

## Scope

Included:

- Configurable seeded reward catalog with realistic physical rewards such as toolbox and air fryer.
- Tier model using Silver, Gold, Platinum, and Diamond.
- Catalog eligibility based on Points Available and any tier requirement.
- Reward tiles showing locked/eligible/chosen/fulfilled state and progress gap.
- Reward detail with enabled/disabled `Redeem Now`.
- Redeem flow that deducts points, creates Claim ID, records ledger, and refreshes eligibility.
- Cancel chosen reward before OWNER Fulfilled/Delivered marking, including after OTP initiation.
- Balance Book with chronological reward/points activity and basic filters.
- Admin Web OWNER Claim ID lookup, mock OTP initiation, OTP verification, and Fulfilled/Delivered action.
- STAFF forbidden path for fulfillment APIs and UI.
- Tests for points ledger consistency, cancellation, fulfillment, eligibility, and negative balance rule boundary where existing reversal hooks allow.
- Visible-control UAT for mobile and Admin Web, with API/database readback.

Excluded:

- Final client-approved reward catalog content, reward images, and commercial point costs.
- Final Silver/Gold/Platinum/Diamond threshold values beyond configurable seed defaults.
- Production SMS/WhatsApp OTP provider.
- Admin Mobile reward fulfillment screen.
- Full returned-product QR reverse workflow; Phase 15 only preserves reward/ledger rules needed by that later slice.
- Final `tmpItemCode` / ItemCodes reward-rule management UI. Superseded by Client Demo 2: this is now routed to Phase 26B Admin Web ItemCodes, with fixed points and possible `% of Price` rules.

## Open Questions

Relevant questions from `OPEN_QUESTIONS.md`:

- Final reward catalog item list, images, point costs, and tier requirements.
- Final Silver/Gold/Platinum/Diamond threshold values.
- Final ItemCodes mapping, including unmapped, ineligible, `Not In Use`, `Not in BUSY`, fixed-points, and optional `% of Price` behavior.
- Production OTP/SMS provider.

Blocking before implementation:

- None. User decisions are recorded in `DEC-032`, `DEC-033`, and `DEC-034`.

Needed before phase completion:

- Seed catalog and tier thresholds must be clearly marked as configurable mock/business content.
- Mock OTP boundary must be explicit in UI copy/dev metadata and not mistaken for production SMS.

Safe to defer with explicit assumption:

- Use seed catalog values for development until the client provides final reward content.
- Use mock/local OTP delivery until provider selection.
- Use existing QR/scan ledger values for available points; item-code earning table integration is deferred to the QR/BUSY points-rule slice.

User decisions recorded:

- Rewards include physical items such as toolbox and air fryer.
- Tiers are Silver, Gold, Platinum, and Diamond.
- Tiers unlock sets of rewards based on total points collected and points available.
- Product tiles visually show how far the contractor is from unlocking a reward.
- Total accumulated points are lifetime gross and do not decrease on reversal.
- Points Available is current redeemable balance.
- Contractor can cancel until OWNER marks Fulfilled/Delivered after OTP entry.
- Fulfilled reward stays fulfilled if later return creates negative balance.
- QR earning is based on managed BUSY ItemCodes. Historical Phase 15 examples used fixed points such as Wire 30, Switches 10, Fans 50, and Lights 20; Phase 26B adds the ItemCodes management surface and optional `% of Price` rule decisions.

## UI Experience Contract

Surface:

- End-user mobile app `Rewards` tab.
- Admin Web reward fulfillment section.

Persona:

- Contractor.
- Team Member sees no reward redemption controls unless explicitly authorized later.
- OWNER.
- STAFF denied/read-only where surfaced.

Primary jobs:

- Contractor checks available rewards, understands what is unlocked, redeems a reward, sees Claim ID, cancels if needed before collection, and reviews Balance Book.
- OWNER receives Claim ID from contractor, looks it up, sends OTP, verifies OTP, and marks reward Delivered/Collected.

Entry path:

- Mobile: authenticated Contractor -> bottom navigation -> Rewards.
- Admin Web: authenticated OWNER -> Rewards/Fulfillment navigation.

Primary actions:

- View catalog.
- Open reward detail.
- Redeem eligible reward.
- Cancel chosen reward before fulfillment.
- Filter/read Balance Book.
- Lookup Claim ID.
- Send OTP.
- Fulfill reward after OTP verification.

Secondary actions:

- Switch Hindi/English on mobile.
- Refresh catalog/balance.
- Copy or visually identify Claim ID.
- Handle wrong/expired OTP and non-fulfillable claim states.

Data shown:

- Current tier.
- Total accumulated points.
- Points Available.
- Reward catalog item name, points required, tier requirement, eligibility, points/tier gap, status.
- Claim ID and claim status.
- Balance Book entries with date/time, event type, points delta, balance after, related reward/claim/QR context, and negative balance marker.
- Admin fulfillment lookup: contractor identity/contact, reward, status, points deducted, OTP/fulfillment readiness.

Empty/loading/success/error/denied states:

- Required on catalog, reward detail, redeem/cancel, Balance Book, Admin Web lookup, OTP send, and fulfillment.

Role differences:

- Contractor can redeem/cancel own chosen unfulfilled rewards.
- Team Member cannot redeem contractor rewards.
- OWNER can fulfill claims.
- STAFF cannot fulfill claims and must be blocked server-side.

Reference inputs used:

- `FRONTEND_EXPERIENCE_STANDARD.md`.
- Phase 14 mobile theme/localization patterns.
- PayTM/PhonePe-style Indian payments-app UX patterns as inspiration only for mobile rewards and balance-book presentation.
- Existing Admin Web operations style for OWNER fulfillment, with compact tables/panels and no marketing-style layout.

Mobile/desktop layout expectations:

- Mobile Rewards must remain one-handed, localized, and store-ready.
- Admin Web must be dense, calm, and scan-friendly with Claim ID lookup as the primary control.
- Text must fit in English and Hindi without overlapping controls.

Persistence/API readback after mutation:

- Redeem verified by claim lookup, updated contractor balance, and ledger entry.
- Cancel verified by claim status, restored balance, and ledger entry.
- Fulfillment verified by Admin Web lookup, claim status, fulfilled timestamp, and Balance Book marker.

Exact UAT URL, simulator, or device target:

- Mobile: Expo Web mobile viewport at `http://127.0.0.1:3002`, backed by API `http://127.0.0.1:3000/api`.
- Admin Web: `http://127.0.0.1:3001`, backed by API `http://127.0.0.1:3000/api`.

## Architecture Touchpoints

- Domain services: rewards, points ledger, role permissions.
- API routes: `/rewards/*`, `/admin-web/rewards/*`.
- Database tables: `Contractor`, `RewardCatalogItem`, `RewardClaim`, `PointsLedgerEntry`, `OtpChallenge`, `AuditEvent`.
- UI surfaces: `apps/mobile`, `apps/admin-web`.
- Background jobs: none.
- Audit events: reward redeem, cancel, OTP send, fulfillment, forbidden fulfillment attempt where supported.

## Tests And Evals

- Unit: reward eligibility/tier helpers, mobile formatting helpers, API service helpers where added.
- Integration: persisted redeem, cancel, catalog, balance book, Admin Web fulfillment, STAFF denial.
- API contract: DTO validation, actor scope, idempotency/duplicate prevention where applicable.
- UI/E2E: visible mobile reward redeem/cancel and Admin Web fulfillment smoke tests.
- Frontend experience quality: required against `FRONTEND_EXPERIENCE_STANDARD.md`.
- Localization: Hindi/English reward copy verified on mobile.
- Browser workflow UAT:
  - Exact URL(s): `http://127.0.0.1:3002` and `http://127.0.0.1:3001`.
  - Persona/actor context: Contractor, OWNER, STAFF denied path.
  - Hydration/console/network check: required.
  - Visible-control interaction proof: required.
  - Happy path: Contractor redeem -> OWNER fulfill.
  - Edit/update path: refresh/readback after claim state changes.
  - Delete/deactivate/cancel path: Contractor cancel before fulfillment.
  - Denied/read-only role path: STAFF cannot fulfill.
  - Persistence checks after each mutation: required.
  - Desktop/mobile layout checks: mobile viewport for app and desktop for Admin Web.
- Security: no OTP/Claim ID leakage beyond intended dev metadata; server-side role enforcement; contractor scope enforcement; no raw sensitive token logs.
- Manual review: user validates visible mobile and web reward flows before completion.

## Implementation Tasks

- [x] Record Phase 15 reward decisions in planning docs.
- [x] Review current framework docs through Context7 where implementation details depend on Prisma/NestJS/Next.js/Expo APIs.
- [x] Inspect existing reward domain, Prisma schema, API modules, mobile Rewards placeholder, and Admin Web rewards route.
- [x] Add or refine seed catalog/tier data.
- [x] Implement persisted Rewards API catalog/detail/redeem/cancel/balance-book.
- [x] Implement Admin Web reward fulfillment APIs with mock OTP.
- [x] Wire mobile Rewards tab to catalog, detail, redeem, cancel, and Balance Book.
- [x] Wire Admin Web reward fulfillment UI.
- [x] Add focused domain/API/mobile/admin tests.
- [x] Run lint, tests, and type checks.
- [x] Run visible-control UAT on mobile and Admin Web.
- [x] Update Phase 15 status with verification evidence and residual risks.

## Exit Gates

- [x] Requirement IDs satisfied for Phase 15 scope.
- [x] Phase-relevant open questions were brought forward before implementation.
- [x] User decisions or explicit assumptions were recorded.
- [x] UI experience contract completed for mobile and Admin Web surfaces.
- [x] Frontend experience quality gate completed.
- [x] Tests pass.
- [x] Browser workflow UAT completed for mobile and Admin Web.
- [x] Browser UAT exercised visible controls directly; no hidden-input or direct API shortcut was used as sole proof.
- [x] Exact user-facing local URLs were tested.
- [x] Browser console/network/hydration failures were checked.
- [x] Each UI mutation verified through persisted API/database readback.
- [x] Denied paths tested.
- [x] Audit events added for high-risk actions where supported.
- [x] Security/eval gate completed.
- [x] Residual risks documented.
