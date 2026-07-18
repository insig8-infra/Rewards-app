# Phase 25E Contract - End-User Mobile MANUALUAT2A Corrections

Status: Planned  
Created: 2026-07-10  
Owner: Codex

## Source

- `.planning/v1-agentic-build/Mobile_App_ManualUAT` lines 35-59, `MANUALUAT2A`.
- `DEC-024` and `DEC-050` in `architecture/DECISIONS.md`.
- `MOBILE_APP_MANUAL_UAT_TRIAGE.md`.
- `FRONTEND_EXPERIENCE_STANDARD.md`.
- `APPROVED_STITCH_UI_CONTRACT.md`.
- `Sample_References/electrical_retail_products_rewards_points.md`.

## Intent

Fix the end-user mobile scan/site/cart experience exposed by MANUALUAT2A before moving to the next broad mobile slice. This is not a cosmetic pass. It is a product-flow correction and harness correction for the Contractor and Team Member apps.

## Scope

Included:

- Contractor site list, selected-site state, dashboard return behavior, and Scan QR entry.
- Contractor reserved cart layout, `Add to account` shortcut, success feedback, no-cap high-value scan behavior, and reserved-cart navigation guard.
- Contractor Scan History details for reserved cart items.
- Team Member no-site handling, identity framing, microcopy, logout placement, and scan site selection UI.
- Points terminology cleanup for end-user mobile and any touched backend/API display fields.
- A design-quality pass using approved Stitch direction plus production-grade mobile app patterns.

Excluded:

- Admin Mobile parity work.
- Native app-store camera/media-library proof beyond documenting residuals.
- Reward catalog business logic changes not required by points terminology.

## Requirements

| ID | Requirement | Acceptance |
| --- | --- | --- |
| P25E-SITE-001 | In site lists, tapping a site selects it. `View Details` is the only path to the detail page. | Contractor can add a site, tap the site row/card, return to Dashboard, and see the selected site reflected without using a separate `Use Site` action. |
| P25E-SITE-002 | Selected-site dashboard section is repositioned and renamed so it clearly communicates select/change/manage site without oversized copy. | Dashboard shows selected site context near scan actions, with a clear manage/add/change entry. |
| P25E-SCAN-001 | `Scan QR` uses the selected site and labels that site clearly. | Scan entry reflects the same selected site visible on Dashboard. |
| P25E-CART-001 | Reserved cart header/summary is visually distinct from item rows. | Header uses different hierarchy/color and includes pending total and item count without blending into item cards. |
| P25E-CART-002 | Reserved cart summary includes a top-level `Add to account` shortcut. | User can commit without scrolling to the bottom of a long cart. |
| P25E-CART-003 | `Add to account` success shows a clear success pop-up/screen and reconciles points. | Success state shows points added, selected site context, and destination back to Dashboard/Scan History/Scan. |
| P25E-CART-004 | Reserved cart has no point cap for v1. | A valid 4000-point QR can reserve into an empty cart and commit successfully. |
| P25E-CART-005 | If reserved cart items exist, navigation away from the selected site's Scan flow prompts the user to `Add to account` or stay/go back to Scan. | Top-level tab change/back behavior is guarded. No scan is rejected due to cart value. |
| P25E-HIST-001 | Scan History details for `Reserved` items include an `Add to account` shortcut. | Detail screen opens cart/commit path for the same selected site/cart. |
| P25E-COPY-001 | Reward/QR values display as points, not rupees. | No end-user mobile scan, cart, history, reward, or balance copy says `Rs.` for reward points. |
| P25E-TM-001 | If a Team Member selects Scan/Site and the contractor has no active sites, show a user-facing pop-up naming the contractor and asking them to create a site first. | No silent failure, disabled dead control, or internal error text. |
| P25E-TM-002 | Team Member landing identifies the contractor context correctly. | Copy says the user is logged in for/under the contractor and shows contractor name, phone, and photo without a misleading `Team Member` title over contractor data. |
| P25E-TM-003 | Team Member landing removes redundant `Select Site` and `Scan History` buttons; navigation relies on app tabs/primary scan flow. | Landing is not cluttered with duplicate entry points. |
| P25E-TM-004 | Team Member scan flow removes small site tiles from the Scan QR section. | Sites are selected through a scalable list/sheet/search pattern that handles 10-15 sites. |
| P25E-TM-005 | Team Member logout and temporary-access copy are product-facing. | Logout is placed in profile/account area or a clear top-level account affordance; no internal implementation language is visible. |
| P25E-UX-001 | Icons, typography, spacing, animation/micro-interactions, and tap feedback meet the mobile visual standard. | Viewport proof at `360x740`, `390x844`, `430x932`, and `480x900` shows no text overflow and no basic placeholder treatment on the corrected screens. |

## Harness Gates

Before code:

- Update output eval and trajectory eval with MANUALUAT2A requirements.
- Remove or supersede all active planning references to the 1000-point cart cap.
- Confirm no open question is being silently decided inside implementation.

Automated verification:

- Domain/API tests prove high-value QR reserve and commit above 1000 points.
- API/mobile tests prove cart navigation guard state and success feedback where testable.
- Terminology test or static assertion checks touched end-user mobile surfaces do not use `Rs.` for reward points.
- `git diff --check`.

Visible/UAT proof:

- Contractor: add site -> tap site -> dashboard selected-site update -> Scan QR selected-site label -> reserve high-value QR -> Add to account success -> Scan History detail.
- Contractor: reserved cart exists -> attempt to leave Scan flow -> guard prompt appears.
- Team Member: contractor with no sites -> Select/Scan path shows contractor-name guidance.
- Team Member: contractor with many sites -> site selection remains readable and uncluttered.
- Viewport matrix: `360x740`, `390x844`, `430x932`, `480x900`.

## Completion Rule

Phase 25E can pass only when the old cart-cap behavior is removed from implementation and evidence, points terminology is consistent on end-user mobile, and MANUALUAT2A site/cart/team-member flows pass visible proof. If native iOS/Android proof is not executed in this slice, record it as a store-readiness residual, not as completed.
