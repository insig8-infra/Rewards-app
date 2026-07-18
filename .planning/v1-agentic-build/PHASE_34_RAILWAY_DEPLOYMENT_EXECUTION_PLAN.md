# Phase 34 - Railway Deployment Execution

Status: In progress  
Started: 2026-07-18

## Objective

Deploy the Railway Test API from the GitHub repo, configure Railway service variables, generate the public HTTPS domain, and verify BUSY connector health endpoints.

## Requirements Trace

- `WEB-019`: BUSY integration ingests through backend APIs, not direct database writes.
- `WEB-020`: BUSY integration must be idempotent and retry-safe.
- Phase 30: BUSY receiver endpoints exist.
- Phase 31: Neon database is ready.
- Phase 33: GitHub repo and Railway config are ready.

## Open-Question Review

| Question | Phase 34 handling |
| --- | --- |
| Railway authentication | Blocking for agent-executed deployment. Need Railway UI access, Railway CLI login, or `RAILWAY_TOKEN` in ignored local env. |
| Railway plan | Trial is acceptable for the first proof if public domain, deploy, and Neon outbound connectivity work. Upgrade only if Railway blocks or sleeps the needed test service. |
| Runtime secrets | Generated locally and exported to ignored `.env.railway.local`; must be copied/imported into Railway Variables. |
| Public API URL | Not known until Railway service public domain is generated. |

## Eval Criteria

- Railway project is connected to `https://github.com/insig8-infra/Rewards-app`.
- Railway service uses `railway.json` and `apps/api/Dockerfile`.
- Railway Variables contain the required server-side env vars.
- Railway public domain is generated.
- `GET https://<railway-domain>/api/health` returns `status: ok`.
- Authenticated `GET https://<railway-domain>/api/integrations/busy/v1/health` returns `status: ok`.
- BUSY handoff gets updated with the actual Railway base URL after health checks pass.

## Implementation Checklist

- [x] Prepare ignored Railway variables file from local env.
- [ ] Authenticate Railway access for agent or complete Railway UI connection manually.
- [ ] Configure Railway project/service from GitHub.
- [ ] Configure Railway Variables.
- [ ] Generate Railway public domain.
- [ ] Verify health endpoints.
- [ ] Update BUSY handoff with actual test API base URL.

