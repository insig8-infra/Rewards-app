# Phase 19 Status - Admin Mobile QR Return Operations

Completed: 2026-07-06.

## Completed Goal

Delivered the Admin Mobile returned-product QR workflow as a verified vertical slice: QR status lookup, cancel for eligible unused QR, reverse for eligible scanned QR, label-removed confirmation, negative-balance/claim-impact preview, ledger updates, audit events, and API readback.

## Requirement IDs Covered

- `QR-006`
- `QR-011` through `QR-018`
- `MADM-013` through `MADM-015`
- `WEB-016`
- `WEB-017`
- `SCAN-004`
- `SCAN-009`
- `RWD-020`
- `RWD-023`
- `RWD-024`

## Questions And Decisions

- Phase-relevant blocking decision resolved: QR reversal deducts points first; if `Points Available` becomes negative, revoke newest `CHOSEN` unfulfilled reward claims until balance is non-negative or no chosen claims remain. Fulfilled claims stay fulfilled and any remaining deficit stays negative.
- Durable decision recorded in `architecture/DECISIONS.md` as `DEC-041`.
- Safe deferrals recorded: production BUSY return/cancel ingestion, native camera capture, and expired QR OWNER override remain future slices.
- Admin Web remains excluded from returned-product QR status lookup/cancel/reverse controls in v1.

## Files Changed

- `apps/api/src/qr/qr-return.service.ts`
- `apps/api/src/qr/admin-mobile-qr-return.controller.ts`
- `apps/api/src/qr/qr-return.service.test.ts`
- `apps/api/src/qr/qr.module.ts`
- `apps/api/src/qr/admin-web-qr.controller.ts`
- `apps/api/src/busy/admin-web-busy.controller.ts`
- `apps/api/src/auth/controller-actor-context.test.ts`
- `apps/admin-mobile/src/api.ts`
- `apps/admin-mobile/App.tsx`
- `.planning/v1-agentic-build/PHASE_19_EXECUTION_PLAN.md`
- `.planning/v1-agentic-build/PHASE_19_UI_SPEC.md`
- `.planning/v1-agentic-build/OPEN_QUESTIONS.md`
- `.planning/v1-agentic-build/architecture/DECISIONS.md`
- `.planning/v1-agentic-build/PHASE_19_STATUS.md`

## Implementation Notes

- Added `/api/admin-mobile/return-qr/lookup`, `/cancel`, and `/reverse` routes protected by existing OWNER/STAFF bearer-session authorization.
- Lookup uses QR token hashing and never exposes stored token hashes.
- Cancel applies only to active `PRINTED_UNCLAIMED` non-expired QR labels and invalidates the active token.
- Reverse applies only to active `SCANNED_CLAIMED` QR labels, writes a `QR_REVERSE` ledger entry, invalidates the active token, and revokes newest chosen/unfulfilled reward claims when required by the confirmed rule.
- Audit events are written for lookup, cancel, reverse, and reward revocation due to return.
- Admin Mobile now renders real return states instead of the placeholder: entry, cancel-eligible, reverse-eligible, non-actionable, cancel success, and reverse success.
- Hardening added after UAT fixture setup exposed it: Admin Web QR print and mock BUSY import domain failures now map to `400 Bad Request` instead of leaking as `500`.

## Verification

Automated gates:

- `npm run test --workspace @volt-rewards/api` - pass, 60/60.
- `npm run test --workspace @volt-rewards/admin-mobile` - pass, 2/2.
- `npm run lint` - pass across workspaces.
- `npm test` - pass across domain, API, Admin Web, mobile, and Admin Mobile.
- `git diff --check` - pass.

Visible-control UAT:

- Exact URLs:
  - API: `http://127.0.0.1:3000/api`
  - Admin Mobile web: `http://127.0.0.1:3003`
- Persona:
  - STAFF `9000000092` / PIN `2222`
  - Contractor fixture `9000001001` / MPIN `1234`
- Real setup path:
  - Imported mock BUSY invoices through API.
  - Printed QR tokens through Admin Web QR print API.
  - Scanned reverse token through end-user scan API using the contractor session and site.
  - Redeemed chosen rewards to create the unfulfilled-claim reversal case.
- Visible actions exercised:
  - Return Scan tab.
  - QR token input.
  - Lookup status.
  - Label removed/discarded checkbox.
  - Cancel QR.
  - Reverse points.
  - Scan another QR.
- API readback after visible UAT:
  - Dashboard metrics showed cancelled and reversed QR counts.
  - Cancelled QR lookup returned `CANCELLED`, token `INVALIDATED`, action `NONE`.
  - Reversed QR lookup returned `REVERSED`, token `INVALIDATED`, action `NONE`, contractor balance `400`.
  - Balance Book showed `SCAN_CREDIT`, `REWARD_REDEEM`, `QR_REVERSE`, and `REWARD_REVOKED_DUE_TO_RETURN` entries in order.

Screenshot evidence:

- `evidence/phase19-admin-mobile-return-entry.png`
- `evidence/phase19-admin-mobile-cancel-eligible.png`
- `evidence/phase19-admin-mobile-cancel-success.png`
- `evidence/phase19-admin-mobile-reverse-eligible.png`
- `evidence/phase19-admin-mobile-reverse-eligible-viewport.png`
- `evidence/phase19-admin-mobile-reverse-success.png`
- `evidence/phase19-admin-mobile-reverse-success-viewport.png`
- `evidence/phase19-admin-mobile-non-actionable.png`

Console/runtime check:

- Reload after UAT produced only normal React/Expo development informational logs. No page errors or application exceptions were observed.

## Residual Risk

- Native camera capture is not implemented in this phase; Expo Web token entry remains the local UAT path.
- Native iOS/Android device validation is still required before app-store readiness can be claimed for this workflow.
- Real BUSY return/cancel push ingestion is still deferred until the BUSY developer supplies production API details and samples.
- Expired QR manual OWNER override remains unresolved/deferred; v1 treats expired unscanned QR as non-actionable.
- Admin Mobile visual polish is functional and aligned enough for this operational slice, but broader Admin Mobile redesign against final Stitch screens remains a future UI-hardening task.

## Follow-Up

- Recommended next phase: native camera/device validation for end-user QR scan and Admin Mobile return scan, because returned-product cancel/reverse is intentionally mobile-camera-only in v1.
- After camera validation, continue Admin Mobile owner mutation surfaces: contractor create/edit/deactivate, staff management, OWNER reward fulfillment, and reports depth.
