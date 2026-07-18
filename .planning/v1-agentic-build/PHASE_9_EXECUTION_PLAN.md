# Phase 9 Execution Plan - BUSY Production Integration Handoff

## Goal

Create a clear document for the BUSY developer so they can build the sale invoice and return invoice APIs or push process needed by Volt Rewards, while preserving the mock-adapter boundary for ongoing product development. Later Phase 29 clarification: the all-lines case is simply a full return invoice with all original sale line items and quantities.

## Source Requirements

- `WEB-005`
- `WEB-006`
- `WEB-012`
- `WEB-018`
- `WEB-019`
- `WEB-020`
- `QR-005`
- Client call update on 2026-06-23: BUSY developer will create APIs; Volt Rewards will use mock data until then; Volt Rewards will own a PostgreSQL database and should receive real-time BUSY invoice information.

## Scope

Included:

- Review `SaleWithRef.txt`.
- Define preferred BUSY push-to-Volt-backend ingestion architecture.
- Define fallback BUSY pull API shape. Superseded by later PUSH-only clarification.
- Define canonical invoice payload and field mapping from the sample.
- Define security, idempotency, validation, error response, and retry requirements.
- Capture unresolved BUSY developer questions.
- Update planning docs so future phases use this handoff contract.

Excluded:

- Implementing the production BUSY connector.
- Choosing final managed PostgreSQL provider.
- Creating database migrations beyond current draft model.
- Changing mock invoice behavior.

## Open Questions

- BUSY return invoice shape, including the full-return all-lines case.
- Stable BUSY identifiers across edits.
- GST, HSN, brand, category, and customer contact field availability.
- Whether BUSY can push HTTPS events or needs a local sync service.

## Architecture Touchpoints

- Domain services: invoice import idempotency, QR placeholder eligibility, and return handling.
- API routes: `/api/integrations/busy/v1/*` future ingestion endpoints.
- Database tables: `busy_invoices`, `busy_invoice_lines`, future integration sync event log.
- UI surfaces: Admin Web invoice/QR print views remain adapter-backed.
- Background jobs: optional reconciliation/polling/backfill.
- Audit events: BUSY invoice import, return, full-return all-lines case, and sync failures.

## Tests And Evals

- API contract: payload validation, idempotent retry, idempotency conflict.
- Integration: invoice upsert creates or updates lines without duplicate QR placeholders.
- Integration: partial return blocks later printing for returned quantities.
- Security: HMAC/API-key authentication, no direct DB credentials, audit logging.
- Manual review: BUSY developer confirms payload fields and event feasibility.

## Implementation Tasks

- [x] Read `SaleWithRef.txt`.
- [x] Write shareable BUSY API handoff spec.
- [x] Add internal BUSY handoff planning note.
- [x] Update API/data/decision/open-question planning docs.
- [x] Record phase status and residual risks.

## Exit Gates

- [x] Requirement IDs satisfied for documentation contract.
- [x] Tests pass is not applicable because this is docs-only.
- [x] Denied paths documented: no direct BUSY database writes to Volt PostgreSQL.
- [x] Security/eval gate documented.
- [x] Residual risks documented.
