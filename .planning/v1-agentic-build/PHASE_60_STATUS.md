# Phase 60 Status - Railway Client Demo Deployment

Status: Source Prepared / Railway Link Verification Pending
Plan: `PHASE_60_RAILWAY_CLIENT_DEMO_DEPLOYMENT_PLAN.md`

## Delivered So Far

- Added Railway Dockerfiles for Admin Web, End-User Mobile web demo, and Admin Mobile web demo.
- Added a dependency-free static server for Expo web exports.
- Updated Admin Web start command to bind to Railway's `PORT`.
- Added Expo web export scripts for both mobile apps.
- Added `client-deliverables/RAILWAY_CLIENT_DEMO_DEPLOYMENT_RUNBOOK.md`.
- Updated the Railway direction to native Railpack build/start commands after Railway applied the repo-level API Dockerfile config to frontend services.
- Changed root `railway.json` so it no longer points all services at `apps/api/Dockerfile` or `/api/health`.

## Verification

- `ADMIN_WEB_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api NEXT_PUBLIC_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api npm run build --workspace @volt-rewards/admin-web` - PASS after allowing networked Next font fetch.
- `EXPO_PUBLIC_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api npm run export:web --workspace @volt-rewards/mobile` - PASS.
- `EXPO_PUBLIC_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api npm run export:web --workspace @volt-rewards/admin-mobile` - PASS.
- `npm run typecheck --workspace @volt-rewards/mobile` - PASS.
- `npm run typecheck --workspace @volt-rewards/admin-mobile` - PASS.
- `node --check tools/serve-static.mjs` - PASS.
- Static server smoke for End-User Mobile export root and deep link - PASS with local unsandboxed localhost bind.
- Static server smoke for Admin Mobile export root and deep link - PASS with local unsandboxed localhost bind.
- `curl -sS https://volt-rewardsapi-production.up.railway.app/api/health` - PASS: `{"status":"ok","service":"volt-rewards-api"}`.

## Pending Deployment Verification

- Git push with native Railway config.
- Railway frontend services show `Builder: Railpack` or native builder, not `Dockerfile`.
- Railway generated frontend public domains.
