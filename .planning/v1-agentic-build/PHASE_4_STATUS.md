# Phase 4 Status - Backend Actor Guard Boundary

Updated: 2026-06-22

## Completed

- Added backend actor context model for protected API shells.
- Added temporary header-backed actor parsing:
  - `x-actor-role`
  - `x-actor-user-id`
  - `x-actor-contractor-id`
  - `x-actor-team-member-mobile`
- Added `ActorGuard`, `@RequireAction(...)`, and `@CurrentActor()`.
- Added `AuthModule`.
- Added domain `QR_SCAN` permission for Contractor and Team Member.
- Protected Admin Web mock BUSY and QR print endpoints with `ADMIN_PRINT_QR`.
- Protected scan endpoint with `QR_SCAN`.
- Admin Web QR print no longer reads `actorRole` or `actorUserId` from body.
- QR scan no longer reads `actorRole` or `contractorId` from body.
- BUSY mock import can now write audit actor context when actor user id exists.
- Added tests for allowed, unauthorized, forbidden, and forged-body actor scenarios.

## Files Added

- `apps/api/src/auth/authenticated-actor.ts`
- `apps/api/src/auth/current-actor.decorator.ts`
- `apps/api/src/auth/require-action.decorator.ts`
- `apps/api/src/auth/actor.guard.ts`
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/actor.guard.test.ts`
- `apps/api/src/auth/controller-actor-context.test.ts`

## Files Updated

- `packages/domain/src/permissions.ts`
- `packages/domain/src/permissions.test.ts`
- `apps/api/src/busy/busy-import.repository.ts`
- `apps/api/src/busy/busy-import.service.ts`
- `apps/api/src/busy/prisma-busy-import.repository.ts`
- `apps/api/src/busy/admin-web-busy.controller.ts`
- `apps/api/src/busy/busy.module.ts`
- `apps/api/src/qr/admin-web-qr.controller.ts`
- `apps/api/src/qr/scan.controller.ts`
- `apps/api/src/qr/qr.module.ts`

## Verification

- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.

Current test count: 35 passing.

## Important Implementation Notes

- This is not final production authentication. It is a server-side development auth boundary for protected shells until OWNER/STAFF login, Contractor MPIN, and Team Member OTP are implemented.
- Controller bodies no longer carry actor role for Admin Web QR print or scan flows.
- Scan still depends on a temporary actor contractor scope header until real Contractor/Team Member sessions exist.
- Domain preview endpoints remain unguarded because they are development-only previews, not production contracts.

## Next Slice

Admin Web UI shell was completed in `PHASE_5_EXECUTION_PLAN.md` and `PHASE_5_STATUS.md`.

Next slice: implement database-backed Admin Web invoice list/detail endpoints and remove UI mock line templates.
