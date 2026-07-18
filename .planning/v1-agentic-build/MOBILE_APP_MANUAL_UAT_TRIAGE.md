# Mobile App Manual UAT Triage

Source: `.planning/v1-agentic-build/Mobile_App_ManualUAT`  
Recorded: 2026-07-10  
Scope: Admin Mobile app and End-user Mobile app  
Status: Active remediation contract

## Verdict

Manual Mobile UAT blocks calling Phase 23 or Phase 24 complete. The issue is not one isolated screen defect; it is a signal that mobile work needs a stronger pre-build contract, stronger visual reference gate, and stricter output/trajectory eval before feature breadth continues.

The next mobile implementation slice must be treated as a recovery/remediation phase, not as incremental polish. It must start from user jobs, screen maps, navigation, and mobile visual contracts before code changes.

## Cross-App Findings

| ID | Surface | Severity | Finding | Required action |
| --- | --- | --- | --- | --- |
| MUAT-MOB-001 | Both mobile apps | High | Look, feel, typography, spacing, control placement, and interaction hierarchy still feel basic/clunky. | Add a design-reference gate before the next mobile UI build. Research production-grade rewards/loyalty/payment-style mobile patterns, map what is adopted/rejected, and verify against `APPROVED_STITCH_UI_CONTRACT.md`. |
| MUAT-MOB-002 | Both mobile apps | High | Mobile screens need more icon-led, app-native controls and less text-heavy presentation. | Extend screen contracts to require icon/control rationale, tap target review, and no text-only pseudo-icons where a familiar icon affordance is expected. |
| MUAT-MOB-003 | Both mobile apps | High | Current automated checks did not prevent visible UX defects. | Output eval must include screenshot/visible-control evidence for login, dashboard, tabs, details, uploads, PIN reveal, and high-risk flows at the approved mobile viewport matrix. |

## Admin Mobile Findings

| ID | Severity | Finding | Required action |
| --- | --- | --- | --- |
| MUAT-AM-001 | Medium | Login uses `Show` text instead of an eye-style reveal/hide icon for PIN. | Replace text-only reveal with an icon-style control and accessibility label. Apply the same masked-entry pattern across PIN/MPIN surfaces. |
| MUAT-AM-002 | High | Dashboard is not yet a real operational command surface. Return Operations, QR Status, Owner Controls, and metric text blocks are not prioritized or functional enough. | Redesign Admin Mobile dashboard around daily operations, attention items, and drilldowns. Every count/metric such as Contractors and Staff should open the relevant filtered workflow. |
| MUAT-AM-003 | High | Owner controls feel like pasted text rather than integrated app workflows. | Convert OWNER controls into role-gated action cards/sections with clear entry paths and back behavior. |
| MUAT-AM-004 | High | Contractors, Staff, and Reports tabs do not yet provide Admin Web parity where mobile role permissions allow it. | Each tab needs a screen map matching Admin Web workflow coverage, with explicit differences for camera-only flows and STAFF restrictions. |
| MUAT-AM-005 | High | Rewards tab is overloaded with multiple workflows stacked together. | Split Rewards into mobile-appropriate sections or sub-tabs such as Claim Desk, Reward History, Catalog, and Fulfillment. |
| MUAT-AM-006 | Medium | Navigation between tabs/screens must be reliable and predictable. | Add navigation UAT covering tab jumps, detail drilldowns, back behavior, and post-success destinations. |

## End-User Mobile Findings

| ID | Severity | Finding | Required action |
| --- | --- | --- | --- |
| MUAT-EU-001 | Critical | Scan QR should not rely on a default selected site. User wants a site-first scan batch: Select Site -> scan multiple QRs -> review scanned items/total points -> Add to account -> success/error with retry path. | This changes the earning model. Core reservation/commit semantics are now locked in `DEC-050`; implementation must follow that contract. |
| MUAT-EU-002 | High | Rewards tiles truncate essential copy; only fragments are readable. | Reward tiles must be redesigned with stable image/text/progress zones and no hidden essential information at supported viewport widths. |
| MUAT-EU-003 | Medium | Promotion banner title/description overlays the image and reduces readability. | Render promotion header/description outside or above the image region unless a specific image-safe text treatment is approved. |
| MUAT-EU-004 | High | Contractor profile must allow set/edit/remove profile picture from profile. | Add profile-photo workflow with OS/browser picker, validation, persistence, readback, remove action, and permission/error states. |
| MUAT-EU-005 | High | History should be named `Scan History`, avoid truncating important attempt/details, and show actor type instead of a profile placeholder. | Rename, redesign row/detail presentation, show Contractor vs Team Member scanner, and keep full IDs/details available without making raw IDs the primary label. |
| MUAT-EU-006 | Critical | Scan Details appear inconsistent across attempt types; an already-claimed attempt shows `+100` points. | Standardize scan detail schema across success/failure/duplicate/expired/invalid states. Failed/already-claimed attempts must not show credited points unless explicitly separated as QR value versus credited points. |
| MUAT-EU-007 | Critical | Rewards available points and lifetime points mismatch. | Points math becomes a hard blocking gate. Add ledger reconciliation tests/readback before further reward work is called complete. |

## MANUALUAT2A Findings - 2026-07-10

Source: `.planning/v1-agentic-build/Mobile_App_ManualUAT` lines 35-59.  
Implementation contract: `PHASE_25E_END_USER_MOBILE_UAT2A_CONTRACT.md`.

| ID | Persona | Severity | Finding | Required action |
| --- | --- | --- | --- | --- |
| MUAT2A-EU-001 | Contractor | High | Site list `Use Site` action feels redundant; tapping a site should select it and only `View Details` should open details. | Update site-selection flow and visible proof. |
| MUAT2A-EU-002 | Contractor | High | Selecting a site should return to Dashboard with selected-site context updated and better positioned. | Rework selected-site dashboard section and Scan QR selected-site label. |
| MUAT2A-EU-003 | Contractor | Medium | Reserved cart summary/header blends into cart items and lacks a top shortcut to `Add to account`. | Make reserved cart summary visually distinct and add a top commit shortcut. |
| MUAT2A-EU-004 | Contractor | High | `Add to account` has no success pop-up/screen. | Add success feedback with points added and post-success destination. |
| MUAT2A-EU-005 | Contractor | Critical | A 4000-point QR failed because of the earlier 1000-point cart cap even with an empty cart. | Supersede cart cap. Remove scan rejection by cart value. Add reserved-cart navigation guard instead. |
| MUAT2A-EU-006 | Contractor | High | Mobile icon/font/spacing/animation system still feels too basic. | Phase 25E must include a design-quality pass and visible viewport proof on corrected screens. |
| MUAT2A-EU-007 | Contractor | High | Some app copy still shows QR/reward points as rupees. | Supersede DEC-024 rupee display copy; migrate user-facing app copy to points. |
| MUAT2A-EU-008 | Contractor | Medium | Scan History details for `Reserved in Cart` should help the user add those points. | Add `Add to account` shortcut from reserved Scan History detail. |
| MUAT2A-TM-001 | Team Member | High | If contractor has no sites, Team Member site/scan action fails without useful guidance. | Show user-facing pop-up naming the contractor and asking them to create a site first. |
| MUAT2A-TM-002 | Team Member | Medium | Logout is misplaced. | Move logout to an account/profile affordance or other product-appropriate location. |
| MUAT2A-TM-003 | Team Member | Medium | Internal implementation copy is visible. | Replace camera/contact/session wording with product-facing language. |
| MUAT2A-TM-004 | Team Member | Medium | Landing page has redundant Select Site and Scan History buttons. | Simplify landing and rely on primary scan flow plus app navigation. |
| MUAT2A-TM-005 | Team Member | High | Scan QR section uses small site tiles that will not scale for 10-15 sites. | Replace with scalable list/sheet/search selection. |
| MUAT2A-TM-006 | Team Member | High | Contractor photo/name/phone are shown under a misleading `Team Member` title. | Frame the screen as Team Member access under the contractor, with clear contractor context. |

## Clarifications Resolved On 2026-07-10

User decisions:

1. Successfully scanned QR units are reserved immediately server-side for the contractor/site/cart.
2. The cart is persistent across app visits and should not be emptied automatically by a short TTL.
3. Points are credited only when the contractor presses `Add to account`.
4. Failed scans never enter the cart. They are recorded as failed scan attempts only.
5. If `Add to account` fails because of a technical issue such as network/API failure, the successful reserved scans remain in the cart and the contractor retries `Add to account`.
6. Superseded by MANUALUAT2A: the reserved cart has no point-value cap for v1. Valid high-value QR tokens must reserve when normal rules pass. If reserved cart items exist and the user tries to leave the selected site's Scan flow, show a prompt to `Add to account` or stay/go back to Scan.
7. Failed/already-claimed attempts show `0 credited points`; QR value may be displayed separately as informational value.
8. Scan History list rows use human-readable QR/invoice/product references; detail screens expose full IDs with copy support.
9. Staff management remains OWNER-only in Admin Mobile; STAFF users do not get a Staff tab/read-only staff directory.

Remaining implementation-time question:

- If a reserved QR in a contractor cart is later invalidated by return handling or security review before `Add to account`, the recommended safe default is: keep the cart row visible with item-level error, do not credit points, and require remove/refresh. This should be surfaced before implementing the reservation state machine.
- The user/admin-facing label for `RESERVED_IN_CART` should be finalized before UI implementation. Recommended defaults are contractor cart `Ready to add`, Scan History `Reserved`, and admin/QR status `Pending_Add_To_Account`.

## Harness Improvements Required

- Every mobile slice must produce both `OUTPUT_EVAL` and `TRAJECTORY_EVAL` updates.
- Output eval must include visible-control evidence, not only tests.
- Trajectory eval must explicitly ask: did we build the user's stated workflow, or merely a nearby UI?
- Any repeated defect pattern from manual UAT must update the relevant standard before more code is written.
- Mobile feature breadth pauses until the next phase records a screen-by-screen contract for Admin Mobile dashboard/rewards/tabs and End-user scan/history/rewards/profile.

## Future Phase Pointers

- Add a dedicated mobile remediation/design phase before broad new mobile feature work.
- Treat the batch scan/cart model as a backend contract phase, because it changes QR status timing, duplicate prevention, failed-attempt logging, reward points posting, and user recovery.
- Treat points math as a platform-critical invariant. It needs unit tests, API/database readback, and seeded edge cases covering scan credit, reward claim, cancellation, return reversal, stale claim, and negative balance.
- Treat MANUALUAT2A as Phase 25E before moving to Admin Mobile parity or later native-device proof. The old 1000-point cart-cap output evidence is no longer valid for completion.
- Treat points-vs-rupees as a cross-platform terminology/data consistency issue, not a cosmetic string issue.
