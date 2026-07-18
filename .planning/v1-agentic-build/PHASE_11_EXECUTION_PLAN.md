# Phase 11 Execution Plan - Staff Management Foundation

## Goal

Implement the shared staff-management foundation for Admin Web and future Admin Mobile parity: OWNER can list, create, reset PIN, deactivate, and reactivate STAFF accounts, while STAFF cannot access staff management.

## Source Requirements

- `WEB-014`
- `WEB-015`
- `MADM-006`
- `MADM-007`
- `MADM-008`
- `MADM-012`
- `MADM-023`

## Scope

Included:

- Admin Web staff-management API endpoints:
  - `GET /admin-web/staff`
  - `POST /admin-web/staff`
  - `POST /admin-web/staff/:staffId/reset-pin`
  - `POST /admin-web/staff/:staffId/deactivate`
  - `POST /admin-web/staff/:staffId/reactivate`
- OWNER-only server-side authorization through `ADMIN_MANAGE_STAFF`.
- Staff list summaries with active/deactivated status and created/deactivated timestamps.
- Staff creation with name, mobile number, and app-generated 4-digit PIN.
- PIN reset with app-generated replacement PIN.
- Soft deactivate/reactivate by updating linked `User` and `StaffProfile`.
- Audit events for create/reset/deactivate/reactivate.
- Admin Web staff screen with OWNER workflow controls.
- STAFF navigation/access denial remains enforced server-side and hidden client-side.

Excluded:

- Real OWNER/STAFF login.
- PIN authentication and session persistence.
- SMS/WhatsApp PIN delivery.
- Editing staff profile fields after creation.
- Admin Mobile staff UI implementation.
- Production PIN hashing/rate-limit hardening.

## Open Questions

- Exact staff profile fields are still open. Phase assumption: v1 staff creation needs only name and mobile number.
- Real PIN delivery remains blocked by OTP/SMS provider. Phase boundary: local/dev returns the generated PIN in the API response after create/reset and records mock delivery in audit metadata.
- Lockout/rate-limit rules remain open for the future auth hardening slice.

## Architecture Touchpoints

- Domain services: staff name/mobile/PIN input validation helpers.
- API routes: Admin Web staff endpoints.
- Database tables: `User`, `StaffProfile`, `AuditEvent`.
- UI surfaces: Admin Web `/staff`.
- Background jobs: none.
- Audit events: `STAFF_CREATED`, `STAFF_PIN_RESET`, `STAFF_DEACTIVATED`, `STAFF_REACTIVATED`.

## Tests And Evals

- Unit:
  - Staff profile normalization and 4-digit PIN validation.
  - Permission matrix keeps STAFF denied for `ADMIN_MANAGE_STAFF`.
- Integration/API:
  - OWNER can create staff.
  - Duplicate mobile is blocked.
  - OWNER can reset PIN.
  - OWNER can deactivate/reactivate staff.
  - STAFF receives forbidden response for staff management endpoints.
- UI/E2E:
  - Admin Web API client covers staff endpoints and actor headers.
- Browser workflow UAT:
  - Exact URL(s): `http://127.0.0.1:3001/staff`
  - Persona/actor context: OWNER and STAFF dev actors.
  - Hydration/console/network check: no workflow errors.
  - Visible-control interaction proof: create staff form, reset PIN, deactivate, reactivate.
  - Happy path: OWNER creates staff and sees generated PIN result.
  - Edit/update path: PIN reset path.
  - Delete/deactivate/cancel path: deactivate and reactivate.
  - Denied/read-only role path: STAFF cannot access staff management controls.
  - Persistence checks after each mutation: API/database readback.
  - Desktop/mobile layout checks: `/staff` desktop and mobile-width render without overlap.
- Security:
  - No raw PIN persistence in list/detail responses.
  - Audit events for high-risk staff mutations.
  - No client-only authorization.
- Manual review:
  - Confirm remaining auth/SMS boundaries are documented.

## Implementation Tasks

- [x] Add domain staff validation helpers and tests.
- [x] Add Admin Staff service/repository/controller/module and tests.
- [x] Wire Staff module into API.
- [x] Add Admin Web API client types/methods/tests.
- [x] Replace `/staff` placeholder with staff management workspace.
- [x] Update API contract and phase status docs.
- [x] Run static verification.
- [x] Run runtime persistence gate.
- [x] Run Browser UAT against exact URL and both roles.

## Exit Gates

- [x] Requirement IDs satisfied.
- [x] Tests pass.
- [x] Browser workflow UAT completed for `/staff`.
- [x] Browser UAT exercised visible controls directly; no direct API shortcut was used as sole proof.
- [x] Exact user-facing local URL was tested.
- [x] Browser console/network/hydration failures were checked.
- [x] Each UI mutation verified through persisted API/database readback.
- [x] Denied paths tested.
- [x] Audit events added for staff mutations.
- [x] Security/eval gate completed.
- [x] Residual risks documented.
