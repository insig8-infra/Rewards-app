# Phase 13 Status - Contractor MPIN And Team Member OTP Auth API

## Verdict

Complete.

Phase 13 implements persisted end-user auth APIs for Contractor MPIN and Team Member OTP flows, while keeping SMS delivery mocked until provider selection. Protected API routes now accept real bearer sessions in addition to existing local/dev actor headers.

## Requirements Covered

- `AUTH-002`: Backend now supports Contractor and Team Member auth entry points.
- `AUTH-003`: Contractor login verifies an active Contractor profile exists.
- `AUTH-004`: Contractor login validates registered mobile number plus 4-digit MPIN.
- `AUTH-005`: Temporary MPIN delivery is mocked and returned once in local/dev reset response.
- `AUTH-006`: Temporary MPIN login returns `MPIN_SETUP_REQUIRED`; SET MPIN is required before full session.
- `AUTH-007`: Contractor can change MPIN with old/new/confirm MPIN.
- `AUTH-008`: Forgot MPIN returns retailer/admin reset instruction.
- `AUTH-009`: Invalid contractor login gives contact-retailer/admin guidance.
- `AUTH-010` through `AUTH-014`: Team Member OTP flow works by contractor mobile number and does not expose a contractor list.
- `AUTH-019`: Team Member Recent remains non-authoritative; OTP verify is required for session.
- `AUTH-021`: Team Member session expires at end of current server-local day in Phase 13.
- `AUTH-022`: Team Member bearer sessions remain scoped to site selection, scan, and scan history through permissions.
- `AUTH-023`: Contractor bearer session exposes Contractor-scoped protected APIs.
- `AUTH-024`: Temporary reset MPIN is valid for 5 days.
- `AUTH-025`: OWNER can reset Contractor MPIN through Admin Web API.
- `AUTH-026`: Team Member remains a temporary session actor, not a saved profile.

## Delivered

- Domain auth validation helpers for mobile number, MPIN, MPIN confirmation, and OTP.
- Prisma migration `202607010002_end_user_auth_sessions`.
- New persistence:
  - `Contractor.temporaryMpinExpiresAt`
  - `AuthSession`
  - `OtpChallenge`
- Public auth endpoints:
  - `POST /auth/contractor/login`
  - `POST /auth/contractor/set-mpin`
  - `POST /auth/contractor/change-mpin`
  - `POST /auth/contractor/forgot-mpin`
  - `POST /auth/team-member/request-otp`
  - `POST /auth/team-member/verify-otp`
- Admin Web reset endpoint:
  - `POST /admin-web/contractors/:contractorId/reset-mpin`
- `ActorGuard` bearer-session support.
- Runtime gate now verifies reset MPIN, temporary login, set MPIN, normal login, change MPIN, Team Member OTP, and bearer-token protected route access.

## Verification

- `npm run prisma:migrate:deploy --workspace @volt-rewards/api`: pass; migration applied to Supabase dev database.
- `npm run test --workspace @volt-rewards/domain`: pass, 33 tests.
- `npm run test --workspace @volt-rewards/api`: pass, 44 tests.
- `npm run typecheck`: pass.
- `npm test`: pass, 82 tests total.
- `npm run lint`: pass.
- `npm run runtime:check`: pass.
- `npm run build --workspace @volt-rewards/admin-web`: pass.
- `git diff --check`: pass.
- `npm --cache .npm-cache audit --omit=dev`: pass, 0 vulnerabilities.

## Runtime Gate Coverage

The live runtime gate now verifies:

- API and Supabase connectivity.
- Contractor creation through Admin Web API.
- OWNER reset of Contractor temporary MPIN.
- Contractor temporary MPIN login returning setup-required session.
- Contractor SET MPIN creating a normal bearer session.
- Contractor normal MPIN login.
- Contractor change MPIN revoking prior sessions and returning a new session.
- Contractor bearer session can create/list/update/archive sites.
- Team Member OTP request returns mock local OTP for an active Contractor.
- Team Member OTP verify creates a temporary bearer session.
- Team Member bearer session can list active sites, cannot create sites, can scan QR, and can read scan history with Team Member attribution.

## Security And Evaluation Notes

- Session tokens are generated randomly, returned once, and stored only as hashes.
- Contractor MPIN values are stored only as hashes.
- Team Member OTP values are stored only as hashes.
- Temporary MPIN expiry is persisted.
- Team Member is represented by session metadata, not a durable `TeamMember` profile.
- Existing dev actor headers remain for local/admin workflows, but bearer sessions are now supported for mobile-authenticated routes.

## Residual Risks

- Production SMS/WhatsApp provider remains open.
- Production MPIN/OTP rate limits and lockout rules remain open before launch.
- Admin Mobile reset MPIN UI is not built yet; Phase 13 implements Admin Web API reset.
- Mobile UI and secure local storage for Team Member Recent remain future slices.
- Team Member session expiry currently uses server-local end-of-day; production timezone policy should be finalized before launch.
