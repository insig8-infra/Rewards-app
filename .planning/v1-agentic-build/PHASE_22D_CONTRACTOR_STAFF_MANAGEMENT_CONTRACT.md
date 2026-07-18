# Phase 22D Contract - Contractor And Staff Management Recovery

Status: Complete
Created: 2026-07-07
Completed: 2026-07-07

## Source Inputs

- `AGENTS.md`
- `apps/admin-web/AGENTS.md`
- `PHASE_20_ADMIN_WEB_CONTRACT.md`
- `PHASE_20_UI_RECOVERY_CONTRACT.md`
- `MANUAL_UAT1_TRIAGE.md`
- `OPEN_QUESTIONS.md`
- `REQUIREMENTS_LEDGER.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `architecture/DECISIONS.md`
- `PHASE_22_STATUS.md`
- `PHASE_22_EXECUTION_PLAN.md`

## Open-Question Review

Relevant Phase 22D questions are resolved or explicitly bounded:

- Contractor name and mobile are immutable after registration per `DEC-043`, `WEB-021`, and `MADM-021`.
- Contractor human name stays in `User.displayName`; no duplicate `Contractor.name` column is added per `DEC-035`.
- OWNER can reset contractor MPIN from Admin Web per `AUTH-025`.
- Staff profile expansion remains deferred. Phase 22D uses current staff fields: name, mobile, status, created date, last opened where available, created-by owner where available.
- STAFF mobile-number editing remains deferred. Phase 22D supports create, detail, reset PIN, deactivate, and reactivate only.
- Contractor photo storage remains a local development boundary: device uploads are compressed to small profile-image data URLs in `photoUrl`. Production object storage/provider remains open before launch.
- Production OTP/SMS and failed-attempt lockout rules remain open and do not block this local product-grade management slice.

No user decision blocks Phase 22D implementation if these boundaries are preserved.

## Primary Job

Recover Admin Web contractor and staff management from a single-page validation shell into product-grade routed operations flows with backend-enforced identity rules and visible persistence readback.

## Route Map

| Route | Screen | OWNER | STAFF | Purpose |
| --- | --- | --- | --- | --- |
| `/contractors` | Contractor Directory | full | read-only | Search/filter/sort contractor roster and open details |
| `/contractors/new` | Add Contractor | yes | no | Register contractor with name, mobile, optional device photo |
| `/contractors/[contractorId]` | Contractor Detail | full allowed actions | read-only | Identity, metrics, sites, recent context, photo/status/MPIN controls |
| `/staff` | Staff Directory | yes | no | Search/filter/sort staff roster and open details |
| `/staff/new` | Add Staff | yes | no | Create staff and show generated PIN once |
| `/staff/[staffId]` | Staff Detail | yes | no | Staff identity, status, reset PIN, deactivate/reactivate |

## Contractor Directory Requirements

- Search by contractor name, mobile, contractor code, site/city.
- Filters: all, active, deactivated, tier, has rewards, has scans.
- Sort: newest, name, available points, total points, scan count.
- Rows show photo/avatar, name, mobile, contractor code, tier, status, available points, total points, site count, scan count, and reward-claim count.
- OWNER sees an Add Contractor action near the directory controls.
- STAFF can open details but sees no mutation controls.
- Empty, loading, and error states must be visible and non-placeholder.

## Add Contractor Requirements

- Dedicated route `/contractors/new`.
- Captures name, mobile, and optional device photo upload.
- Duplicate mobile returns the existing contractor summary and blocks creation.
- Success routes to `/contractors/[contractorId]`.
- Welcome SMS remains a mock/local delivery boundary until provider selection.
- Device photo upload must be keyboard/mouse accessible and visibly preview uploaded image before submit.

## Contractor Detail Requirements

- Identity header shows photo/avatar, immutable name, immutable mobile number, contractor code, tier, and status.
- Name and mobile are displayed as locked/read-only identity facts. They must not be editable in the UI.
- Backend must reject attempts to change name or mobile through contractor update endpoints.
- OWNER can update photo separately from identity display.
- OWNER can deactivate active contractors.
- OWNER can reactivate deactivated contractors.
- OWNER can reset contractor MPIN and see the temporary MPIN once.
- Deactivate/reactivate controls are separated from photo update and must not look like a normal save button.
- Detail shows metrics: available points, total accumulated points, site count, scan count, reward claim count.
- Detail shows site list with active/archived status and scan count.
- Detail copy must guide wrong name/mobile correction through deactivate plus new registration, not through editing.
- STAFF sees the same identity and read model without mutation controls.

## Staff Directory Requirements

- OWNER-only route. STAFF must not see nav link and direct URL access must remain blocked before rendering management data.
- Search by staff name and mobile.
- Filters: all, active, deactivated.
- Sort: newest, name, last opened.
- Rows show name, mobile, status, created date, last opened where available, and detail link.
- OWNER sees Add Staff near the directory controls.

## Add Staff Requirements

- Dedicated route `/staff/new`.
- Captures staff name and mobile.
- Duplicate mobile blocks creation and returns existing staff summary when available.
- Generated temporary PIN is shown once after creation.
- Success state must include a route to staff detail.
- PIN delivery remains a mock/local boundary until production provider selection.

## Staff Detail Requirements

- Shows name, mobile, status, created date, last opened where available, and created-by owner where available.
- OWNER can reset PIN for active staff and see the generated PIN once.
- OWNER can deactivate active staff.
- OWNER can reactivate deactivated staff.
- Staff mobile editing remains out of scope for Phase 22D.
- STAFF has no access to staff management.

## Backend Contract Changes

- `PATCH /admin-web/contractors/:contractorId` accepts photo-only updates in product behavior. Name and mobile changes must be rejected server-side.
- `POST /admin-web/contractors/:contractorId/reactivate` reactivates contractor and user status.
- `POST /admin-web/contractors/:contractorId/reset-mpin` remains OWNER-only and returns temporary MPIN once.
- `GET /admin-web/staff/:staffId` returns staff detail.
- Staff create/reset/deactivate/reactivate remain OWNER-only.
- All mutations write audit events with actor, target, before/after state, and mock delivery metadata where relevant.

## Visual And Interaction Direction

- Dense operational directory, not a generic CRUD panel.
- Routed detail pages instead of large inline expansion.
- Action buttons sit near the specific record or state they control.
- Dangerous/status actions require clear visual separation from normal save/update actions.
- No nested cards.
- Use compact controls, avatars, badges, and row facts for scanability.
- Text must not overflow rows, buttons, or inputs on desktop or mobile widths.

## Verification Gate

Phase 22D is complete only when:

- `/contractors` supports search/filter/sort and opens detail.
- `/contractors/new` creates a contractor with optional uploaded image and routes to detail.
- `/contractors/[contractorId]` shows immutable name/mobile, photo update, deactivate/reactivate, reset MPIN, sites, and metrics.
- Backend rejects contractor name/mobile mutation attempts.
- STAFF can view contractor list/detail read-only and cannot see mutation controls.
- `/staff` supports search/filter/sort and opens detail for OWNER.
- `/staff/new` creates staff, shows generated PIN once, and links to detail.
- `/staff/[staffId]` supports reset PIN, deactivate, and reactivate for OWNER.
- STAFF direct `/staff`, `/staff/new`, and `/staff/[staffId]` access is blocked.
- API/database readback confirms every mutation.
- Automated API and Admin Web tests pass.
- Full `npm test` passes.
- Browser UAT covers OWNER and STAFF routes, device photo upload, mutation readback, and zero browser console errors.

## Completion Evidence

Completed on 2026-07-07.

Implemented:

- `/contractors` routed contractor directory with search, filters, sorting, identity facts, points, site, and scan summaries.
- `/contractors/new` routed contractor registration with accessible device photo upload and visible preview.
- `/contractors/[contractorId]` routed contractor detail with immutable name/mobile display, photo-only update, reset MPIN, deactivate/reactivate, metrics, and site list.
- Backend-enforced contractor name/mobile immutability on `PATCH /admin-web/contractors/:contractorId`.
- `/staff` routed OWNER-only staff directory with search, filters, sorting, and detail links.
- `/staff/new` routed staff creation with generated temporary PIN shown once.
- `/staff/[staffId]` routed staff detail with reset PIN, deactivate, and reactivate controls.
- STAFF read-only contractor access and blocked staff-management routes.

Verification:

- `npm run build --workspace @volt-rewards/api` passed.
- `npm run typecheck --workspace @volt-rewards/admin-web` passed.
- `npm run test:api` passed.
- `npm run test:admin-web` passed.
- `npm test` passed across domain, API, admin web, mobile, and admin mobile.
- Browser UAT passed for OWNER contractor create with image upload, contractor photo update, reset MPIN, deactivate/reactivate, backend identity mutation rejection, staff create/detail/reset/deactivate/reactivate, STAFF read-only contractor detail, STAFF hidden staff nav, STAFF direct staff route blocking, and zero app console errors.
- Screenshots captured:
  - `/tmp/admin-web-phase22d-contractors-directory.png`
  - `/tmp/admin-web-phase22d-contractor-detail.png`
  - `/tmp/admin-web-phase22d-staff-directory.png`
  - `/tmp/admin-web-phase22d-staff-detail.png`
  - `/tmp/admin-web-phase22d-staff-readonly-contractor.png`
