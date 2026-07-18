---
name: role-permissions
description: |
  Implement or review permissions for Contractor, Team Member, OWNER, and STAFF. Use for auth, sessions, access control, navigation visibility, and negative permission tests. Do NOT use for styling-only changes.
version: 0.1.0
authority: draft-only
---
# Role Permissions

## When To Use

- Implementing login/session behavior.
- Adding API endpoints with role checks.
- Building persona-specific UI.
- Reviewing Team Member, STAFF, or OWNER restrictions.

## When Not To Use

- Pure visual spacing or typography changes.
- Report calculations without access changes.

## Workflow

1. Identify actor role and surface: end-user app, admin mobile, admin web, backend job.
2. Read relevant AUTH, TMEM, MADM, and REP requirements.
3. Define server-side allow/deny behavior first.
4. Define data-visibility scope, not only action permissions.
5. Then hide or disable client UI affordances.
6. Add negative tests for forbidden actions and over-broad data visibility.

## Required Checks

- Contractor cannot self-register.
- Team Member must use OTP every session.
- Team Member Recent is convenience-only.
- Team Member Recent is one secure local entry, appears only after successful OTP login, is clearable, and never bypasses OTP.
- Team Member cannot create, edit, or delete sites.
- Contractor can see full contractor Scan History across all sites and Team Member scans.
- Team Member can see only scans for sites they scanned for or attempted to scan for within allowed scope.
- STAFF cannot add/edit/deactivate contractors.
- STAFF cannot manage staff or points.
- STAFF cannot export/share reports.
- Only OWNER can fulfill rewards unless requirements change.
