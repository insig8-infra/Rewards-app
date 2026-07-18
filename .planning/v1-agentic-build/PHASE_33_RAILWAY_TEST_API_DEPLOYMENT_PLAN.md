# Phase 33 - Railway Test API Deployment Prep

Status: In progress  
Started: 2026-07-18

## Objective

Make Railway the selected Test API deployment path for BUSY connector testing, using Neon as the database and GitHub as the source repository.

## Requirements Trace

- `WEB-019`: BUSY integration ingests through backend APIs, not direct DB writes.
- `WEB-020`: BUSY integration is retry-safe/idempotent.
- Phase 30: BUSY receiver endpoints exist.
- Phase 31: Neon is selected for test/staging Postgres.
- Phase 32: Public Test API readiness and secret-sharing boundary established.

## Open-Question Review

| Question | Phase 33 handling |
| --- | --- |
| Hosting provider | Resolved for Test API: Railway. Production remains open. |
| Railway trial vs Pro | Trial is acceptable for first Test API proof if it permits the public service/domain and has enough credits. Upgrade only if Railway limits deployment, uptime, team access, or resource needs. |
| GitHub repo/push | User provided `GIT_REPO` and `GIT_PERSONAL_ACCESS_TOKEN` in local env. Do not print or commit the token. |
| BUSY credentials | Generated locally under exact API env names; still need these values configured in Railway service Variables. |

## Eval Criteria

- `railway.json` points Railway to `apps/api/Dockerfile` and `/api/health`.
- Vercel-specific active deployment artifacts are removed or superseded.
- BUSY handoff markdown/PDF names Railway test domain placeholder and `/api` base URL.
- Runbook explains Railway variables, public domain, migration, and BUSY PUSH workflow.
- API build and tests pass after deployment config changes.
- `.env.local` remains ignored and token values are not printed or committed.
- Git remote is configured without embedding the PAT in `.git/config`.

## Implementation Checklist

- [x] Add Railway config-as-code.
- [x] Make Railway primary in the deployment runbook.
- [x] Update BUSY developer requirements markdown/PDF.
- [x] Record architecture decision and open-question update.
- [ ] Run build/tests.
- [x] Generate local test secrets under exact API env names.
- [x] Configure Git remote safely.
- [ ] Push repo to GitHub if token works. Blocked: GitHub returned 403 permission denied for the provided token/repo.
- [x] Record output and trajectory eval.
