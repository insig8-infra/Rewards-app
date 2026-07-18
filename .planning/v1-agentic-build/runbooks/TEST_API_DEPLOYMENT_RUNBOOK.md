# Test API Deployment Runbook

Purpose: deploy Volt Rewards API as a public HTTPS test endpoint for BUSY PUSH connector testing.

## Deployment Shape

Use a dedicated test API deployment. This is not business production even if the hosting provider calls the environment `production`; it points to Neon test/staging data and test BUSY credentials.

Selected path for Test API:

| Path | Intended use |
| --- | --- |
| Railway | Primary Test API host for BUSY connector testing. Railway builds the API using root `railway.json`, which points to `apps/api/Dockerfile`. |
| Container | Portable fallback for any host that can run the same Dockerfile. |

## Required Server Env Vars

Set these in the hosting provider as server-side/private env vars. Do not commit them and do not put values in the BUSY requirements PDF.

| Variable | Required? | Notes |
| --- | --- | --- |
| `NODE_ENV` | Yes | Use `production` for hosted deployments. |
| `PORT` | Railway controlled | Do not hard-code this in Railway. Railway provides it and the API reads `process.env.PORT`. |
| `HOST` | Yes | Use `0.0.0.0` for Railway/container runtime. The Dockerfile sets this default. |
| `NEON_CONNECTION_STRING` | Yes | Neon pooled runtime connection string. |
| `NEON_DIRECT_URL` | Migration only | Needed for Prisma migration commands, not normal runtime. |
| `JWT_SECRET` | Yes | Long random server-side secret. |
| `QR_TOKEN_SECRET` | Yes | Long random QR signing secret. |
| `BUSY_INTEGRATION_CLIENT_ID` | Yes | Test connector client id shared with BUSY developer. |
| `BUSY_INTEGRATION_API_KEY` | Yes | Test connector API key shared with BUSY developer separately. |
| `MEDIA_STORAGE_MODE` | Yes | Use `local` for test API unless storage is explicitly being verified. |
| `SMS_PROVIDER` | Yes | Use `mock` until production SMS provider is selected. |
| `CORS_ORIGIN` | Yes for browser clients | Comma-separated admin/mobile web origins. BUSY server-to-server calls do not rely on CORS. |

Current local `.env.local` has Neon values, Git push values, and generated test values for `BUSY_INTEGRATION_CLIENT_ID`, `BUSY_INTEGRATION_API_KEY`, `JWT_SECRET`, and `QR_TOKEN_SECRET`. Copy the deployment values into Railway service Variables before live BUSY testing. `NEON_REWARDS_APP_API_KEY` is not read by the current API; use `BUSY_INTEGRATION_API_KEY` for the BUSY receiver secret.

## Railway Test Deployment

1. Push this repository to GitHub.
2. In Railway, create a new project from the GitHub repo.
3. Make sure Railway uses root `railway.json`. It sets:
   - builder: `DOCKERFILE`
   - Dockerfile path: `apps/api/Dockerfile`
   - healthcheck path: `/api/health`
4. In the Railway service Variables tab, add the required server env vars above.
5. In the Railway service Networking tab, generate a public domain.
6. Run Prisma migrations against Neon from a trusted local/CI environment before relying on a deployment that includes new migrations:

```bash
npm run prisma:migrate:deploy --workspace @volt-rewards/api
```

7. Deploy or redeploy the Railway service.
8. Verify the deployed URL:

```bash
curl https://<railway-public-domain>/api/health
curl -H "x-volt-client-id: <client-id>" -H "x-volt-api-key: <api-key>" https://<railway-public-domain>/api/integrations/busy/v1/health
```

Expected authenticated BUSY health response: HTTP 200 with `status: ok`.

## Container Test Deployment

Build from the repository root:

```bash
docker build -f apps/api/Dockerfile -t volt-rewards-api:test .
```

Run with private env vars supplied by the container host:

```bash
docker run --env-file .env.local -e HOST=0.0.0.0 -e PORT=3000 -p 3000:3000 volt-rewards-api:test
```

For a public test endpoint outside Railway, run this image on a provider that gives HTTPS ingress and configure the same server env vars there.

## BUSY PUSH API Workflow

1. Volt Rewards owns and deploys the receiving API.
2. Volt Rewards configures Railway server env vars, including Neon runtime DB URL and BUSY connector credentials.
3. Volt Rewards shares the test API base URL and BUSY connector credentials with the BUSY developer through a secure channel.
4. The BUSY developer configures the BUSY-side connector/sync job with:
   - API base URL: `https://<railway-public-domain>/api`
   - `x-volt-client-id`
   - `x-volt-api-key`
5. The BUSY connector first calls `GET /integrations/busy/v1/health` to confirm connectivity/authentication.
6. For each sale or return voucher create/update, BUSY sends a POST request to `/integrations/busy/v1/vouchers/upsert` with JSON shaped from the exact BUSY fields in the handoff document.
7. For first setup, BUSY sends a full item master list to `/integrations/busy/v1/item-codes/full-sync`.
8. After first setup, BUSY sends item master changes to `/integrations/busy/v1/item-codes/upsert`.
9. Volt Rewards authenticates the headers, normalizes the BUSY JSON into backend domain contracts, writes to Neon, and returns success/failure JSON.
10. BUSY can retry safely after network failures because Volt Rewards upserts/idempotently handles repeated `tmpVchCode` and item-code facts.

## What To Share With BUSY Developer

Share:

- API base URL: `https://<volt-railway-test-domain>/api`
- Header name: `x-volt-client-id`
- Header value for the test connector
- Header name: `x-volt-api-key`
- Header value for the test connector
- `BUSY_DEVELOPER_REQUIREMENTS.pdf`

Do not share:

- Neon connection strings
- JWT or QR secrets
- GitHub personal access tokens
- Railway account/session tokens
- Supabase service keys
- Local `.env.local`
