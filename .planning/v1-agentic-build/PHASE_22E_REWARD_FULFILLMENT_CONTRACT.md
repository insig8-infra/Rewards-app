# Phase 22E Contract - Admin Web Reward Fulfillment Recovery

Status: Completed
Created: 2026-07-07

## Source Inputs

- `AGENTS.md`
- `apps/admin-web/AGENTS.md`
- `PHASE_22_STATUS.md`
- `PHASE_20_ADMIN_WEB_CONTRACT.md`
- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`

## Scope

Recover the Admin Web Rewards page into an OWNER-only reward fulfillment desk.

This slice covers:

- Pending reward claim list.
- Claim ID lookup.
- Contractor/reward verification before handover.
- Mock OTP send for local/dev until production SMS provider is selected.
- OTP entry and OWNER mark `Fulfilled / Delivered`.
- Post-fulfillment readback from backend.
- Role gating so STAFF cannot access or perform fulfillment.

This slice does not cover:

- Final reward catalog content/images/thresholds beyond current configurable seed/catalog data.
- Reports exports, because report filters/columns/export format remain open questions.
- Promotions management, because placement, asset type, scheduling, and targeting remain open questions.

## Open Questions Brought Forward

From `OPEN_QUESTIONS.md`:

- Reports filters, export columns, WhatsApp sharing method, and Hindi report output remain open. Do not implement reports beyond the existing shell until answered or explicitly scoped.
- Promotions placements, allowed asset types, scheduling, and targeting remain open. Do not implement promotions beyond the existing shell until answered or explicitly scoped.
- Final reward catalog item list, images, point costs, tier thresholds, and item-code point mapping remain production content, but current configurable seed/catalog data is sufficient for this Admin Web fulfillment workflow.

## Screen Contract

Persona: OWNER. STAFF is denied by route/auth and should see no fulfillment surface.

Primary job: verify a contractor reward claim and mark physical handover complete after contractor OTP confirmation.

Route: `/rewards`

Entry paths:

- Sidebar `Rewards`.
- Dashboard pending reward attention item.
- Direct URL `/rewards` for OWNER.

Primary screens/states:

- Pending claims desk: searchable/filterable/sortable list of reward claims with Claim ID, contractor, reward, Rs value, chosen date, and current status.
- Claim detail: selected/loaded claim facts, contractor identity, points balance, reward, claim timeline, and action eligibility.
- OTP handover: Send OTP, show local/dev mock OTP only in development response, enter OTP, mark Delivered.
- Fulfilled state: shows fulfilled timestamp and disables further fulfillment.

Navigation behavior:

- Rewards page is a top-level Admin Web route.
- Selecting a pending claim loads detail in-place without leaving the route.
- Refresh reloads pending/list state and preserves the current Claim ID where possible.

Data shown:

- Claim ID and claim status.
- Contractor name, contractor code, mobile number, tier, total accumulated points, and points available.
- Reward name, Rs/points deducted, chosen date/time, cancellation/fulfillment timestamps where applicable.
- OTP expiry and local/dev delivery state.

Role behavior:

- OWNER can list, lookup, send OTP, and fulfill.
- STAFF cannot access `/rewards`; backend still enforces `ADMIN_FULFILL_REWARD`.

Asset strategy:

- This Admin Web desk does not require reward images to complete fulfillment. Reward catalog image quality remains covered by end-user reward catalog phases.

## Completion Gate

- API exposes an OWNER-only pending/list endpoint for Admin Web reward claims.
- Admin Web Rewards page uses search/filter/sort and a detail workflow, not only a bare Claim ID form.
- Send OTP does not fulfill the reward.
- Fulfill requires challenge id and OTP.
- Fulfilled readback shows claim status and fulfilled timestamp.
- STAFF cannot access the page or backend action.
- `npm run test:api` passes.
- `npm run test:admin-web` passes.
- Browser UAT verifies OWNER claim list/lookup/OTP/fulfill or, if no pending claim exists in current data, verifies list/empty state plus API contract tests and records the data gap.

## Delivery Notes

Delivered on 2026-07-07:

- Added OWNER-only `GET /admin-web/rewards/claims`.
- Admin Web Rewards now loads a searchable/filterable/sortable reward-claim desk.
- Default view focuses on `CHOSEN` pending handover claims and does not auto-select hidden cancelled/fulfilled claims.
- Claim ID lookup remains available for direct contractor handover.
- Claim detail originally included contractor account totals; superseded by `PHASE_22E_UAT5_REWARD_SEMANTICS_CONTRACT.md`, claim detail must show claim-related fields only and not `Available Balance` or `Lifetime Total`.
- OTP send and fulfillment controls remain disabled unless backend readback says the claim is eligible.
- STAFF remains blocked by route and backend permission.

Verification:

- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- Runtime API smoke check: OWNER `GET /api/admin-web/rewards/claims` returned `200`; STAFF returned `403`.
- Browser UAT on `http://127.0.0.1:3001/rewards` passed for OWNER route render, summary metrics, pending-empty state, list controls, no hidden selected claim, and zero current-session console errors.
- Evidence: `.planning/v1-agentic-build/evidence/phase22e-rewards-empty-pending.png`.

Runtime data gap:

- Current Supabase runtime data has 6 reward claims: 1 `CANCELLED_BY_CONTRACTOR`, 3 `REVOKED_DUE_TO_RETURN`, and 2 `FULFILLED`.
- No `CHOSEN` pending reward claim existed during browser UAT, so OTP send/fulfill was verified by automated API/Admin Web client tests and should be browser-tested again when a pending claim exists.
