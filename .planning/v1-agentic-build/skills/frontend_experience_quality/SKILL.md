---
name: frontend-experience-quality
description: |
  Plan or review frontend UX quality, visual hierarchy, control placement, screen states, polish, and reference usage for Volt Rewards mobile and web surfaces. Use for UI planning, implementation review, and deciding whether a frontend phase feels production-grade. Do NOT use for backend-only business rule validity.
version: 0.1.0
authority: draft-only
---
# Frontend Experience Quality

## When To Use

- Planning a new Admin Web, Admin Mobile, or end-user mobile screen.
- Reviewing whether a UI feels polished and production-grade.
- Applying `Sample_References/`, especially the approved mobile screenshots in `Sample_References/Screenshots from Stitch/`.
- Deciding layout, hierarchy, control placement, empty/error states, or responsive behavior.

## When Not To Use

- Deciding QR, points, reward, BUSY, or permission rules without backend/domain contracts.
- Adding UI dependencies without a documented phase need.

## Required Context

Read:

1. `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`
2. Relevant requirement IDs from `.planning/v1-agentic-build/REQUIREMENTS_LEDGER.md`
3. Active phase plan
4. Relevant files in `Sample_References/`
5. `APPROVED_STITCH_UI_CONTRACT.md` for mobile visual direction
6. `Sample_References/Stitch_Admin_design.md` for color/admin direction only when admin visual styling is affected

## Workflow

1. Identify persona, surface, and primary job.
2. Write the screen contract before implementation.
3. Decide the information hierarchy: what is primary, secondary, contextual, and hidden until needed.
4. Place controls near the data or decision they affect.
5. Design states: loading, empty, success, validation error, permission denied, network retry, and destructive confirmation.
6. Define theme tokens for colors, spacing, radius, typography, and status colors before broad styling.
7. Check Hindi/English layout behavior where end-user mobile screens are affected.
8. Check mobile and desktop layout expectations where applicable.
9. Use current framework docs through Context7 when implementation depends on framework or library behavior.
10. Verify with screenshots and visible-control UAT.
11. Record any design debt as residual risk, not as hidden acceptance.

## Required Checks

- Screen does not look like a generic dashboard template.
- Primary action is visually obvious but not oversized for the context.
- Secondary and destructive actions are placed deliberately.
- Text fits in compact containers and survives Hindi/English expansion.
- Form controls, toggles, filters, tabs, and status indicators use familiar UI patterns.
- Empty/error/denied states are specific to the workflow.
- Admin surfaces are operational and scan-friendly.
- Mobile surfaces support one-handed, field/shop usage.
- End-user mobile follows `APPROVED_STITCH_UI_CONTRACT.md`; PayTM/PhonePe-style familiarity is secondary background context only.
- UI review does not copy Stitch editor chrome such as the black dotted canvas or purple outer frame.
- Hindi/English toggle is visible from the first end-user mobile shell.
- Contractor Scan History and Team Member Scan History visibly respect their different scopes.
- Team Member Recent contractor is one clearable entry populated only after successful OTP login.
- Mobile implementation choices are compatible with public App Store and Play Store launch constraints.
- Screenshots exist for materially changed layouts.
