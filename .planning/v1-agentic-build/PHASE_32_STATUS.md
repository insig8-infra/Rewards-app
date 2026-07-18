# Phase 32 Status - Test API Deployment Readiness

Status: Complete  
Started: 2026-07-17  
Completed: 2026-07-17  
Plan: `PHASE_32_TEST_API_DEPLOYMENT_PLAN.md`

## Delivered

- Added Vercel-compatible root server entrypoint and `vercel.json`.
- Added container deployment path for the API.
- Updated API binding behavior for local, Vercel, and container runtimes.
- Added Test API deployment runbook.
- Updated BUSY requirements markdown/PDF to clarify public HTTPS API base URL semantics.
- Recorded DEC-055 for the Test API deployment path and secret-sharing boundary.

## Verification

- `npm run build --workspace @volt-rewards/api` - PASS after standalone rerun.
- `npm run test --workspace @volt-rewards/api` - PASS, 115 tests.
- `PORT=3010 HOST=127.0.0.1 node server.mjs` plus `/api/health` curl - PASS outside sandbox.
- BUSY requirements PDF text and rendered-page checks - PASS.
- Stale localhost/secret-placeholder sweep - PASS.

## Notes

- The connected Vercel team is available as `insig8-infra`, but no Volt Rewards project existed at the start of this phase.
- The available Vercel connector can list/deploy projects but does not expose an environment-variable write tool in this session.
- Live BUSY connector testing requires server-side deployment env vars before sharing the test URL as ready.
- Local `.env.local` has Neon values, but it does not yet contain `BUSY_INTEGRATION_CLIENT_ID`, `BUSY_INTEGRATION_API_KEY`, `JWT_SECRET`, or `QR_TOKEN_SECRET` under the names the API reads.
