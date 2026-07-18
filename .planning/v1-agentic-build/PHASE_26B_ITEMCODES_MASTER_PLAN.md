# Phase 26B Plan - ItemCodes Master And QR Point Rule Source

Status: Complete - Output And Trajectory Gates Passed
Created: 2026-07-15
Parent phase: `PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`

## Goal

Implement the Admin Web ItemCodes master as the QR point-rule source for BUSY `tmpItemCode` values. QR print must resolve points from the current ItemCode rule using the latest synced ItemCode `Price`, copy the resolved value onto each printed QR unit, and preserve that printed value even if the ItemCode rule changes later.

## Source Requirements

- `ITEM-001` through `ITEM-009`
- `RWD-023`
- Existing related requirements: `WEB-005`, `WEB-006`, `WEB-007`, `WEB-008`, `WEB-009`, `QR-025`
- Durable decisions: `DEC-034`, `DEC-045`, `DEC-046`, `DEC-050`, `DEC-051`

## User Decisions - 2026-07-15

- BUSY Sale/Return voucher metadata: capture `Date`, `tmpVchCode`, and `PartyName`.
- BUSY Sale/Return item details: capture `SrNo`, `ItemName`, `tmpItemCode`, `Price`, and `Qty`.
- ItemCodes are pulled from BUSY the first time and then maintained by regular BUSY syncs for BUSY-owned fields: `TempItemCode`, `ItemName`, and `Price`.
- `% of Price` uses the latest synced ItemCode `Price` as the point calculation base.
- `% of Price` supports fractional percentages such as `1%`, `2%`, `0.5%`, and `0.25%`.
- Example: `Price = 100` and `% of Price = 10%` resolves to `10` points.
- UI enforces exactly one editable reward rule per ItemCode: either `Absolute Points` or `% of Price`, not both.
- `% of Price Points` is a calculated display value from current synced ItemCode `Price` and `% of Price`; `Final Points` displays the value that will be copied to each printed QR unit.
- Printed QR labels show `Collect X points` using the frozen print-time `Final Points` value.
- OWNER can edit ItemCode reward rules; STAFF is read-only.
- Missing-from-BUSY ItemCodes become `Not in BUSY`; existing printed QR values remain valid, and future QR generation cannot use missing items.

## Spec-To-Eval Criteria

- Given dummy BUSY item data is refreshed, when OWNER or STAFF opens ItemCodes, then the list shows `TempItemCode`, item name, category, price, `Absolute Points`, `% of Price`, calculated `% of Price Points`, `Final Points`, derived status, BUSY presence, and last sync.
- Given an ItemCode has `Absolute Points`, when a QR is printed for a matching BUSY invoice line, then the printed QR unit stores the absolute point value.
- Given an ItemCode has `% of Price`, when a QR is printed for a matching BUSY invoice line, then the printed QR unit stores `round(price * percent / 100)` points.
- Given QR units are printed, then the print batch label copy shows `Collect X points` for the frozen point value.
- Given an ItemCode rule changes after a QR is printed, when the printed QR is scanned, then the scan/cart/ledger uses the frozen printed QR value, not the new rule.
- Given both reward rule fields are blank, then the ItemCode status is `Not In Use` and the Dashboard Attention Queue flags it.
- Given an in-use ItemCode disappears from the BUSY source refresh, then its status is `Not in BUSY` and printed QR units keep their stored values.
- Given STAFF opens ItemCodes, then STAFF can view rows but cannot edit, refresh, or save reward rules.
- Given OWNER edits an ItemCode, then invalid negative values, zero/blank selected rules, and both-rule payloads are rejected; valid edits are audited with before/after metadata.

## Implementation Tasks

- [x] Resolve Phase 26B open questions from the user.
- [x] Add ItemCode domain rule helpers and tests.
- [x] Add `ItemCode` schema/migration and generated Prisma client updates.
- [x] Add ItemCodes service/controller and dummy BUSY refresh adapter.
- [x] Resolve QR print points from ItemCodes at print time and freeze onto `QrUnit.points`.
- [x] Update invoice read/dashboard attention to reflect ItemCodes where needed.
- [x] Add Admin Web ItemCodes API client, navigation, route, and workspace.
- [x] Enforce OWNER edit and STAFF read-only behavior.
- [x] Add focused API/Admin Web tests.
- [x] Run automated verification and browser/API proof.
- [x] Update Phase 26 output and trajectory evals.

## Exit Gates

- [x] Requirement IDs satisfied.
- [x] Decisions and remaining assumptions recorded.
- [x] Spec-to-eval cases written before implementation.
- [x] Unit/domain tests pass.
- [x] API tests pass.
- [x] Admin Web tests/typechecks pass.
- [x] QR print before/after ItemCode rule change proves frozen point values.
- [x] STAFF read-only path verified.
- [x] Dashboard Attention Queue code path handles blank-rule and missing-BUSY ItemCodes.
- [x] Browser/API proof covers ItemCodes list, refresh, permission enforcement, and authenticated route availability; QR print value behavior is covered by automated API flow tests.
- [x] Output eval completed.
- [x] Trajectory eval completed.
- [x] Residual risks documented.

## Delivery Notes - 2026-07-15

- Added ItemCodes domain helpers for exact-one absolute/percent reward rules, derived statuses, and print-time point resolution.
- Added Prisma `ItemCode` schema and migration `202607150001_item_codes`.
- Updated BUSY import mapping to capture Sale/Return voucher metadata (`tmpVchCode`, `date`, `PartyName`) and line fields (`SrNo`, `tmpItemCode`, `ItemName`, `Qty`, `Price`) into raw source payloads while syncing ItemCodes from BUSY lines.
- Added guarded Admin Web ItemCodes API endpoints for list, refresh, and reward-rule update.
- Added Admin Web ItemCodes route below Promotions, with OWNER edit controls and STAFF read-only behavior.
- Added explicit ItemCodes columns for `Absolute Points`, `% of Price`, calculated `% of Price Points`, and `Final Points`.
- Updated QR print repositories so future QR units resolve points from the current ItemCode rule and store the resolved value on `QrUnit.points`; reprints preserve already-frozen values.
- Updated QR print batch copy so labels show `Collect X points`.
- Updated invoice read and dashboard attention paths to surface ItemCode point previews and ItemCode hygiene issues.

## Clarification Update - 2026-07-15

- Confirmed with the client that QR points freeze at QR print time, not at scan/claim time.
- Confirmed ItemCodes are initially pulled from BUSY and then kept current by sync for BUSY-owned fields: `TempItemCode`, `ItemName`, and `Price`.
- Updated Admin Web ItemCodes to expose the client-facing point model: `Absolute Points`, `% of Price`, calculated `% of Price Points`, and `Final Points`.
- Updated latest print batch label copy to show `Collect X points`.

## Verification Summary - 2026-07-15

- `npm run test --workspace @volt-rewards/domain` - PASS, 43/43.
- `npm run test --workspace @volt-rewards/api` - PASS, 99/99.
- `npm run test --workspace @volt-rewards/admin-web` - PASS, 14/14.
- `npm run typecheck` - PASS across domain, API, Admin Web, mobile, and admin-mobile.
- `npm test` - PASS across all workspaces: domain 43/43, API 99/99, Admin Web 14/14, mobile 23/23, admin-mobile 4/4.
- `npm run build --workspace @volt-rewards/admin-web` - PASS, including generated `/item-codes` route.
- `git diff --check` - PASS before documentation closeout.
- `npm run prisma:migrate:deploy --workspace @volt-rewards/api` - PASS with explicit approval; applied `202607150001_item_codes` to the configured database.
- API proof: `POST /api/admin-web/item-codes/refresh` created 11 BUSY ItemCodes; `GET /api/admin-web/item-codes` as STAFF returned 11 rows; STAFF reward-rule `PATCH` returned 403.
- Admin Web proof: OWNER dev login reached `/item-codes` with HTTP 200, and the authenticated backend proxy returned 11 ItemCode rows.
- Clarification verification: domain/API/Admin Web tests passed after the column/label update; Admin Web build passed; refreshed API on `127.0.0.1:3010` returned `finalPoints` and `absolute pts`; authenticated `/item-codes` page rendered `Absolute Points`, `% of Price Points`, and `Final Points` headers.

## Residual Risks And Follow-Ups

- Rounding is currently nearest integer via `round(price * percent / 100)` because the user supplied the base and examples but not a separate rounding policy. Change this only after a new product decision.
- The live seeded BUSY data had no missing/blank ItemCodes, so Dashboard Attention was verified by implementation path and review rather than a seeded live missing-row fixture.
- Full interactive Playwright proof was not available in this workspace; UI proof used authenticated route/proxy checks plus API permission probes. Automated API/domain tests cover the QR print value behavior.
- Real BUSY API integration still needs production samples for partial returns, full returns, duplicate-line matching, discounts/GST semantics, item-master change feed, and authentication.
