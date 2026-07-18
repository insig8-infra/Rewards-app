# Phase 8 Status - Contractor Management Foundation

Updated: 2026-06-30

## Current Status

Complete after 2026-06-30 runtime/UI correction.

Phase 8 was briefly over-claimed: the original evidence covered component smoke checks and direct API persistence, but not the exact Admin Web browser create path against Supabase. The browser path has now been verified after the Phase 8A/10 correction work.

See `PHASE_8A_STATUS.md` and `PHASE_10_STATUS.md`. Contractor management persistence has now been verified against live API, Supabase PostgreSQL, the Admin Web dev actor contract, and a real browser upload flow.

## Completed

- Corrected Admin Web port understanding: web UI runs on `127.0.0.1:3001`; backend API remains `127.0.0.1:3000`.
- Added domain contractor helpers:
  - Contractor name normalization.
  - Indian mobile number normalization.
  - ContractorID formatting as `CTR-000001`.
- Added `ADMIN_VIEW_CONTRACTOR` to the shared permission matrix.
- Added contractor backend module:
  - `AdminContractorService`
  - `PrismaAdminContractorRepository`
  - `AdminWebContractorsController`
  - `ContractorsModule`
- Added Admin Web contractor endpoints:
  - `GET /admin-web/contractors`
  - `GET /admin-web/contractors/:contractorId`
  - `POST /admin-web/contractors`
  - `PATCH /admin-web/contractors/:contractorId`
  - `POST /admin-web/contractors/:contractorId/deactivate`
- Contractor registration now:
  - Requires OWNER permission.
  - Normalizes name/mobile.
  - Blocks duplicate mobile numbers.
  - Creates linked `User` and `Contractor` records.
  - Auto-generates contractor code.
  - Writes audit event with mock welcome-message boundary.
- Contractor update and deactivation now write audit events.
- Admin Web API client now supports contractor list/detail/register/update/deactivate.
- Admin Web Contractors page now provides:
  - Contractor metrics.
  - Contractor list.
  - Contractor detail panel.
  - OWNER registration form with device photo upload and preview.
  - OWNER edit/deactivate controls.
  - STAFF read-only view.
- Device photo upload now normalizes selected images to small 320px JPEG profile thumbnails before submit, so normal phone/screenshot-sized uploads do not push large data URLs into remote PostgreSQL transactions.
- The shared domain contractor profile guard now rejects oversized inline photo payloads.
- Updated Admin Web visual treatment using `Sample_References/Stitch_Admin_design.md`:
  - Deep teal sidebar.
  - Denser operational card layout.
  - More polished contractor rows with avatars.
  - File upload panel instead of a raw photo URL field.
- No Admin Web returned-product QR status scan/cancel/reverse controls were added.

## Files Added

- `packages/domain/src/contractors.ts`
- `packages/domain/src/contractors.test.ts`
- `apps/api/src/contractors/admin-contractor.repository.ts`
- `apps/api/src/contractors/admin-contractor.service.ts`
- `apps/api/src/contractors/admin-contractor.service.test.ts`
- `apps/api/src/contractors/admin-web-contractors.controller.ts`
- `apps/api/src/contractors/contractors.module.ts`
- `apps/api/src/contractors/prisma-admin-contractor.repository.ts`
- `apps/admin-web/src/components/AdminContractorsWorkspace.tsx`

## Files Updated

- `packages/domain/src/index.ts`
- `packages/domain/src/permissions.ts`
- `packages/domain/src/permissions.test.ts`
- `packages/domain/src/contractors.ts`
- `packages/domain/src/contractors.test.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/auth/controller-actor-context.test.ts`
- `apps/admin-web/src/api/adminApi.ts`
- `apps/admin-web/src/api/adminApi.test.ts`
- `apps/admin-web/next.config.ts`
- `apps/admin-web/app/contractors/page.tsx`
- `apps/admin-web/app/globals.css`
- `.planning/v1-agentic-build/architecture/API_CONTRACTS_DRAFT.md`

## Verification

- `npm run typecheck` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- `npm run build --workspace @volt-rewards/admin-web` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.
- Playwright desktop smoke check passed for `/contractors` rendering and STAFF read-only behavior.
- Playwright desktop smoke check passed for contractor photo upload preview.
- Playwright mobile smoke check passed for `/contractors` layout.
- Phase 10 runtime gate passed against live API and Supabase PostgreSQL:
  - `npm run runtime:check` passed.
  - Contractor create/list/photo persistence verified through API and database.
  - Admin Web dev actor IDs are now seeded and checked.
  - QR print actor persistence is now checked.
  - API returned HTTP 200 at `127.0.0.1:3000/api/health`.
  - Admin Web returned HTTP 200 at `127.0.0.1:3001`.
- Browser UAT after correction passed:
  - Uploaded `Sample_References/SCR-20260622-ooce.jpeg` from the device-file input.
  - Browser compressed the 761,855 byte JPEG to a 15,255 character `data:image/jpeg` profile value.
  - `POST /api/admin-web/contractors` returned HTTP 201.
  - Created contractor `CTR-000008` appeared in the visible Admin Web contractor list.
- 2026-07-01 Contractor workflow UAT passed after dev-server restart:
  - API running at `127.0.0.1:3000`; Admin Web running at `127.0.0.1:3001`.
  - Fixed Next dev resource blocking for `127.0.0.1` via `allowedDevOrigins`.
  - Verified that the visible `Browse` photo-upload control opens the file chooser at `http://127.0.0.1:3001/contractors`; direct hidden-input upload is no longer treated as sufficient evidence.
  - Created contractor `CTR-000010` with device image upload from `Sample_References/SCR-20260622-ooce.jpeg`.
  - Duplicate mobile registration returned HTTP 409.
  - Edited contractor name/mobile and verified API readback.
  - Deactivated contractor and verified API status `DEACTIVATED`.
  - STAFF view hides register panel, detail edit inputs, Save/Deactivate controls, and owner-only nav entries.

Current test count: 53 passing.

## Important Implementation Notes

- This is the shared backend contractor-management foundation; Admin Mobile can reuse these service rules in a later slice.
- Real SMS/welcome message delivery is not implemented because OTP/SMS provider is still open.
- Contractor photo upload currently stores a browser-produced compressed profile-image data URL in the existing `photoUrl` field. This satisfies local workflow continuity; production should replace it with object storage/media service before launch.
- Temporary MPIN generation and first-login SET MPIN remain part of the Contractor auth slice.
- Contractor deactivation is soft deactivation, not hard deletion.
- STAFF cannot access mutation endpoints through the permission matrix, and the UI hides mutation controls.
- Live contractor persistence is now verified by Phase 10 runtime gate.
- A later correction found the Admin Web API client also needed the backend global prefix `/api`; this is fixed in Phase 8A.
- A 2026-07-01 forensic correction found that prior UAT evidence was still too indirect for visible file-upload behavior. Future contractor-management changes must follow the stricter Browser UAT contract in `skills/ui_surface_implementation/SKILL.md`.

## Next Slice

Staff management can proceed as the next controlled slice.
