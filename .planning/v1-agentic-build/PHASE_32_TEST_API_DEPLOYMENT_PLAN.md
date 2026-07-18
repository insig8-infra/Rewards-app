# Phase 32 - Test API Deployment Readiness

Status: Complete  
Started: 2026-07-17

## Objective

Prepare Volt Rewards API for a public HTTPS Test API deployment that the BUSY developer can call remotely for PUSH connector testing, while keeping secrets out of source-controlled files and client-facing PDFs.

## Requirements Trace

- `WEB-019`: BUSY integration must ingest sale invoice and return invoice events through Volt Rewards backend APIs, not direct database writes.
- `WEB-020`: BUSY integration must support idempotent real-time or near-real-time sync so retries do not duplicate records.
- `WEB-023`: BUSY Return of Sale vouchers must be ingested and persisted separately from original sale invoices and excluded from QR Print Queue.
- `WEB-024`: Invoice read models must expose linked return history, returned quantity, printable quantity, and allocation status.
- Phase 30 receiver endpoints: BUSY PUSH health, voucher upsert, item full sync, and item upsert endpoints exist.
- Phase 31 decision: Neon is the test/staging PostgreSQL provider for the next Test API deployment.

## Open-Question Review

| Question | Phase 32 handling |
| --- | --- |
| Hosting provider | Resolved only for the test connector path: support Vercel quick public deployment plus a Docker/container path. Production hosting remains open. |
| Managed PostgreSQL provider | Resolved for this phase: Neon pooled runtime URL and direct migration URL. |
| Production object storage | Deferred. Test API uses `MEDIA_STORAGE_MODE=local`; object storage is not needed for BUSY connector ingestion testing. |
| BUSY connector auth values | Needed before live remote testing. Values must be generated per environment and configured as server-side deployment env vars, then shared separately from the requirements PDF. |
| Exact BUSY return-link field | Still deferred to BUSY developer response; does not block deployment of receiver endpoints. |

## Design

1. Keep the Nest/Fastify API as the source of truth for business rules and persistence.
2. Add public deployment support without changing endpoint contracts:
   - Vercel entrypoint: root `server.mjs` imports the built API server.
   - Vercel config: root `vercel.json` builds the API workspace and uses `server.mjs`.
   - Container path: `apps/api/Dockerfile` runs the same built API with `HOST=0.0.0.0`.
3. Keep deployment secrets out of committed files:
   - `NEON_CONNECTION_STRING`
   - `JWT_SECRET`
   - `QR_TOKEN_SECRET`
   - `BUSY_INTEGRATION_CLIENT_ID`
   - `BUSY_INTEGRATION_API_KEY`
4. Keep the shareable BUSY developer doc focused on configurable public HTTPS base URLs and header names only.

## Eval Criteria

### Output Eval

- API build passes after deployment entrypoint changes.
- API test suite passes after deployment entrypoint changes.
- Public deployment artifacts do not contain local `.env.local` secrets.
- BUSY requirements markdown/PDF does not contain localhost URLs or secret values.
- Shareable BUSY doc clearly states that the API base URL includes `/api`.

### Trajectory Eval

- Relevant requirements, open questions, Phase 30, and Phase 31 context were checked before implementation.
- Vercel docs/skills were checked before adding Vercel deployment config.
- Deployment limits are recorded honestly: config is ready, but live remote testing still needs deployment env secrets configured.
- Any deviation from production readiness is recorded as a gap, not silently treated as complete.

## Implementation Checklist

- [x] Adjust API host binding so Vercel can listen without forcing `127.0.0.1`.
- [x] Add Vercel server entrypoint/config.
- [x] Add container deployment path.
- [x] Update env template with deployment host/port notes.
- [x] Update BUSY requirements markdown with public API base URL semantics.
- [x] Regenerate and inspect BUSY requirements PDF.
- [x] Run API build/tests.
- [x] Record output and trajectory eval.
