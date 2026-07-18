# Phase 29 Plan - BUSY Developer API Handoff

Status: Complete - Output And Trajectory Gates Passed  
Created: 2026-07-17  
Source: `SaleWithRef.txt`, Phase 28 adapter hardening, `client-deliverables/BUSY_API_INTEGRATION_SPEC.md`

## Intent

Create a BUSY-developer-facing requirements handoff that explains exactly what Volt Rewards needs from live BUSY so the current mock adapter can be replaced by actual BUSY data. This phase is documentation and contract alignment only; it does not implement production BUSY networking.

## Source Contracts

- `SaleWithRef.txt`
- `client-deliverables/BUSY_API_INTEGRATION_SPEC.md`
- `PHASE_20_BUSY_RETURN_CONTRACT.md`
- `PHASE_28_BUSY_ADAPTER_HARDENING_PLAN.md`
- `architecture/DECISIONS.md` DEC-018, DEC-023, DEC-034, DEC-042, DEC-045, DEC-053
- `OPEN_QUESTIONS.md`
- `REQUIREMENTS_LEDGER.md`

## Requirements Covered

- `WEB-005`, `WEB-019`, `WEB-020`
- `WEB-023`, `WEB-024`, `WEB-025`
- `ITEM-001` through `ITEM-009`
- `QR-019`, `QR-020`
- `RWD-023`

## Open Questions Review

Resolved for this handoff:

1. BUSY must not write directly to Volt Rewards PostgreSQL; BUSY must PUSH data to Volt Rewards backend APIs.
2. `tmpVchCode` is the unique sale invoice id for this integration.
3. Sale metadata and line requirements should use the actual `SaleWithRef.txt` field names.
4. BUSY sends sale invoice, return invoice, and item-master facts only. A full return invoice contains all original sale line items and quantities, so the sale and return net to zero. Volt Rewards decides QR, points, and reward effects.
5. ItemCodes reward rules are Volt-owned; BUSY only supplies `tmpItemCode`, `ItemName`, category/group, price, and active/missing status.

Still open and must be asked from BUSY developer:

1. Exact return invoice field that links the return invoice to original sale `tmpVchCode`.
2. Partial return and full return samples, where the full return sample contains all original sale line items and quantities.
3. Whether BUSY needs a local sync-agent/service to PUSH reliably.
4. Stable line identity behavior after invoice edits.
5. Item master change-feed or full-sync mechanics.
6. Exact price semantics for `% of Price` ItemCode rules.

## Output Eval Criteria

1. Handoff clearly separates mandatory sale, return, item master, idempotency, security, and sample requirements.
2. Handoff uses actual `SaleWithRef.txt` field names, including `Date`, `VchType`, `VchNo`, `BillingDetails.tmpVchCode`, `BillingDetails.PartyName`, `SrNo`, `ItemName`, `tmpItemCode`, `Price`, and `Qty`.
3. Handoff is PUSH-only and contains no code snippets.
4. Handoff names what BUSY should not provide or decide: QR tokens, reward points, QR cancel/reverse effects, and direct DB writes.
5. Handoff includes concrete deliverables requested from the BUSY developer.
6. Handoff includes acceptance checks that match the current adapter and ItemCodes behavior.

## Trajectory Eval Criteria

1. Handoff remains consistent with existing decisions and does not silently resolve open BUSY questions.
2. Existing `BUSY_API_INTEGRATION_SPEC.md` remains the deeper reference and is linked from the handoff.
3. The new document is shareable with a non-project BUSY developer without requiring them to read all internal planning files.
4. Phase output/trajectory docs are closed after verification.

## Implementation Tasks

- [x] Read existing BUSY integration spec, `SaleWithRef.txt`, Phase 20 return contract, Phase 28 adapter plan, decisions, open questions, and requirements ledger.
- [x] Create Phase 29 output and trajectory eval gates.
- [x] Create BUSY developer handoff under `client-deliverables/`.
- [x] Revise the handoff to be PUSH-only with no code snippets.
- [x] Use `tmpVchCode` as the unique invoice id throughout the handoff.
- [x] Use BUSY developer language for `VchNo` as billing invoice number, not "human" invoice number.
- [x] Clarify that BUSY returns are new invoices with a different `VchType`, linked to the original invoice at invoice level.
- [x] Use actual `SaleWithRef.txt` field names in sale-level and line-level requirements.
- [x] Separate Sale, Return, ItemCodes, security, idempotency, and acceptance requirements.
- [x] Link the new handoff from the older detailed BUSY integration spec.
- [x] Update Phase 29 output/trajectory evals and status.

## Delivery Notes - 2026-07-17

- Added `client-deliverables/BUSY_DEVELOPER_API_HANDOFF.md` as the first-share document for the BUSY developer.
- The handoff requests PUSH-only integration for sale upsert, return invoice upsert, and ItemCodes sync.
- The handoff uses actual BUSY sample fields such as `Date`, `VchType`, `VchNo`, `BillingDetails.tmpVchCode`, `BillingDetails.PartyName`, `ItemDetail.SrNo`, `ItemDetail.ItemName`, `ItemDetail.tmpItemCode`, `ItemDetail.Price`, and `ItemDetail.Qty`.
- The handoff explains that `VchNo` is the BUSY billing invoice number, while `tmpVchCode` is the unique invoice id.
- The handoff explains that returns are new invoices with a different `VchType`; the return invoice links to the original sale invoice at invoice level, and returned item/quantity is read from return invoice `tmpItemCode` and `Qty`.
- The handoff explicitly states BUSY must not decide QR status, points, QR cancel/reverse effects, reward ledger effects, or direct database writes.
- The handoff asks for the missing production connector facts: return-link field, sale update sample, partial/full return samples, item master sync, price semantics, sync-agent need, and idempotent retry/outbox behavior.

## Verification Summary - 2026-07-17

- Handoff field-name check with `rg` - PASS.
- PUSH-only/no-code-snippet handoff check - PASS.
- Standalone invoice-cancel requirement check - PASS.
- Existing detailed spec now links to the new handoff - PASS.
- `git diff --check` - PASS.
