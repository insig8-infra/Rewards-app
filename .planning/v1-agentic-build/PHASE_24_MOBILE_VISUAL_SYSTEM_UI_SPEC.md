# Phase 24 Mobile Visual System UI Spec

Status: Active contract  
Created: 2026-07-09  
Scope: End-user mobile app and Admin Mobile visual-system recovery.

## Intent

Both mobile apps must feel like production mobile applications, not wide web panels squeezed into a phone frame. The visual direction follows `APPROVED_STITCH_UI_CONTRACT.md`: payment-app familiarity, compact hierarchy, strong scan/reward actions, trustworthy status surfaces, and clean one-handed mobile workflows.

## Applied References

- `APPROVED_STITCH_UI_CONTRACT.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- Stitch screenshots:
  - `SCR-20260706-lxtq.png` compact Contractor dashboard
  - `SCR-20260706-lxxg.png` full Contractor dashboard
  - `SCR-20260706-lxzg.png` scan result
  - `SCR-20260706-lydn.png` Balance Book / Rewards / Claims shell
  - `SCR-20260706-lymu.png` helper scan states

## Non-Goals For First Wave

- Do not add new business behavior.
- Do not redesign Admin Web.
- Do not claim native store readiness without actual iOS/Android device validation.
- Do not add a new UI framework or icon package in this wave.

## First-Wave Screen Contract

### End-User Mobile

Primary jobs:

- Contractor opens to a confident dashboard: identity, points, scan action, site context, rewards, and history are visually prioritized.
- Team Member sees a limited scan-first mobile experience with selected contractor/site and no rewards/balance leakage.

Required improvements:

- App shell must render in bounded responsive phone width on Expo Web.
- Header must feel like a real mobile app header, with brand, language toggle, and compact spacing.
- Dashboard hierarchy must follow wallet/scan/reward rhythm:
  - greeting and tier chip
  - promotion/info panel
  - points wallet card
  - dominant Scan QR action
  - shortcuts
  - rewards/history list sections
- Cards must have consistent radius, shadows, spacing, and readable text at `360px` width.
- Text-badge pseudo-icons must be replaced by drawn/icon-like glyphs or real images.

Manual UAT amendment from 2026-07-10:

- The next End-user Mobile visual slice must not be limited to spacing tweaks. It must include a screen-by-screen redesign review for Dashboard, Scan QR entry, scan batch/cart review, Scan History, Scan Details, Rewards, Promotion Banner, and Profile.
- Promotion banner copy must sit outside or above the image unless an approved image-safe banner treatment is documented.
- Reward tiles must preserve essential meaning at supported phone widths; line clamping may only hide secondary copy after reward name, required points, status, progress/gap, and Claim ID remain readable.
- Profile must include a designed set/edit/remove profile-photo flow, not only a display avatar.
- Scan History rows must show actor meaning, not placeholder avatars, and Scan Details must use a uniform field schema across success and failure types.

### Admin Mobile

Primary jobs:

- OWNER/STAFF open into a compact operations console optimized for repeated field use.
- Return scan and reward fulfillment remain operational, not decorative.

Required improvements:

- App shell must render in bounded responsive phone width on Expo Web.
- Login and dashboard should use the same production token language as the end-user app.
- Dashboard must surface role, operator identity, key counts, and primary operations with compact action cards.
- OWNER/STAFF role differences must remain obvious and enforced.

Manual UAT amendment from 2026-07-10:

- Admin Mobile must use an icon-style PIN reveal/hide affordance instead of `Show` text.
- Dashboard must be redesigned as an operational command surface. Static text counts are not enough; metrics such as Contractors and Staff must drill into relevant workflows.
- OWNER controls must be integrated as action sections/cards with meaningful placement and clear navigation.
- Contractors, Staff, Reports, and Rewards tabs must carry Admin Web workflow parity where role permissions allow it.
- Rewards must be split into mobile-appropriate sections or sub-tabs such as Claim Desk, Reward History, Catalog, and Fulfillment. A single long stacked rewards screen is not acceptable as product-grade completion.

## Design Research Gate

Before the next mobile visual implementation wave, record a short design-reference appendix in the phase status or a linked design note:

- Approved Stitch screenshots used as primary reference.
- 3-5 production-grade rewards, loyalty, payment, or high-engagement app patterns/templates reviewed.
- Specific elements adopted, such as wallet hierarchy, scan CTA placement, reward card anatomy, dashboard quick actions, bottom navigation, and claim/history layouts.
- Specific elements rejected and why.
- Resulting screen contracts for the affected mobile screens.

## Browser UAT Matrix

Every mobile visual slice must be inspected at:

- `360x740`
- `390x844`
- `430x932`
- `480x900`

Pass criteria:

- No text spills outside controls.
- No clipped bottom-tab labels.
- Primary action is visible without excessive scrolling.
- Cards and lists remain scan-friendly.
- Hindi/English toggle remains usable in end-user mobile.

## Verification

Required automated checks:

- `npm run test --workspace @volt-rewards/mobile`
- `npm run test --workspace @volt-rewards/admin-mobile`

Required visual checks before completion:

- Expo Web screenshot or visible Browser proof for both apps at the viewport matrix.
- End-user unauthenticated login must be included in the viewport matrix, with special attention to role cards, phone input, PIN boxes, and Hindi/English text wrapping.
- Native iOS/Android validation before any public beta/store-readiness claim.

## First-Wave Verdict Gate

This phase remains `PARTIAL` until both apps pass automated checks and visible phone-width UAT evidence is recorded.

After Manual Mobile UAT on 2026-07-10, this phase also remains `PARTIAL` until the findings in `MOBILE_APP_MANUAL_UAT_TRIAGE.md` are either implemented or deliberately split into later phases with open questions resolved.
