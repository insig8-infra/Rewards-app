# Phase 19 Execution Plan - Admin Mobile QR Return Operations

Status: Completed on 2026-07-06. See `PHASE_19_STATUS.md`.

## Goal

Deliver the Admin Mobile returned-product QR workflow as a controlled, audited operation: scan or enter QR token, show current QR status, cancel eligible unused QR labels, reverse eligible scanned QR points, require label-removed confirmation, and show negative-balance risk before reversal.

## Requirements Covered

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
- Security plan items for QR cancel/reverse, points ledger consistency, audit logging, and role authorization.

## Inputs

- `AGENTS.md`
- `OPEN_QUESTIONS.md`
- `REQUIREMENTS_LEDGER.md`
- `ROADMAP.md`
- `architecture/QR_STATE_MACHINE.md`
- `architecture/AUTH_AND_PERMISSIONS.md`
- `architecture/REWARD_LEDGER_RULES.md`
- `SECURITY_AND_EVALUATION_PLAN.md`
- `PHASE_19_UI_SPEC.md`

## Open-Question Review

Resolved for reverse behavior:

- Reward points are currently fungible after scan. If a scanned QR is later reversed and the contractor has one or more chosen but unfulfilled reward claims, the product rule says the system must revoke/unclaim the affected reward. The phase needs a deterministic rule for which claim is affected.

Decision:

- On QR reversal, first deduct the QR points from `Points Available`.
- If the result is negative and the contractor has `CHOSEN` reward claims, revoke the newest `CHOSEN` claims until `Points Available` is non-negative or no chosen claims remain.
- Fulfilled claims stay fulfilled. If no chosen claims remain and the balance is still negative, keep the negative balance.
- Record every revoked claim and balance change in ledger and audit events.

Safe-to-defer questions with explicit assumptions:

- Real BUSY return/cancel event ingestion is deferred. This phase handles the admin mobile physical-return workflow after a returned product QR is scanned or token-entered.
- Native camera capture is deferred; token entry remains the local UAT path until the native-camera slice. The UI must still be shaped like a camera-first mobile workflow.
- Expired unscanned QR labels are non-actionable in v1 unless the user later approves an OWNER override.
- Admin Web remains excluded from returned-product QR status lookup, cancel, and reverse controls in v1.

## Scope

Included:

- Backend QR return lookup endpoint for Admin Mobile OWNER/STAFF.
- Backend cancel endpoint for `PRINTED_UNCLAIMED` non-expired QR labels.
- Backend reverse endpoint for `SCANNED_CLAIMED` QR labels.
- Server-side role enforcement for OWNER/STAFF only.
- Fixed reason `Product Returned`.
- Required label removed/discarded confirmation.
- Points ledger entry for reversal.
- QR token invalidation after cancel/reverse.
- Audit events for lookup, cancel, reverse, and claim revocation if applicable.
- Admin Mobile Return Scan screen connected to real APIs.
- Visible UI for non-actionable, cancel-eligible, reverse-eligible, success, and error states.
- Browser UAT with real printed/scanned QR fixtures and persistence readback.

Excluded:

- BUSY production return invoice PUSH ingestion, including the full-return all-lines case.
- Native camera implementation.
- Admin Web returned-product controls.
- Reports/export surfaces for returns/reversals.
- Final native iOS/Android device screenshots.

## Implementation Tasks

- [x] Confirm claim-revocation rule with user before implementing reverse completion semantics.
- [x] Add backend DTOs/service/controller for Admin Mobile QR return lookup, cancel, and reverse.
- [x] Use existing hashed-token lookup and never expose stored token hashes.
- [x] Validate QR state transitions through the domain QR state machine.
- [x] Enforce label-removed confirmation server-side for cancel/reverse.
- [x] Add points-ledger and audit writes inside database transactions.
- [x] Add claim-revocation logic after decision is locked.
- [x] Add backend tests for allowed/denied cancel and reverse states, STAFF/OWNER access, ledger writes, and audit writes.
- [x] Add Admin Mobile API client functions and typed result models.
- [x] Build Return Scan result/action screens from `PHASE_19_UI_SPEC.md`.
- [x] Run API tests, Admin Mobile typecheck, lint, full tests, and visible-control browser UAT.
- [x] Update `ROADMAP.md`, `OPEN_QUESTIONS.md`, `architecture/DECISIONS.md`, and `PHASE_19_STATUS.md`.

## Exit Gates

- [x] Phase-relevant open questions are resolved or explicitly deferred.
- [x] Cancel is impossible for scanned, expired, cancelled, reversed, or reprinted QR labels.
- [x] Reverse is impossible for unscanned, expired, cancelled, reversed, or reprinted QR labels.
- [x] Label-removed confirmation is required in both UI and backend.
- [x] STAFF and OWNER can use the workflow; forbidden actors cannot.
- [x] Admin Web has no returned-product QR lookup/cancel/reverse controls.
- [x] Reversal ledger, reward-claim impact, QR status, and contractor balance are transactionally consistent.
- [x] Negative-balance warning is visible before reverse when applicable.
- [x] Audit events identify actor, role, QR unit, reason, previous state, new state, and claim impacts.
- [x] Visible-control UAT uses real QR units and verifies database/API readback.
