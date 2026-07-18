# Phase 18 UI Spec - Stitch Approved Visual System Alignment

Status: Drafted from client-approved screenshots on 2026-07-06.

## Goal

Align the mobile UI foundation to the client-approved Stitch screenshots before expanding QR return operations, reward workflows, staff management, or reports.

This is a visual-system and product-flow alignment phase, not a backend feature phase.

## Source References

Primary:

- `APPROVED_STITCH_UI_CONTRACT.md`
- `Sample_References/Screenshots from Stitch/SCR-20260706-lxjj.png`
- `Sample_References/Screenshots from Stitch/SCR-20260706-lxnt.png`
- `Sample_References/Screenshots from Stitch/SCR-20260706-lxtq.png`
- `Sample_References/Screenshots from Stitch/SCR-20260706-lxxg.png`
- `Sample_References/Screenshots from Stitch/SCR-20260706-lxzg.png`
- `Sample_References/Screenshots from Stitch/SCR-20260706-lydn.png`
- `Sample_References/Screenshots from Stitch/SCR-20260706-lyfx.png`
- `Sample_References/Screenshots from Stitch/SCR-20260706-lymu.png`

Supporting:

- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `REQUIREMENTS_LEDGER.md` `PLAT-013`, `PLAT-014`, `PLAT-015`

## Personas

- Contractor.
- Team Member.
- OWNER and STAFF only for token/component grammar alignment; deep Admin Mobile workflows remain later phases.

## Screens To Align

End-user mobile:

- Role selection.
- Contractor login.
- Contractor dashboard/home.
- Contractor scan action and scan result.
- Contractor Balance Book/Rewards/Claims shell.
- Team Member mobile entry and recent contractor card.
- Team Member/helper scan home.
- Helper scan result states: success, already scanned, expired, invalid QR, session expired, and network retry.
- Bottom tab shell.

Admin Mobile:

- Theme tokens and card/button/status grammar.
- Dashboard surface should remain operational, but should stop feeling visually separate from Volt Rewards.
- Return Scan placeholder should be ready to become a Stitch-style result-state flow in the next QR phase.

## Design Contract

### App Shell

- Light background.
- Compact top app bar.
- Visible Hindi/English toggle on end-user mobile key screens.
- Brand text or screen title in deep teal.
- Bottom tabs with icon plus label; active tab uses teal and light teal active background where applicable.

### Typography

- Screen title: heavy, 24-30px depending on screen density.
- Section title: heavy, 18-22px.
- Body: 14-16px, readable line height.
- Metadata: 11-13px, uppercase where used for labels/status.
- Do not use oversized hero typography inside app workflow screens.

### Components

- White cards with light borders and subtle shadows.
- Primary button: full-width teal with strong label and optional icon.
- Secondary button: outlined teal.
- Reward claim button: brown/orange.
- Status icon block: soft tinted square with semantic icon.
- Metric card: label, value, optional progress bar.
- Activity row: icon tile, title, metadata, right-side amount/status.
- Profile/user card: image/avatar, human name, mobile, status/tier.

### State Patterns

- Success: green icon, concise confirmation, product/QR details, balance impact, primary next action.
- Already scanned: warning icon, prior scan details, scan another/done actions.
- Expired: red/expired icon, reason copy, scan another/contact retailer actions.
- Invalid QR: red icon, troubleshooting panel, scan another/contact retailer actions.
- Session expired: clear security copy, select contractor action, logout option.
- Network retry: offline status, try again, scan later.

## Out Of Scope

- Backend business logic changes unless UI readback exposes contract gaps.
- Native camera validation.
- QR cancel/reverse implementation.
- Final client-provided reward/product photography replacement.
- Admin Web redesign.

## UAT Evidence Required

- Screenshot for each aligned end-user mobile screen listed above.
- Console/network check on Expo Web.
- API readback for screens that show live data.
- Native simulator/device check if camera-like screens are claimed beyond static visual state.
- Before/after notes in `PHASE_18_STATUS.md`.

## Completion Criteria

- Current end-user mobile app visually matches the approved Stitch direction closely enough for client review.
- Admin Mobile no longer diverges from the shared visual system in tokens/cards/buttons/status language.
- No fake controls are introduced.
- Hindi/English toggle remains present and layout-safe.
- Visual alignment is documented with screenshot evidence.
