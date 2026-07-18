# Phase 22 UI Spec - Admin Web Product-Grade Recovery

Status: Active for Phase 22 implementation - Phase 22A Verified
Created: 2026-07-07
Last Updated: 2026-07-07

## Persona

- OWNER: full Admin Web operations and management.
- STAFF: operational access without owner-only management routes.

## Phase 22A Screen Contract

### `/login`

Primary job:

- OWNER or STAFF signs into Admin Web using mobile number and PIN.

Data shown:

- App name: `Volt Admin Web Portal`.
- Role segmented control: OWNER / STAFF.
- Mobile number.
- PIN.
- Error message for invalid credentials.

Primary action:

- Sign in.

Secondary action:

- None for v1. Forgot PIN remains handled by OWNER/staff reset flows outside Admin Web login.

States:

- Loading while login request is in progress.
- Validation error for missing/invalid mobile or PIN shape.
- API error for invalid credentials.
- Success redirects to `/dashboard`.

Security:

- Login response session token is never stored in browser-readable storage.
- Next route handler sets the session token in an HttpOnly cookie.
- Client receives only non-sensitive admin profile/display state.

### Protected Shell

Primary job:

- Show the authenticated admin their allowed navigation and current role context.

Data shown:

- Portal brand.
- Authenticated role.
- Allowed navigation items.
- Logout action.

Navigation rules:

- OWNER sees Dashboard, Print QR codes, Invoice Ledger when implemented, Print History, Contractors, Staff, Rewards, Reports, Promotions.
- STAFF sees Dashboard, Print QR codes, Invoice Ledger when implemented, Print History, Contractors, Reports where exposed.
- STAFF does not see Staff, Rewards, or Promotions in normal nav.
- Returned-product QR scan/cancel/reverse is not exposed in Admin Web.

States:

- Unauthenticated route redirects to `/login`.
- Expired/invalid session redirects to `/login`.
- Owner-only route reached by STAFF shows an access-controlled state or redirects to dashboard with clear blocked status.
- Logout clears the session cookie and returns to `/login`.

### API Proxy Path

Primary job:

- Let client components call Admin Web backend APIs without exposing the bearer session token to JavaScript.

Behavior:

- Client calls `/api/admin/backend/...`.
- Next route handler reads HttpOnly session cookie.
- Next route handler forwards request to Nest API with `Authorization: Bearer <token>`.
- If backend returns `401`, client can redirect to `/login`.
- If backend returns `403`, UI renders permission-denied state.

## Later Phase 22 Screen Contracts

### Dashboard

Locked by `PHASE_20_ADMIN_WEB_CONTRACT.md`.

Required:

- Attention queue.
- Clickable metric drilldowns.
- Recent activity with human-readable labels.
- Shortcuts for Print QR, Add Contractor, Contractor Directory, Print History, Reports, Staff Management for OWNER.

### QR Print Queue / Invoice Ledger / Print History

Locked by `PHASE_20_ADMIN_WEB_CONTRACT.md` and Phase 21 return model.

Required:

- QR Print Queue excludes Return of Sale vouchers and non-printable invoices.
- Invoice Ledger shows all sale invoices and linked return history.
- Print History is a separate route.
- All lists include approved first-pass search/filter/sort controls.

### Contractor / Staff Management

Locked by `PHASE_20_ADMIN_WEB_CONTRACT.md`.

Required:

- Dedicated create routes or focused modal flows.
- List tooling before detail.
- Contractor name/mobile immutable after creation.
- Photo update separate from deactivate/reactivate.
- STAFF read-only for contractors and blocked from staff management.

## Visual Direction

Admin Web should be a dense, calm operations portal:

- Compact side navigation.
- Tables or compact rows for operational lists.
- Small status chips and filters.
- Controls placed near affected data.
- No marketing hero sections.
- No decorative gradients/orbs.
- No nested cards.

The existing teal/earth accent direction may be retained, but Phase 22 visual revisions must avoid generic panel repetition and improve hierarchy, route clarity, and data density.

## UAT Targets

- URL: `http://127.0.0.1:3001`
- API: `http://127.0.0.1:3000/api`
- OWNER: `9000000091` / PIN `1111`
- STAFF: `9000000092` / PIN `2222`

## Completion Gate

Phase 22A can be marked complete only when:

- Real login works for OWNER and STAFF.
- Dev actor selector is gone from product shell.
- Session token is stored in HttpOnly cookie.
- Protected routes block unauthenticated users.
- Owner-only routes block STAFF by direct URL.
- Logout clears session.
- Admin API client product path uses the Next proxy without actor headers.
- Browser visible-control UAT and tests pass.

Result on 2026-07-07: Phase 22A completion gate passed. See `PHASE_22_STATUS.md` and `PHASE_22_EXECUTION_PLAN.md` for verification evidence.
