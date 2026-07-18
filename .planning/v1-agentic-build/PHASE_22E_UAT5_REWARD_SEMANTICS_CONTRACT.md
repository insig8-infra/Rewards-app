# Phase 22E UAT5 Contract - Reward Claim Semantics And History

Status: Completed; browser UAT passed; runtime database connectivity restored via Supabase Shared Pooler
Created: 2026-07-07

## Source Inputs

- User clarification on reward statuses and fulfillment semantics, 2026-07-07.
- `AGENTS.md`
- `PHASE_22E_REWARD_FULFILLMENT_CONTRACT.md`
- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`

## Corrected Product Semantics

Contractor frontend reward statuses are:

- `Locked`: not enough points or tier not unlocked.
- `Get Now`: reward is available to claim.
- `Claim Raised`: contractor selected `Get Now` and a Claim ID exists.
- `Delivered`: retailer/OWNER fulfilled the reward.

Admin portal surfaces are:

- `Claim Desk`: active `Claim Raised` requests only. OWNER can fulfill. STAFF cannot fulfill.
- `Reward History`: full reward lifecycle history for all contractors, including raised, cancelled by contractor, revoked due to return, and delivered events. OWNER and STAFF can view.

Important distinction:

- `Cancelled by Contractor` is not an active claim desk status. If contractor cancels before delivery, the Claim ID no longer appears as fulfillable. The claim row remains only as history/audit, and points are restored through Balance Book.
- Before OTP send or final `Delivered`, backend must re-check the claim is still `Claim Raised`.
- If backend detects the claim disappeared/cancelled before OTP or delivery, Admin Web must show `Claim Request No longer available. History recorded.` and refresh the claim desk/history.

## Scope

This correction covers Admin Web reward fulfillment and backend/admin read models.

Included:

- Admin Web `/rewards` accessible to OWNER and STAFF.
- OWNER sees active Claim Desk and Reward History.
- STAFF sees Reward History and no fulfillment controls.
- Active Claim Desk lists only `CHOSEN` claims displayed as `Claim Raised`.
- Reward History lists all claim developments with contractor name, phone number, reward name, points spent, status, claimed date-time, fulfilled date-time where present, and lifecycle development.
- Claim details remove contractor account fields that are not claim-specific: `Available Balance` and `Lifetime Total`.
- Mock data includes at least one fulfillable Claim ID and one stale Claim ID that appears initially but becomes unavailable on OTP send.
- Claim Desk can refresh manually and auto-refreshes on a short polling interval so new/cancelled claim requests are picked up without full page reload.
- Dropdown/input controls must avoid text overlap with arrows at desktop widths.

Excluded:

- Full Admin Mobile OWNER reward fulfillment implementation. It remains a requirement gap unless completed in a dedicated Admin Mobile slice.
- End-user mobile visual redesign of reward tiles. Only API status vocabulary may be aligned here if low-risk.

## Completion Gate

- `npm run test:api` passes.
- `npm run test:admin-web` passes.
- `npm run test:mobile` passes.
- Runtime seed has at least one active `Claim Raised` mock claim visible in Claim Desk.
- Runtime seed has one stale mock claim that returns `Claim Request No longer available. History recorded.` on Send OTP and moves out of Claim Desk.
- OWNER can send OTP and mark a normal mock claim Delivered in browser UAT.
- STAFF can open `/rewards`, see Reward History, and cannot see/use fulfillment controls.
- Current-session browser console has zero app runtime errors.

## Implementation Notes

Completed in code on 2026-07-07:

- Backend active Claim Desk now reads only `CHOSEN` claims and displays them as `Claim Raised`.
- Backend Reward History read model returns all claim lifecycle developments for OWNER/STAFF report access.
- Backend re-checks active `Claim Raised` state before OTP send and final delivery.
- Seed data defines `CLM-ACTIVE01` for normal fulfillment UAT and `CLM-STALE01` for the cancelled-before-OTP UAT path.
- Admin Web `/rewards` is role-aware: OWNER sees active Claim Desk plus Reward History; STAFF sees Reward History only.
- Claim detail removed account-level `Available Balance` and `Lifetime Total`.
- Contractor mobile vocabulary now displays `Get Now`, `Claim Raised`, and `Delivered`.
- Native select controls have additional right padding to avoid dropdown-arrow text overlap.

Verification completed:

- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm run test:mobile` passed.
- Browser UAT passed for OWNER active Claim Desk, stale claim rejection, normal Delivered transition, STAFF history-only access, and removal of non-claim fields from claim details.
- `CLM-STALE01` appeared in active Claim Desk, returned `Claim Request No longer available. History recorded.` on Send OTP, disappeared from active Claim Desk, and remained visible in Reward History as `Cancelled / Points Restored`.
- `CLM-ACTIVE01` sent a local/dev OTP, was marked `Delivered`, disappeared from active Claim Desk, and remained visible in Reward History as `Delivered`.
- STAFF login opened `/rewards`, displayed Reward History, and did not render Claim Desk, Reward fulfillment, Send OTP, or Mark Delivered controls.
- Browser evidence captured:
  - `.planning/v1-agentic-build/evidence/phase-22e-owner-claims-before.png`
  - `.planning/v1-agentic-build/evidence/phase-22e-owner-stale-claim.png`
  - `.planning/v1-agentic-build/evidence/phase-22e-owner-delivered-claim.png`
  - `.planning/v1-agentic-build/evidence/phase-22e-staff-history-only.png`
- Expected console note: the stale-claim path logs an HTTP `400 Bad Request` resource entry because the backend deliberately rejects `CLM-STALE01` on Send OTP. No page runtime exceptions were captured during the passed browser UAT.
- After browser UAT, `npm run db:seed --workspace @volt-rewards/api` was run again and direct API verification confirmed both `CLM-STALE01` and `CLM-ACTIVE01` are restored as active `CHOSEN` mock claims for manual UAT.

Runtime connectivity notes:

- Direct Supabase DB host is IPv6-only from this environment, so Node/Prisma cannot rely on it for local/dev UAT.
- `.env.local` now includes non-secret Supabase Shared Pooler settings for `aws-1-ap-southeast-1.pooler.supabase.com:5432`; password remains sourced from `SUPABASE_DATABASE_PASSWORD`.
- `npm run db:seed --workspace @volt-rewards/api` passed after switching to the Shared Pooler.
- Current local/dev SSL compatibility uses `SUPABASE_DATABASE_USE_LIBPQ_COMPAT=true`; production launch must use verified TLS with Supabase CA certificate or an approved managed Postgres TLS runbook.

## Client Demo 2 Amendment - 2026-07-14

Phase 22E remains historically complete for the original reward-semantics correction, but Client Demo 2 adds Phase 26A requirements:

- Active Claim Desk must auto-refresh whenever the Rewards tab is opened and must return only valid fulfillable `Claim Raised` claims. Stale/cancelled/revoked/delivered claims must not be shown as fulfillable work.
- Reward History must add a date-range filter using the Reports pattern, including `From` and `To`.
- Reward History must support report-style per-column sorting.
- Reward History column `Unlocked At` is renamed to `Claimed Date/Time`.
- Reward History must include `Fulfilled Date/Time`.

These requirements are not satisfied by the original Phase 22E browser evidence and must be verified under Phase 26A.
