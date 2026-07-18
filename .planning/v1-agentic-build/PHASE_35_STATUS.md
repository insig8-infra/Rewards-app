# Phase 35 Status - BUSY Connector Readiness Audit

Status: Complete for BUSY developer test PUSH
Date: 2026-07-19
Plan: `PHASE_35_BUSY_CONNECTOR_READINESS_AUDIT_PLAN.md`

## Credential Location

- `x-volt-client-id` maps to `BUSY_INTEGRATION_CLIENT_ID`.
- `x-volt-api-key` maps to `BUSY_INTEGRATION_API_KEY`.
- Both values are present in ignored `.env.local` and `.env.railway.local`.
- The API key must not be pasted into source-controlled docs, PDFs, commits, or chat. Share it separately through a secure channel.

## Delivered

- Audited the GitHub, Railway, and Neon setup end to end.
- Proved the deployed Railway API can receive authenticated BUSY JSON payloads.
- Proved Neon persistence for sale invoices, return vouchers, ItemCodes, QR placeholders, and audit events.
- Found and fixed one audit-source issue: real BUSY invoice imports now write `BUSY_INTEGRATION_IMPORT`, `BACKEND_JOB`, `SYSTEM` instead of reusing the mock/Admin Web audit context.
- Added focused tests for BUSY integration audit context.

## Verification Summary

- Git remote: `origin` is `https://github.com/insig8-infra/Rewards-app`.
- GitHub `main`: matched local `HEAD` after push.
- Railway URL: `https://volt-rewardsapi-production.up.railway.app/api`.
- Public health: PASS.
- Unauthenticated BUSY health: PASS, rejected with HTTP 401.
- Authenticated BUSY health: PASS, HTTP 200.
- Neon migrations: PASS, all 10 Prisma migrations finished.
- Neon BUSY tables: PASS, `BusyInvoice`, `BusyInvoiceLine`, `BusyReturnVoucher`, `ItemCode`, and `QrUnit` exist.
- Live sale PUSH: PASS, `CODX-AUDIT-20260719-002` created 1 invoice line and 1 QR placeholder.
- Live sale retry: PASS, same invoice id and QR count.
- Live ItemCodes delta PUSH: PASS, `CODX-AUDIT-ITEM-001` upserted and retry kept the same ItemCode id.
- Live return PUSH: PASS, `CODX-AUDIT-RET-20260719-002` linked to `CODX-AUDIT-20260719-002`, created 1 allocation, and retry kept the same return voucher id.
- Corrected audit context on Railway: PASS, fresh live sale wrote `BUSY_INTEGRATION_IMPORT`, `BACKEND_JOB`, `SYSTEM`.
- API tests: PASS, 118/118.
- Prisma schema validation: PASS.
- Temporary secret-bearing curl configs: removed.

## Residual Notes

- Controlled `CODX-AUDIT-*` verification records remain in Neon as evidence and may appear in admin views. They should be cleaned before client-facing UAT/demo data is reviewed.
- Neon/pg emitted a forward-looking SSL-mode warning for `sslmode=require`. This is not blocking current connector testing, but production hardening should choose explicit `sslmode=verify-full` or the documented libpq compatibility option.
- Railway dashboard/variable readback is still user-owned because no `RAILWAY_TOKEN` is available to the agent; live authenticated checks prove the needed runtime variables are effective.
- The BUSY developer still needs the final exact BUSY field name that links a return voucher to the original sale `tmpVchCode`. The current receiver accepts `OriginalSaleTmpVchCode`, `OriginalTmpVchCode`, `OriginalVchCode`, `OriginalInvoiceTmpVchCode`, and `LinkedOriginalTmpVchCode`.
