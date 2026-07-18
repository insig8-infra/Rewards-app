# Client Demo 2 Triage - Admin Web, ItemCodes, And Scan Site Selection

Status: Assimilated Into Planning Docs - Phase 26 Complete
Created: 2026-07-14
Source: `client_demo_2.md`

## Purpose

Convert the Client Demo 2 feedback into phase-scoped requirements before new implementation work continues. This file is the intake bridge between the raw demo notes and the durable requirements, architecture, API, data model, roadmap, and evaluation gates.

## Locked Corrections

- Admin Web Invoice Ledger needs the same date-range filter pattern used by Reports, including `From` and `To` fields.
- Admin Web contractor registration needs an open text area for where the contractor belongs / is associated. The exact final label can be polished during implementation, but the field is now required.
- Contractor Detail > Sites must drill into site-wise analytics, including QR scan data, item-wise data, item value for that site, and points collected for that site.
- Admin Web Reward History needs a date-range filter, report-style column sorting, `Claimed Date/Time`, and `Fulfilled Date/Time`.
- Active Claim Desk must auto-refresh whenever the Rewards tab is opened and list only valid fulfillable `Claim Raised` claims. Stale/cancelled claims belong in Reward History, not the active desk.
- `Manage Reward Catalog > New Reward` must system-populate the reward code.
- Promotions needs horizontal marquee text scroller controls: font type, bold, italic, and color. Font choices must be capped to Hindi-safe options.
- Admin Web needs a new `ItemCodes` tab below Promotions.
- ItemCodes is the operational master for BUSY `TempItemCode` reward rules. BUSY supplies item code, item name, category, and price. OWNER-managed reward-rule fields are `Absolute Points` and `% of Price`; calculated `% of Price Points` and `Final Points` are displayed by Volt Rewards.
- If both `Absolute Points` and `% of Price` are blank, the ItemCode status is `Not In Use`. If exactly one reward rule is populated, the status is `In Use`; both populated is invalid for active use.
- If an in-use item disappears from BUSY, the status becomes `Not in BUSY`. Existing printed QR codes and allocated points remain valid, but the item is unavailable for future QR generation because future BUSY invoices will not include it.
- Until BUSY API integration exists, use a realistic dummy ItemCodes list with `Absolute Points` populated and `% of Price` blank.
- Dashboard Attention Queue must flag ItemCodes with both reward fields blank.
- Contractor and Team Member Scan QR must require a fresh site selection every time the Scan QR workflow is entered. The scanner/frame remains hidden until a site is selected.
- After `Add to account`, the active scan-site selection is cleared so the next scan batch requires site selection again.

## Phase Routing

Executable phase plan: `PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`.

### Phase 26A - Admin Web Demo 2 Corrections

Scope:

- Invoice Ledger date range.
- Contractor open text-area field.
- Contractor Site analytics drilldown.
- Reward History date range, sorting, column labels, and fulfilled date.
- Claim Desk auto-refresh / stale-claim exclusion.
- System-populated new reward code.
- Promotions marquee text controls.

Status:

- PASS on 2026-07-14 with output eval, trajectory eval, tests, DB readback, and Admin Web browser proof.

### Phase 26B - ItemCodes Master And QR Point Rule Source

Scope:

- Data model, API, Admin Web tab, dummy seed data, refresh/manual sync behavior, status derivation, dashboard attention item, and QR print-time point resolution.
- Printed QR units must store the resolved point value at print time so later ItemCode changes do not alter already printed labels.

Status:

- PASS on 2026-07-15 under `PHASE_26B_ITEMCODES_MASTER_PLAN.md`.
- `% of Price` uses the latest synced ItemCode `Price` at print time; fractional percentages are allowed; exactly one reward rule is enforced; OWNER edits and STAFF is read-only; printed QR labels show `Collect X points`.

### Phase 26C - Scan Site Selection Tightening

Scope:

- End-user Contractor and Team Member Scan QR entry must start with no active scan-site selection.
- Scanner UI appears only after explicit site selection.
- `Add to account` clears the active scan-site selection and cart context for the next scan batch.
- Persistent reserved cart behavior from `DEC-050` remains intact; clearing the UI's active scan-site selection must not lose already reserved items if a technical commit failure keeps them retryable.

Status:

- PASS on 2026-07-15 under `PHASE_26C_SCAN_SITE_SELECTION_PLAN.md`.
- Verified with mobile/API automated tests, visible Contractor and Team Member Expo Web proof, forced commit-failure retry proof, viewport screenshots, and API scan-history readback.

### Phase 26D - Output Eval, Trajectory Eval, And Stale-Doc Sweep

Scope:

- Create phase-local output and trajectory evals.
- Verify stale assumptions were removed or explicitly marked superseded.
- Run visible Admin Web and mobile viewport proof for changed surfaces.
- Record any new harness learning before broad feature work resumes.

## Bring-Forward Questions

These questions were brought forward before Phase 26B implementation decided behavior:

1. [Resolved 2026-07-15] `% of Price` points use the latest synced ItemCode `Price` field.
2. [Resolved 2026-07-15] Fractional percentages are allowed and the implementation rounds to the nearest integer unless a later product decision changes rounding.
3. [Resolved 2026-07-15] UI enforces exactly one editable reward rule: `Absolute Points` or `% of Price`; `% of Price Points` and `Final Points` are calculated display fields.
4. [Resolved 2026-07-15] OWNER can edit ItemCode reward rules; STAFF is read-only.
5. [Follow-up] Contractor text-area production label can still be polished; Phase 26 used the client phrase `Where they belong to`.
6. [Follow-up] Site analytics export remains future scope; Phase 26 implements on-screen drilldown.

## Implementation Guard

Do not implement this as scattered fixes. Phase 26 must start with a small contract and output eval. Existing completed phase docs should keep their historical evidence, but any superseded behavior must be labeled as superseded so future agents do not treat old assumptions as current requirements.
