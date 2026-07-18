# Phase 19 UI Spec - Admin Mobile Return Scan

Status: Draft.

## Product Standard

This is a high-trust operational workflow, not a demo utility. The screen must look and behave like a real field app used at a shop counter while handling a returned product.

Use the approved Admin Mobile Stitch direction recorded in `.planning/STATE.md`, especially:

- `Return Scan Camera`
- `QR Status - Reverse Eligible`
- `Cancel QR Success - Final`
- `Reverse QR Success`
- `QR Status - Non-actionable`

The implementation does not need to be pixel-perfect, but it must preserve the flow logic, hierarchy, and operational clarity.

## Screen Flow

### Return Scan Entry

- Header: `Return Scan`
- Primary affordance: camera-style scan panel.
- Local UAT fallback: QR token field.
- Primary button: `Lookup status`.
- Empty/error states must not claim a QR was scanned unless an API lookup succeeded.

### QR Status - Cancel Eligible

Shown only for active unscanned `PRINTED_UNCLAIMED` or `REPRINTED` and non-expired QR labels.

Content:

- Product name.
- Invoice number.
- QR unit ID or short reference.
- Printed date and expiry date.
- Clear state label: `Unused QR`.
- No contractor name or points summary, because no points were collected.
- Fixed reason copy: `Product Returned`.
- Required checkbox: `QR label removed and discarded`.
- Primary action: `Cancel QR`.

### QR Status - Reverse Eligible

Shown only for `SCANNED_CLAIMED` QR labels.

Content:

- Product name.
- Invoice number.
- QR unit ID or short reference.
- Contractor name.
- Contractor mobile number.
- Scan date/time.
- Points to reverse.
- Current available balance and projected balance.
- Negative-balance warning if projected balance is below zero.
- Claim impact summary if chosen rewards will be revoked.
- Fixed reason copy: `Product Returned`.
- Required checkbox: `QR label removed and discarded`.
- Primary action: `Reverse points`.

### QR Status - Non-Actionable

Shown for expired, cancelled, reversed, reprinted/replaced, invalid, or otherwise ineligible QR labels.

Content:

- Current status.
- Human-readable reason.
- Product/invoice details if safely available.
- No cancel or reverse button.
- Secondary action: scan another QR.

### Success

Cancel success:

- State: `Cancelled`.
- Shows QR discarded and no points reversed.
- Shows actor/audit note.

Reverse success:

- State: `Reversed`.
- Shows points reversed.
- Shows updated balance.
- Shows claim-revocation impact if applicable.
- Shows actor/audit note.

## Controls And Interaction Rules

- The visible checkbox must gate the visible action button.
- Backend must still reject cancel/reverse if the checkbox is absent or false.
- Destructive actions require a confirmation step or clear warning area before execution.
- Loading states must disable duplicate submissions.
- API errors must be shown inline with an actionable message.
- Back navigation must return from result/detail to Return Scan entry without losing app session.

## Visual Direction

- Use the Admin Mobile theme tokens from `apps/admin-mobile/src/theme.ts`.
- Keep status colors distinct:
  - Cancel eligible: amber/neutral.
  - Reverse eligible: red/orange warning.
  - Success: green.
  - Non-actionable: muted gray with clear reason.
- Avoid generic placeholder cards. Every status screen needs concrete product, invoice, QR, and action context where available.
- Keep the layout one-handed and field-friendly: large scan/action target, compact details, sticky or bottom-aligned destructive action where practical.

## UAT Evidence Required

- Return Scan entry screen.
- Cancel-eligible lookup.
- Cancel success.
- Reverse-eligible lookup.
- Reverse success.
- Non-actionable lookup.
- Negative-balance warning case if fixture can be constructed in the phase.
- Browser console/network check.
