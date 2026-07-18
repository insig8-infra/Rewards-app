# Phase 4 Execution Plan - Backend Actor Guard Boundary

## Goal

Add a server-side authorization boundary for high-risk API controller shells before building Admin Web UI on top of them.

## Source Requirements

- AUTH-001 through AUTH-023
- WEB-004 through WEB-012
- QR-001 through QR-018
- SCAN-001 through SCAN-009
- MADM-001 through MADM-024

## Tasks

- [x] Add authenticated actor request context type.
- [x] Add temporary header-backed actor parser for local/dev API shells.
- [x] Add `@RequireAction(...)` decorator.
- [x] Add `@CurrentActor()` decorator.
- [x] Add `ActorGuard` that reads required domain action metadata and enforces `can(actor.role, action)`.
- [x] Add `AuthModule` to expose the guard.
- [x] Add domain `QR_SCAN` permission for Contractor and Team Member.
- [x] Protect Admin Web mock BUSY endpoints with `ADMIN_PRINT_QR`.
- [x] Protect Admin Web QR print endpoint with `ADMIN_PRINT_QR`.
- [x] Protect QR scan endpoint with `QR_SCAN`.
- [x] Remove actor role/user id trust from Admin Web QR print request body.
- [x] Remove actor role/contractor id trust from QR scan request body.
- [x] Pass actor context into BUSY mock import for audit linkage where actor user id exists.
- [x] Add guard tests for allowed, missing, and forbidden actors.
- [x] Add controller tests proving forged body actor fields are ignored.

## Out Of Scope

- JWT/session token issuance.
- Contractor MPIN login.
- Team Member OTP login.
- OWNER/STAFF login.
- Real auth persistence and session expiry.
- Mobile or Admin Web UI changes.
- QR cancel/reverse and reward fulfillment controller implementation.

## Acceptance Criteria

- Protected controller shells no longer trust `actorRole` from body payloads.
- Admin Web QR print requires an actor permitted for `ADMIN_PRINT_QR`.
- QR scan requires an actor permitted for `QR_SCAN` and a contractor scope.
- Guard tests cover unauthorized and forbidden cases.
- Existing import -> print -> scan tests remain green.
- Security and dependency gates remain green.

## Verification

- `npm run prisma:validate --workspace @volt-rewards/api` - passed.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - 35 tests passing.
- `npm --cache .npm-cache audit --omit=dev` - found 0 vulnerabilities.

## Next Slice

Build the first Admin Web UI shell against these guarded backend contracts:

1. Scaffold Next.js Admin Web app.
2. Add API client wrapper that sends actor headers only from a central development auth context.
3. Build mock BUSY invoice list/import screen.
4. Build QR print selection workflow.
5. Add UI tests for quantity validation and no actor fields in request bodies.
