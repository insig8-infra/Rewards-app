# Railway Client Demo Deployment Runbook

Updated: 2026-07-24

## Goal

Create public Railway links that the client can open on a laptop for:

1. Volt Admin Web Portal
2. Volt Rewards end-user mobile web demo
3. Volt Admin mobile web demo

The live API remains:

- API base URL: `https://volt-rewardsapi-production.up.railway.app/api`
- API health: `https://volt-rewardsapi-production.up.railway.app/api/health`

## Railway Service Setup

Use the same GitHub repo for all services. Keep `Root Directory` as `/` for every service because this is a shared npm-workspaces monorepo.

The repo-level `railway.json` intentionally uses Railway's native `RAILPACK` builder and does not set a Dockerfile path or healthcheck. Each service must define its own build command, start command, variables, and healthcheck in Railway service settings.

| Railway service | Purpose | Build command | Start command | Healthcheck | Required variables |
| --- | --- | --- | --- | --- | --- |
| `@volt-rewards/api` | Backend API | `npm run build --workspace @volt-rewards/api` | `npm run start --workspace @volt-rewards/api` | `/api/health` | Existing API variables, `HOST=0.0.0.0`, `API_PUBLIC_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api`, `CORS_ORIGIN=<comma-separated frontend URLs>` |
| `@volt-rewards/admin-web` | Admin Web Portal | `npm run build --workspace @volt-rewards/admin-web` | `npm run start --workspace @volt-rewards/admin-web` | `/` | `ADMIN_WEB_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api`, `NEXT_PUBLIC_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api` |
| `@volt-rewards/mobile` | End-user app laptop demo | `npm run export:web --workspace @volt-rewards/mobile` | `node tools/serve-static.mjs` | `/` | `EXPO_PUBLIC_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api`, `STATIC_ROOT=apps/mobile/dist` |
| `@volt-rewards/admin-mobile` | Admin Mobile laptop demo | `npm run export:web --workspace @volt-rewards/admin-mobile` | `node tools/serve-static.mjs` | `/` | `EXPO_PUBLIC_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api`, `STATIC_ROOT=apps/admin-mobile/dist` |

## Railway UI Steps

1. Open the Railway project.
2. For each service, open `Settings` -> `Source` and connect the GitHub repo `insig8-infra/Rewards-app`.
3. Keep `Root Directory` as `/`.
4. Open `Settings` -> `Build` and make sure the builder is Railway native/Railpack, not Dockerfile.
5. Remove any `RAILWAY_DOCKERFILE_PATH` variable from frontend services.
6. Remove any Dockerfile path such as `apps/api/Dockerfile`, `apps/mobile/Dockerfile`, `apps/admin-mobile/Dockerfile`, or `apps/admin-web/Dockerfile` from frontend service settings.
7. Set each service's build command, start command, healthcheck path, and variables from the table above.
8. Deploy the staged changes.
9. Open `Settings` -> `Networking` and generate a public Railway domain for each frontend service.
10. After the three frontend domains exist, update the API service `CORS_ORIGIN` to include them as a comma-separated list and redeploy the API service.

## Expected Client Links

Replace the placeholders after Railway generates the service domains.

| Surface | URL |
| --- | --- |
| Admin Web Portal | `https://<admin-web-domain>` |
| End-user Mobile Web Demo | `https://<mobile-domain>` |
| Admin Mobile Web Demo | `https://<admin-mobile-domain>` |

## Verification Gates

Before sending links to the client:

1. `GET https://volt-rewardsapi-production.up.railway.app/api/health` returns `status: ok`.
2. Admin Web loads on its Railway URL and OWNER/ADMIN/STAFF login works.
3. End-user mobile web demo loads on its Railway URL and Contractor/Team Member login works.
4. Admin Mobile web demo loads on its Railway URL and OWNER/ADMIN/STAFF login works.
5. No screen calls `http://127.0.0.1:3000/api` or `localhost` in the browser network panel.
6. Browser API calls from the two mobile web demo URLs are not blocked by CORS.

## Notes

- Expo mobile web builds bake `EXPO_PUBLIC_API_BASE_URL` during build, so redeploy after changing that variable.
- Admin Web uses server-side proxy routes and should use `ADMIN_WEB_API_BASE_URL` for Railway.
- The mobile web links are laptop-friendly demos of the mobile apps. Native iOS/Android builds remain a separate Expo EAS/App Store and Play Store path.
- If a deployment detail still shows `Builder: Dockerfile`, the service is still inheriting old Docker config or has `RAILWAY_DOCKERFILE_PATH` set. Fix that before redeploying.
