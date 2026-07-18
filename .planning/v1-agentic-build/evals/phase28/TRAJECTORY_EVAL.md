# Phase 28 Trajectory Eval - BUSY Adapter Payload Hardening

Status: PASS  
Created: 2026-07-16

## Trajectory Checks

| Check | Expected behavior | Status | Evidence |
| --- | --- | --- | --- |
| Contract-first | Read requirements, open questions, decisions, Phase 20/21 return contract, Phase 26B ItemCodes plan, and `SaleWithRef.txt` before implementation. | PASS | Context read before code changes. |
| Eval-first | Create Phase 28 output and trajectory eval before adapter code. | PASS | This file and `OUTPUT_EVAL.md` created before implementation. |
| Scope control | Build only the adapter seam and tests; do not implement production BUSY auth or PUSH networking. | PASS | Implementation adds payload normalization and service routing only. Production auth, PUSH sync-agent/retry mechanics, partial/full return samples, and exact return-link field remain deferred. |
| Existing-model reuse | Map actual BUSY payloads into existing `BusyInvoiceImport` / `BusyReturnVoucherImport` rather than creating parallel models. | PASS | `mapBusyVoucherPayload` returns existing import contracts and `BusyImportService.importBusyVoucherPayload` calls existing repository methods. |
| Open-question honesty | Keep return link field, partial/full return samples, auth, and PUSH mechanics unresolved unless real data arrives. | PASS | DEC-053, phase plan, output eval, roadmap, and open questions keep these production connector gaps open. |
| Verification loop | Run focused automated output eval and fix strictness issues before completion. | PASS | `npm run test --workspace @volt-rewards/api` passed 108/108 and `git diff --check` passed. |

## Trace Log

### Phase 28 Planning Trace - 2026-07-16

- Intent: proceed after the Supabase development egress guard by hardening the BUSY adapter seam requested by the user.
- Context read: `ROADMAP.md`, Phase 26/27 plans/evals/status, `REQUIREMENTS_LEDGER.md`, `OPEN_QUESTIONS.md`, `architecture/DECISIONS.md`, `PHASE_20_BUSY_RETURN_CONTRACT.md`, `PHASE_21_EXECUTION_PLAN.md`, existing BUSY import repository/service, ItemCodes service, QR print repository, and `SaleWithRef.txt`.
- Boundary: no production BUSY network connection, no auth decision, and no additional BUSY workflow beyond sale and return invoices.
- Verdict at planning time: planning/eval gate ready before implementation started.

### Phase 28 Completion Trace - 2026-07-16

- Implemented adapter normalization for BUSY Sale/Return object payloads and simple XML payloads.
- Corrected voucher detection so explicit `VchType` wins over a wrapper/root name such as `<Sale>`.
- Added deterministic tests for SaleWithRef-style sale mapping, linked return mapping, unsupported voucher ignore behavior, missing-field failure, and service-level repository import/allocation.
- Ran the compiled adapter against the exact `SaleWithRef.txt` sample and confirmed `tmpVchCode=25`, line `tmpItemCode=40291`, quantity `100`, and price `200.00`.
- Recorded DEC-053 because `VchType` precedence and ItemCodes point-rule preservation are durable integration behavior.
- Output eval: PASS via API suite 108/108.
- Trajectory eval: PASS; no production BUSY auth, polling, cancellation, or unverified field assumptions were added.
