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

Use the same GitHub repo for all services. Each service must point to its own Dockerfile.

| Railway service | Purpose | Dockerfile path | Required variables |
| --- | --- | --- | --- |
| `@volt-rewards/api` | Backend API | `apps/api/Dockerfile` | Existing API variables, `HOST=0.0.0.0`, `API_PUBLIC_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api` |
| `@volt-rewards/admin-web` | Admin Web Portal | `apps/admin-web/Dockerfile` | `ADMIN_WEB_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api`, `NEXT_PUBLIC_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api` |
| `@volt-rewards/mobile` | End-user app laptop demo | `apps/mobile/Dockerfile` | `EXPO_PUBLIC_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api` |
| `@volt-rewards/admin-mobile` | Admin Mobile laptop demo | `apps/admin-mobile/Dockerfile` | `EXPO_PUBLIC_API_BASE_URL=https://volt-rewardsapi-production.up.railway.app/api` |

## Railway UI Steps

1. Open the Railway project.
2. For each frontend service, open `Settings`.
3. Set the Dockerfile path to the matching path above.
   - If using variables instead of the Settings field, set `RAILWAY_DOCKERFILE_PATH` to the matching Dockerfile path.
4. Open `Variables` and add the required variables for that service.
5. Deploy the staged changes.
6. Open `Settings` -> `Networking` and generate a public Railway domain for each frontend service.

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

## Notes

- Expo mobile web builds bake `EXPO_PUBLIC_API_BASE_URL` during build, so redeploy after changing that variable.
- Admin Web uses server-side proxy routes and should use `ADMIN_WEB_API_BASE_URL` for Railway.
- The mobile web links are laptop-friendly demos of the mobile apps. Native iOS/Android builds remain a separate Expo EAS/App Store and Play Store path.
