# Phase 25F Contract - Admin Mobile Contractors, Staff, Reports Parity

Status: Active Contract  
Created: 2026-07-12  
Owner: Codex

## Source Requirements

- `MADM-006`, `MADM-016` through `MADM-023`, `MADM-031`, `MADM-033`
- `.planning/v1-agentic-build/Mobile_App_ManualUAT`
- `.planning/v1-agentic-build/MOBILE_APP_MANUAL_UAT_TRIAGE.md`
- `.planning/v1-agentic-build/PHASE_25_MOBILE_UAT_REMEDIATION_PLAN.md`
- `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`
- `.planning/v1-agentic-build/PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `.planning/v1-agentic-build/SECURITY_AND_EVALUATION_PLAN.md`

## Intent

Turn Admin Mobile Contractors, Staff, and Reports from partial/static surfaces into role-aware operational workflows that match the Admin Web capability envelope where mobile is appropriate.

This phase does not claim native store readiness. Native camera/image-picker proof remains a later residual gate.

## Locked Assumptions

- Bottom navigation remains `Dashboard`, `Return`, `Contract`, `Rewards`, `Reports` for OWNER, matching `MADM-009` and avoiding a crowded mobile tab bar.
- Staff management is exposed inside the OWNER-only Reports/Operations area and from the Dashboard Staff metric, not as a sixth bottom tab.
- Contractor name and mobile remain immutable after registration per `DEC-043`; OWNER can register, upload/change photo, reset MPIN, deactivate, and reactivate.
- STAFF can view contractor list/detail and reward history, but cannot register contractors, manage staff, export reports, or fulfill claims.
- Admin Mobile report viewing is in-app preview first. File export remains Admin Web primary unless explicitly added later.
- SMS delivery remains mocked in local development; returned temporary PIN/MPIN is shown only as dev evidence.

## Functional Requirements

### Contractors

- OWNER sees a contractor registration workflow inside the Contractors screen.
- Registration captures name, 10-digit mobile number, optional device photo, and blocks duplicate mobile numbers through the backend.
- Newly registered contractors appear in the list without requiring app restart.
- Contractor detail exposes OWNER actions:
  - upload/change photo
  - reset contractor MPIN
  - deactivate active contractor
  - reactivate deactivated contractor
- STAFF sees contractor list/detail as read-only with no owner mutation controls.

### Staff

- OWNER sees staff management from Reports/Operations and the Dashboard Staff metric.
- OWNER can list staff, add staff, upload staff photo, reset staff PIN, deactivate staff, and reactivate staff.
- STAFF cannot open staff management and receives no mutation controls.
- New staff appears in list without app restart.
- Temporary PIN from local development is shown in a contained status area only after create/reset.

### Reports

- Reports screen loads live report landing cards and shortcuts from the API.
- OWNER can open report preview rows for the core report IDs.
- Report preview shows summary metrics, readable row cards, row count, and generated/range metadata.
- Export copy is not shown as a working action unless wired to backend and proofed.

## API Requirements

- Expose Admin Mobile endpoints by reusing existing backend services and guards:
  - `POST /admin-mobile/contractors/:contractorId/reactivate`
  - `POST /admin-mobile/contractors/:contractorId/reset-mpin`
  - `GET /admin-mobile/staff`
  - `POST /admin-mobile/staff`
  - `GET /admin-mobile/staff/:staffId`
  - `POST /admin-mobile/staff/:staffId/photo`
  - `POST /admin-mobile/staff/:staffId/reset-pin`
  - `POST /admin-mobile/staff/:staffId/deactivate`
  - `POST /admin-mobile/staff/:staffId/reactivate`
  - `GET /admin-mobile/reports/landing`
  - `GET /admin-mobile/reports/:reportId`
- Do not duplicate business logic between Admin Web and Admin Mobile controllers.

## Visual And UX Requirements

- Mobile screens must stay within `360x740`, `390x844`, `430x932`, and `480x900` without clipped labels or oversized text.
- Forms must use compact labels, stable button heights, clear disabled states, and status feedback near the workflow.
- Owner-only sections must be clearly separated from read-only staff surfaces.
- Reports must be scannable on a phone; avoid wide table layouts.

## Exit Gates

- `npm run test --workspace @volt-rewards/api`
- `npm run test --workspace @volt-rewards/admin-mobile`
- `git diff --check`
- Visible proof at the phone viewport matrix for:
  - OWNER contractor registration and contractor detail owner actions
  - STAFF contractor read-only detail
  - OWNER staff management
  - OWNER live reports landing and one report preview
- Output eval, trajectory eval, and viewport proof docs updated before marking Phase 25F complete.
