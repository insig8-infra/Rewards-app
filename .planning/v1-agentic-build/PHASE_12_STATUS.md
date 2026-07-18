# Phase 12 Status - End-User Sites And Scan History API Foundation

## Verdict

Complete.

Phase 12 implements the backend API foundation for Contractor and Team Member site selection, Contractor site management, QR scan attribution, and scan history. This keeps the future mobile app tied to persisted backend behavior rather than local-only state.

## Requirements Covered

- `SITE-001` through `SITE-010`: Site listing, creation, editing, active-site selection, Team Member read-only access, and soft archive are implemented at API/domain level.
- `AUTH-022`: Team Member API access remains scan/site/history limited.
- `AUTH-026`: Team Member remains a temporary session actor; scan attempts store mobile/session metadata without creating durable Team Member profiles.
- `SCAN-001` through `SCAN-003`: Scan history is QR scan history and includes success/failure attempts.
- `SCAN-005` through `SCAN-010`: History includes QR unit id, actor type, Team Member mobile/session metadata, filters, and failure reasons.

## Delivered

- Domain site validation helpers and tests.
- Prisma migration `202607010001_scan_attempt_team_member_metadata`.
- Contractor site endpoints:
  - `GET /contractor/sites`
  - `POST /contractor/sites`
  - `PATCH /contractor/sites/:siteId`
  - `POST /contractor/sites/:siteId/archive`
- Team Member active-site endpoint:
  - `GET /team-member/sites`
- Scan history endpoint:
  - `GET /scan/history`
- QR scan persistence updates:
  - Failed attempts keep contractor/site context when available.
  - Team Member scans persist `teamMemberMobile`, `teamMemberSessionId`, and optional `deviceContext`.
  - History output does not expose raw token hashes.
- Runtime gate now verifies live site create/list/update/archive, Team Member read-only denial, Team Member scan, and scan history readback.

## Verification

- `npm run prisma:migrate:deploy --workspace @volt-rewards/api`: pass; migration applied to Supabase dev database.
- `node --check tools/verify-local-runtime.mjs`: pass.
- `npm run prisma:validate --workspace @volt-rewards/api`: pass.
- `npm run test --workspace @volt-rewards/domain`: pass, 28 tests.
- `npm run test --workspace @volt-rewards/api`: pass, 39 tests.
- `npm run typecheck`: pass.
- `npm test`: pass, 72 tests total.
- `npm run lint`: pass.
- `npm run runtime:check`: pass.
- `npm run build --workspace @volt-rewards/admin-web`: pass.
- `git diff --check`: pass.
- `npm --cache .npm-cache audit --omit=dev`: pass, 0 vulnerabilities.

## Runtime Gate Coverage

The live runtime gate now verifies:

- API and Supabase PostgreSQL connectivity.
- Admin Web dev OWNER/STAFF seed users.
- Contractor persistence.
- Staff lifecycle persistence.
- Contractor site creation using actor contractor scope.
- Contractor site list and update.
- Team Member active-site list.
- Team Member cannot create contractor sites.
- Team Member QR scan with mobile/session attribution.
- Scan history returns the successful scan with Team Member mobile/session metadata.
- Contractor site archive after scan history exists.
- Archived site is excluded from Team Member active-site selection.
- QR print persistence still works.

## Security And Evaluation Notes

- Contractor site ownership comes only from guarded actor context.
- Team Member mutation is blocked by `ActorGuard` and permission policy.
- Sites are archived, not hard-deleted.
- Scan history omits QR token hashes.
- Team Member scan attribution is stored as session metadata, not as a durable saved Team Member profile.

## Residual Risks

- Real Contractor MPIN auth and Team Member OTP/session APIs are still deferred.
- Mobile UI implementation is still deferred; this phase only builds backend/API behavior.
- Superseded by 2026-07-02 decision DEC-029: Contractor sees full contractor scan history across sites and Team Member scans; Team Member sees only scans for sites they scanned for or attempted to scan for within allowed scope. Phase 14 must verify whether the current API already enforces this server-side and fix it if needed.
- City/area controlled lists remain a future refinement; Phase 12 uses free-text site fields.
- Production device-context schema should be tightened when real mobile telemetry requirements are known.
