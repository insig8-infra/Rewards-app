---
name: qr-lifecycle
description: |
  Implement or review QR unit lifecycle behavior. Use when working on QR print, scan, expiry, cancel, reprint, reverse, token validation, or QR audit tests. Do NOT use for reward catalog UI or general dashboard layout.
version: 0.1.0
authority: draft-only
---
# QR Lifecycle

## When To Use

- Implementing QR unit creation from invoice line quantities.
- Implementing QR scan validation and failure reasons.
- Implementing expiry, cancel, reprint, or reverse behavior.
- Writing or reviewing QR lifecycle tests.

## When Not To Use

- Reward catalog eligibility unrelated to QR state.
- Admin dashboard chart styling.
- Mobile navigation layout.

## Workflow

1. Read `REQUIREMENTS_LEDGER.md` QR, WEB, SCAN, and MADM requirements relevant to the change.
2. Identify the current and target QR status.
3. Check actor permission: Contractor, Team Member, OWNER, STAFF, or system job.
4. Enforce state transition in backend/domain code.
5. Record audit event for print, scan, cancel, reprint, or reverse.
6. Add tests for allowed transition, denied transition, and idempotency/duplicate behavior.

## Required Checks

- QR token is non-guessable and does not encode point value.
- Reprint creates replacement token and invalidates old token.
- Cancel is only for active unscanned non-expired QR (`PRINTED_UNCLAIMED` or `REPRINTED`).
- Reverse is only for Scanned/Claimed QR.
- Expired unscanned QR cannot be scanned.
- Label removed/discarded confirmation is required for cancel and reverse.
