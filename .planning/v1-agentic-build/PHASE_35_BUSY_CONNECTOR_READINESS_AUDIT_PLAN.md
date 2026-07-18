# Phase 35 - BUSY Connector Readiness Audit

Status: Complete
Date: 2026-07-19

## Objective

Verify that the Neon, Railway, and GitHub setup is ready for the BUSY developer to push JSON payloads to Volt Rewards, including authenticated health, sale voucher upsert, return voucher upsert, item master upsert, persistence in Neon, retry safety, and audit hygiene.

## Requirements Trace

- `WEB-019`: BUSY integration ingests through backend APIs, not direct database writes.
- `WEB-020`: BUSY integration must be idempotent so retries do not duplicate invoices, line items, or QR placeholders.
- `WEB-023`: BUSY Return of Sale vouchers must be persisted separately and linked to the original sale invoice.
- `RWD-023`: QR reward points are resolved from managed BUSY ItemCodes at QR print time.

## Open-Question Review

| Question | Phase 35 handling |
| --- | --- |
| BUSY credentials location | Confirmed in ignored local env files and Railway service Variables by live authenticated calls. Do not place the API key in source-controlled docs or chat. |
| Exact BUSY return-link field | Still needs final BUSY confirmation. Live synthetic return used `OriginalSaleTmpVchCode`, one of the accepted adapter fields, and linked successfully. |
| Production hosting hardening | Not blocking BUSY test connector. Production still needs final deployment, monitoring, backup, TLS/SSL-mode review, and credential rotation policy. |
| Audit/test data cleanup | Controlled `CODX-AUDIT-*` verification records remain in Neon as evidence. Clean before client-facing UAT if needed. |

## Eval Criteria

- Local `.env.local` and `.env.railway.local` contain BUSY/Neon runtime variables and remain ignored.
- GitHub `origin/main` matches local `HEAD`.
- Railway public health returns HTTP 200.
- BUSY health rejects unauthenticated calls and accepts authenticated calls.
- Neon connection works and all Prisma migrations are finished.
- BUSY tables exist in Neon.
- Live sale voucher POST creates one invoice and QR placeholders.
- Retrying the same sale voucher does not duplicate the invoice or QR placeholders.
- Live ItemCodes delta POST upserts one item and retry keeps the same item.
- Live return voucher POST links to the original sale invoice and retry keeps the same return voucher/allocation.
- Real BUSY integration audit events use backend/system audit context.
- API tests and Prisma validation pass after any fixes.

## Implementation Checklist

- [x] Review Phase 34 completion context.
- [x] Check provider docs for Railway and Neon readiness expectations.
- [x] Verify local/Railway env key presence without printing secrets.
- [x] Verify GitHub remote state.
- [x] Verify Neon migrations and BUSY table presence.
- [x] Run live Railway health/auth checks.
- [x] Run live sale, item master, and return PUSH checks.
- [x] Fix discovered BUSY integration audit-source issue.
- [x] Re-run API tests and Prisma validation.
- [x] Push audit fix to GitHub and verify Railway deployed it.
- [x] Record output and trajectory evals.
