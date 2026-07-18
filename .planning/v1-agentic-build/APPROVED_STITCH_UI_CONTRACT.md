# Approved Stitch UI Contract - Volt Rewards V1

Status: Client-approved visual direction added on 2026-07-06.

Source folder: `Sample_References/Screenshots from Stitch/`

This contract is mandatory for end-user mobile app work and strongly informs Admin Mobile. Admin Web remains an operations portal, but should reuse the same brand tokens where practical.

## Reference Inventory

- `SCR-20260706-lxjj.png`: Role selection.
- `SCR-20260706-lxnt.png`: Contractor login.
- `SCR-20260706-lxtq.png`: Compact Contractor dashboard.
- `SCR-20260706-lxxg.png`: Full Contractor dashboard.
- `SCR-20260706-lxzg.png`: Scan success/result.
- `SCR-20260706-lydn.png`: Balance Book, Rewards, Claims tab shell.
- `SCR-20260706-lyfx.png`: Team Member contractor mobile entry and recent contractor.
- `SCR-20260706-lymu.png`: Helper scan home, camera, success, already scanned, expired, invalid, session expired, and network retry states.

Do not copy the Stitch editor background, black dotted canvas, or purple selection frame. Those are not app UI.

The screenshots are a reference for visual language, hierarchy, interaction patterns, and client taste; they are not a pixel-copy target. Volt Rewards should morph its own product screens toward similar quality: comparable component polish, icon-led controls, color confidence, spacing rhythm, micro-interactions, and workflow clarity while keeping the app's own information architecture and brand tokens.

## Visual Direction

The product should feel like a modern Indian rewards/payments app: clear, trustworthy, bright, and operationally fast. It should not look like a generic SaaS dashboard, generic React Native demo, or decorative landing page.

Approved visual language:

- Light app background, usually very pale blue/gray.
- White cards with thin borders and subtle shadows.
- Deep teal brand color for headers, primary buttons, active tabs, QR actions, and important values.
- Orange/brown reward action color for reward claim buttons and tier chips.
- Semantic green, red, and orange for scan states and ledger deltas.
- Compact but confident typography: heavy screen titles, readable body copy, and small uppercase metadata labels.
- Real product/user images where the data requires it.
- Icon-led controls and status panels.

## Brand Tokens

Use theme tokens, not one-off colors. Current mobile tokens are close to the approved direction and should be normalized around this palette:

- `primary`: deep teal, current `#00535B`.
- `primaryDark`: darker teal, current `#003D43`.
- `primarySoft`: pale teal/blue background, current `#DDF6F8` or lighter.
- `background`: pale app canvas, current `#F4F7F7`.
- `surface`: white, `#FFFFFF`.
- `surfaceMuted`: pale blue/gray info panel, current `#E8F3F4`.
- `line`: light border, current `#D9E4E5`.
- `text`: near-black, current `#1B1C1C` or `#172326`.
- `muted`: gray/teal secondary text, current `#526567`.
- `rewardAction`: brown/orange for Claim buttons, approximately `#A65F00`.
- `accent`: orange for tier/chips/promotions, current `#F49A32`.
- `success`: green for scan success and positive ledger entries.
- `danger`: red for invalid/expired/reversal/error states.
- `warning`: orange for already-scanned/caution states.

## Layout Rules

- Mobile screens use a real app shell: top app bar, content body, and bottom tab bar where applicable.
- App bars are compact, with brand or screen title left/center and Hindi/English toggle on the right.
- End-user mobile Hindi/English toggle must be visible from day one and remain available across key screens.
- Contractor dashboard lands after Contractor login.
- Team Member lands on the approved limited scan flow after OTP/session establishment.
- Primary workflows should avoid long generic scroll panels when a result/detail/confirm screen is more appropriate.
- Bottom tabs are used for top-level destinations only: Home, Scan, History, Rewards.
- Result/error screens use centered status icon blocks, concise explanation, then clear primary and secondary actions.

## Component Rules

### Cards

- White surface, 1px light border, subtle shadow.
- Radius should stay modest, generally 8-12px.
- No nested decorative cards unless it is a real repeated item inside a list.
- Cards should carry concrete data or action, not marketing filler.

### Buttons

- Primary button: full-width, deep teal, high contrast, strong label, optional icon.
- Secondary button: white/outlined teal, full-width when paired with a primary action.
- Destructive/reversal states: red text or red icon treatment, with confirmation.
- Warning/duplicate scan action: orange can be used where the action is cautionary but not destructive.
- Do not show controls that are not wired to a real workflow.

### Inputs

- Login inputs use clear labels and icon-prefixed fields where helpful.
- MPIN should use four separate boxes or a visually equivalent secure PIN input.
- Mobile number entry can use a fixed `+91` prefix segment.
- Validation messages appear near the relevant action and use semantic tone.

### Chips And Badges

- Tier chip examples: `Gold Member`, `Silver`, `Platinum`, `Diamond`.
- Status chips examples: `ACTIVE`, `COLLECTED`, `REVERSED`, `CLAIMED`, `ADJUSTED`.
- Chips should be short, uppercase or title-case consistently, and color-coded.

### Lists And Activity Rows

- Activity rows use left icon/status tile, strong title, date/time metadata, and right-aligned points/status when useful.
- Positive ledger entries use teal/green.
- Negative/reversal entries use red/orange.
- Lists should have filters only when a real filter workflow exists.

## Required Screen Patterns

### Role Selection

- Top app bar with back and language toggle.
- Central brand/action icon.
- Screen question and short helper copy.
- Role cards for Contractor and Helper/Team Member with icon, description, and small capability chips.
- Support/security panel and footer links.

### Contractor Login

- App bar with back and language toggle.
- Central icon and welcome copy.
- Framed login card.
- Contractor ID/mobile input.
- Four-box MPIN input.
- Forgot ID/MPIN actions.
- Full-width primary login button.
- Secure access/trust panel.

### Contractor Dashboard

- Brand header, greeting with human name, profile image, and tier chip.
- Promotional banner.
- Points available card.
- Lifetime/tier-progress card.
- Dominant Scan QR Code action card.
- Shortcut cards such as Balance Book and Scan History.
- Featured Rewards horizontal tiles with images and Claim/locked state.
- Bottom tabs: Home, Scan, History, Rewards.

### Scan Result

- App bar with back and language toggle.
- Status icon block.
- Result title and transaction/reference copy.
- Product/QR card with image, product name, QR ID, and points delta.
- Current balance card.
- Tier progress card.
- Primary CTA such as Scan Another QR.
- Secondary CTA such as View Scan History or Done.

### Balance Book / Rewards / Claims

- Header with profile/brand and language toggle.
- Tabbed subnavigation.
- Large available-points card with tier/milestone progress.
- Small stat cards for lifetime, claimed, reversed, last updated.
- Recent activity list with filter only when functional.
- View all activity action.
- Bottom tab active state must match Rewards.

### Team Member Mobile Entry

- Brand header and language toggle.
- Large title and explicit instruction.
- Mobile input with `+91` prefix.
- Full-width Send OTP CTA.
- Recent contractor card appears only after successful login, at most one, with Use and Remove controls.
- Footer links for Support and Contact Retailer.

### Helper Scan Flow

- Scan home shows selected contractor card, active badge, promotion/info card, large Scan Product QR action, Change Contractor, Logout, and session reset note.
- Camera screen uses a dark camera surface, visible QR frame, instruction overlay, selected contractor footer, and manual code fallback where approved.
- Success and failure states are separate result screens, not toast-only outcomes.
- Required result states: success, already scanned, expired, invalid QR, helper session expired, and network retry.
- Failure states include troubleshooting/help copy and clear recovery CTAs.

## Admin Mobile Adaptation

Admin Mobile should reuse the same tokens and component quality, but with a more operational hierarchy:

- Dashboard metrics may be denser than Contractor dashboard.
- Return Scan should follow the scan-result state language above.
- OWNER/STAFF role differences must be visible but not decorative.
- Staff read-only/denied states should follow the same card/status panel grammar.

## Implementation Requirements

- Every frontend phase must name which approved Stitch screens apply.
- Before broad feature work continues, existing mobile screens should be visually aligned to this contract.
- New UI must use shared tokens or app-level theme tokens, not inline ad-hoc styling.
- Screens must be validated with screenshots and visible-control UAT against this contract.
- Any deliberate deviation from this contract must be recorded in the phase plan/status with rationale.

## Current Gap

Phase 16 and Phase 17 established functional app baselines. They are not yet fully visually aligned to these newly approved Stitch screenshots. Manual UAT 1 confirmed that mobile recovery must happen through the Phase 23 and Phase 24 product-grade recovery contracts before the mobile apps can be treated as client-ready.
