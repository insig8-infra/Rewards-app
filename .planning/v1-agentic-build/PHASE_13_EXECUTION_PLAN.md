# Phase 13 Execution Plan - Contractor MPIN And Team Member OTP Auth API

## Goal

Implement the backend authentication foundation for the end-user mobile app: Contractor MPIN login/setup/change/reset and Team Member OTP request/verify, using persisted sessions and mock SMS delivery until a production SMS provider is selected.

## Source Requirements

- `AUTH-002`
- `AUTH-003`
- `AUTH-004`
- `AUTH-005`
- `AUTH-006`
- `AUTH-007`
- `AUTH-008`
- `AUTH-009`
- `AUTH-010`
- `AUTH-011`
- `AUTH-012`
- `AUTH-013`
- `AUTH-014`
- `AUTH-019`
- `AUTH-021`
- `AUTH-022`
- `AUTH-023`
- `AUTH-024`
- `AUTH-025`
- `AUTH-026`

## Scope

Included:

- Auth domain validation helpers for mobile number, 4-digit MPIN, and OTP.
- Persistent auth-session model with hashed bearer tokens.
- Persistent OTP challenge model with hashed OTPs.
- Contractor auth endpoints:
  - `POST /auth/contractor/login`
  - `POST /auth/contractor/set-mpin`
  - `POST /auth/contractor/change-mpin`
  - `POST /auth/contractor/forgot-mpin`
- Admin reset endpoint:
  - `POST /admin-web/contractors/:contractorId/reset-mpin`
- Team Member auth endpoints:
  - `POST /auth/team-member/request-otp`
  - `POST /auth/team-member/verify-otp`
- ActorGuard accepts persisted `Authorization: Bearer <sessionToken>` sessions in addition to existing development actor headers.
- Mock SMS/local delivery responses return temporary MPIN/OTP only in local/dev API responses and audit metadata.
- Runtime gate extension for reset MPIN -> temp login -> set MPIN -> normal login -> change MPIN -> Team Member OTP -> bearer-token site access.

Excluded:

- Production SMS/WhatsApp provider integration.
- Production lockout/rate-limit rules.
- Passwordless admin login hardening.
- Mobile UI implementation.
- Secure-device-storage implementation for Team Member Recent list.

## Open Questions And Phase Assumptions

- OTP/SMS provider remains open. Phase 13 uses mock delivery and clear response metadata for local/dev.
- MPIN/OTP lockout and rate-limit rules remain open. Phase 13 records attempts/audit where relevant but does not enforce production throttling.
- Team Member session daily reset is implemented as session expiry at the end of the current local day.
- Contractor authenticated sessions use a 30-day expiry for now; exact production remember-me/session duration can be tuned later.

## Architecture Touchpoints

- Domain services: auth input validation.
- Database: `AuthSession`, `OtpChallenge`, `Contractor.temporaryMpinExpiresAt`.
- API routes: auth controllers and Admin Web contractor reset MPIN endpoint.
- Guard layer: `ActorGuard` bearer session support.
- Audit events: contractor MPIN reset/set/change, Team Member OTP requested/verified.

## Tests And Evals

- Unit:
  - Auth validation.
  - Contractor temp MPIN login requires setup.
  - Contractor set MPIN consumes temp hash and creates full session.
  - Contractor change MPIN validates old MPIN and rotates sessions.
  - Team Member OTP verify creates temporary session scoped to contractor.
- Controller/guard:
  - Protected routes can be accessed with bearer session.
  - Dev actor headers still work.
  - Team Member bearer session keeps contractor scope and team-member mobile.
- Runtime:
  - Reset contractor MPIN, login temp, set MPIN, login normal, change MPIN.
  - Request/verify Team Member OTP and use returned session token to call `GET /team-member/sites`.

## Implementation Tasks

- [x] Add auth domain validation helpers and tests.
- [x] Add Prisma auth-session/OTP schema and migration.
- [x] Implement auth repository/service/controllers and tests.
- [x] Add Admin Web contractor reset MPIN endpoint.
- [x] Update ActorGuard for bearer sessions.
- [x] Update API contracts and open questions.
- [x] Extend runtime gate.
- [x] Apply migration and run verification gates.
- [x] Record phase status.

## Exit Gates

- [x] Requirement IDs satisfied or explicitly deferred.
- [x] Tests pass.
- [x] Migration applied to Supabase dev database.
- [x] Runtime gate passes using bearer sessions.
- [x] Auth tokens and MPIN/OTP values are stored only as hashes.
- [x] Neutral not-found responses avoid contractor enumeration where required.
- [x] Residual risks documented.
