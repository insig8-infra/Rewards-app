# Phase 25D Contract - Admin Mobile Visual And IA Remediation

Status: Active contract  
Created: 2026-07-10  
Scope: Admin Mobile app only.

## Source Inputs

- `MOBILE_APP_MANUAL_UAT_TRIAGE.md`
- `PHASE_25_MOBILE_UAT_REMEDIATION_PLAN.md`
- `PHASE_24_MOBILE_VISUAL_SYSTEM_UI_SPEC.md`
- `APPROVED_STITCH_UI_CONTRACT.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`

## Intent

Admin Mobile must feel like a field operations app, not a compressed web dashboard. This phase starts with the bounded visible IA defects from Manual Mobile UAT:

- Replace text-only PIN reveal controls with icon-style controls.
- Convert Dashboard into an operational command surface with drilldown actions.
- Present OWNER controls as real action cards with navigation, not passive chips.
- Split Rewards into mobile sections so Claim Desk, History, and Catalog are not one long stacked page.

## Wave 1 Scope

### Login PIN

Required:

- PIN reveal/hide is a compact icon-style affordance.
- Accessibility label states the action.
- Control stays inside the PIN field at supported phone widths.

### Dashboard

Required:

- Dashboard opens as a daily operations command surface.
- Primary operation is Return Scan.
- Key metrics are tappable where a matching mobile workflow exists:
  - Contractors -> Contractors tab.
  - Staff -> Reports/Owner controls summary for now, because STAFF management remains OWNER-only and needs a later dedicated mobile screen.
  - Claims -> Rewards tab.
  - Reversed/QR status -> Return Scan or Reports as appropriate.
- OWNER controls render as action cards with clear destination labels.
- STAFF gets an explicit limited-access panel.

### Rewards

Required:

- Rewards screen starts with a section switcher:
  - Claim Desk
  - History
  - Catalog
- OWNER sees all three sections.
- STAFF sees History only.
- Claim Desk keeps OTP/Delivered workflow and active claim selection.
- History shows all reward developments available to the admin persona.
- Catalog keeps mobile catalog management but is not the default landing section.

## Non-Goals For Wave 1

- Do not add new Admin Web parity APIs in this wave.
- Do not claim native iOS/Android proof; Expo Web viewport proof remains development evidence only.
- Do not implement full STAFF management mobile CRUD here; STAFF management remains OWNER-only and needs a dedicated screen map.
- Do not change reward fulfillment semantics.

## Exit Gates

- `npm run test --workspace @volt-rewards/admin-mobile`
- `git diff --check`
- Viewport proof at `360x740`, `390x844`, `430x932`, and `480x900` for:
  - Login PIN icon.
  - Dashboard command cards.
  - Rewards section switcher.
- Output eval and trajectory eval updated.

