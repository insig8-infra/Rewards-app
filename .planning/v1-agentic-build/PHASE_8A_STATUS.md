# Phase 8A Status - Runtime Persistence Gate Correction

Updated: 2026-06-30

## Current Status

Complete after 2026-06-30 correction.

Phase 8A correctly added a runtime gate, but the first version still missed the exact Admin Web browser actor contract because it used a database-discovered OWNER id instead of the hardcoded dev actor id sent by Admin Web. This has been corrected.

## Completed

- Corrected Admin Web API default base URL to `http://127.0.0.1:3000/api`.
- Added API CORS configuration for Admin Web origins:
  - `http://127.0.0.1:3001`
  - `http://localhost:3001`
- Added `.env.example` runtime values:
  - `CORS_ORIGIN`
  - `NEXT_PUBLIC_API_BASE_URL`
- Added `npm run runtime:check`.
- Added `tools/verify-local-runtime.mjs`, which checks:
  - `GET /api/health`
  - PostgreSQL connectivity.
  - Contractor creation through API.
  - Contractor list persistence including photo value.
- Seeded deterministic Admin Web dev actors:
  - `dev-owner-user`
  - `dev-staff-user`
- Updated `tools/verify-local-runtime.mjs` to use the same dev actor IDs as Admin Web.
- Extended the runtime gate to verify QR print actor persistence, including `QrUnit.printedByUserId`.
- Added client-side contractor photo normalization before submit.
- Added shared domain guard for oversized inline contractor photo payloads.
- Added `allowedDevOrigins: ["127.0.0.1"]` to Admin Web Next config so `http://127.0.0.1:3001` loads client-side dev resources and hydrates correctly.
- Added Admin Web API client test for the prefixed default base URL.
- Updated local database runbook with runtime-gate workflow.

## Verification

- `node --check tools/verify-local-runtime.mjs` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- `npm run build --workspace @volt-rewards/admin-web` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.
- `npm run runtime:check` passed after correction:
  - API health verified.
  - Supabase PostgreSQL connectivity verified.
  - Admin Web dev OWNER/STAFF users verified.
  - Contractor create/list/photo persistence verified.
  - QR print actor persistence verified.
- Browser UAT passed for `/contractors` with a real device-file upload:
  - 761,855 byte JPEG selected from `Sample_References/SCR-20260622-ooce.jpeg`.
  - Browser stored a compressed 15,255 character `data:image/jpeg` profile value.
  - API returned HTTP 201 and the contractor appeared in the visible list.
- 2026-07-01 browser UAT confirmed `127.0.0.1:3001` hydration after the Next `allowedDevOrigins` fix.
- 2026-07-01 browser UAT confirmed the visible `Browse` control opens the file chooser at `http://127.0.0.1:3001/contractors`; direct hidden-input upload is not sufficient completion evidence for future upload flows.

Current test count: 53 passing.

## Runtime Gate Resolution

- Supabase PostgreSQL dev database was configured through `.env.local`.
- Prisma migration `202606220001_init` was applied.
- Seed data was loaded.
- API was started at `127.0.0.1:3000`.
- Admin Web was started at `127.0.0.1:3001`.
- `npm run runtime:check` passed after being strengthened to match the Admin Web actor contract.
- API health returned HTTP 200.
- Admin Web returned HTTP 200.

## Phase 8 Status Correction

Phase 8 is now restored to complete.

Contractor create/list/photo persistence has been verified through live API, PostgreSQL, Admin Web dev actor headers, and browser UAT.

## Next Step

Staff management can proceed as the next controlled slice.
