# Phase 30 Plan - BUSY Test Receiving API

Status: Complete - Output And Trajectory Gates Passed  
Created: 2026-07-17  
Source: Phase 28 BUSY adapter, Phase 29 BUSY developer handoff, user decision to provide test receiving URLs now

## Intent

Create a test-ready BUSY receiving API surface so the BUSY developer can build against live Volt Rewards endpoints before final production URLs are available. The API must stay PUSH-only, configurable by environment, credential-protected, idempotent through existing import contracts, and consistent with the shareable BUSY developer requirements.

## Requirements Covered

- `WEB-019`: BUSY must ingest through Volt Rewards backend APIs, not direct DB writes.
- `WEB-020`: BUSY sync must be idempotent so retries do not duplicate records.
- `WEB-023`: Return vouchers are separate records linked to the original sale invoice.
- `ITEM-001` through `ITEM-009`: ItemCodes are BUSY-sourced for item facts and Volt-owned for reward rules.
- `QR-019`, `QR-020`: BUSY returns affect future printability and create review-needed states for scanned QR units without physical scan.
- `RWD-023`: QR points come from ItemCode rules and freeze at QR print time.

## Context Read

- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `PHASE_28_BUSY_ADAPTER_HARDENING_PLAN.md`
- `PHASE_29_BUSY_DEVELOPER_HANDOFF_PLAN.md`
- `client-deliverables/BUSY_DEVELOPER_REQUIREMENTS.md`
- API BUSY import and ItemCodes services

## Open Questions Review

Resolved for this phase:

1. Test receiving URLs should exist now so the BUSY developer can test a live connector before production.
2. Actual API keys must not be committed to the repository or embedded in the PDF; only header names/placeholders should be documented.
3. Sale and return voucher ingestion can share one endpoint because `VchType` drives the adapter.
4. Item master sync needs both a full-sync path and a later upsert/change path.

Still deferred to BUSY developer response:

1. Exact return-link BUSY field name for original sale `tmpVchCode`.
2. Partial return and full return sample payloads.
3. Whether BUSY needs a local sync-agent/service and durable outbox.
4. Stable line identity behavior after invoice edits.
5. Final production/staging domain and key rotation process.

## Output Eval Criteria

1. External BUSY receiving endpoints exist under a versioned API prefix and are not protected only by admin-web actor headers.
2. Endpoints require configurable credentials from environment variables and never hardcode secrets.
3. Voucher push endpoint reuses the existing real BUSY adapter/import service and remains idempotent through repository upsert contracts.
4. Item master full-sync and item-code upsert endpoints update BUSY-owned ItemCode fields while preserving Volt-owned reward rules.
5. Full item-master sync marks missing BUSY items as `NOT_IN_BUSY`; delta upsert does not mark unrelated items missing.
6. Focused tests cover credential validation, voucher response mapping, and ItemCode full/delta sync behavior.
7. Shareable markdown/PDF names the test receiving URL shape, endpoint paths, header names, and secret-sharing rule without code snippets.

## Trajectory Eval Criteria

1. Phase stays PUSH-only and does not reintroduce pull/polling language.
2. Phase does not silently finalize deferred BUSY field questions.
3. Security posture keeps URLs configurable and secrets outside committed artifacts.
4. Existing mock adapter remains usable while the real connector is developed.
5. Phase notes are updated with verification results and residual gaps.

## Implementation Tasks

- [x] Add credential helper for BUSY integration headers.
- [x] Add versioned BUSY receiving controller.
- [x] Add ItemCodes sync path for pushed item-master payloads.
- [x] Wire controller into `BusyModule`.
- [x] Add tests for auth, controller behavior, and item-master sync.
- [x] Add `.env.example` placeholders for local/test credentials.
- [x] Update `BUSY_DEVELOPER_REQUIREMENTS.md` with test receiving endpoints.
- [x] Regenerate and inspect `BUSY_DEVELOPER_REQUIREMENTS.pdf`.
- [x] Run API tests and diff checks.
- [x] Record output and trajectory eval results.

## Delivery Notes - 2026-07-17

- Added `/api/integrations/busy/v1/health`, `/api/integrations/busy/v1/vouchers/upsert`, `/api/integrations/busy/v1/item-codes/full-sync`, and `/api/integrations/busy/v1/item-codes/upsert`.
- Added BUSY connector header authentication using environment-backed `x-volt-client-id` and `x-volt-api-key`.
- Reused `BusyImportService.importBusyVoucherPayload` for Sale and Return pushes, preserving the existing adapter and idempotent repository behavior.
- Added ItemCodes full-sync and delta-upsert handling from pushed BUSY item master payloads.
- Full sync marks absent active ItemCodes as `NOT_IN_BUSY`; delta upsert only updates the provided rows.
- BUSY item sync preserves Volt-owned reward fields: `fixedPoints` and `percentOfPricePoints`.
- Updated `.env.example` with placeholder connector credential variables.
- Updated the shareable `BUSY_DEVELOPER_REQUIREMENTS.md` and regenerated both PDF copies.

## Verification Summary - 2026-07-17

- `npm run test --workspace @volt-rewards/api` - PASS, 115 tests.
- `git diff --check` - PASS.
- Endpoint/header presence check across source and handoff - PASS.
- Shareable markdown check for stale cancellation wording - PASS.
- PDF render/inspection - PASS, 4 pages, endpoint/header tables readable.

## Residual Gaps

- A real externally reachable deployed test base URL still depends on where the API is hosted.
- Real test `x-volt-api-key` must be generated and shared out of band; it is intentionally not committed or printed in the PDF.
- BUSY developer still needs to confirm return-link field, return samples, stable line identity, and sync-agent/outbox mechanics.
