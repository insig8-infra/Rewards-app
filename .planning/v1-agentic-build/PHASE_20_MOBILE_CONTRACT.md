# Phase 20 Mobile Recovery Contract

Status: Active contract for Phase 23 and Phase 24 implementation  
Created: 2026-07-06

## Purpose

Manual UAT 1 showed that both mobile surfaces need to feel like real apps, not browser-adapted panels. This contract defines the required recovery direction for End-User Mobile and Admin Mobile.

## Shared Mobile Rules

- Follow `APPROVED_STITCH_UI_CONTRACT.md` for visual grammar.
- Use theme tokens, not ad-hoc colors.
- Use app-level navigation: auth stack, app stack, tabs, detail/result screens.
- Every workflow screen has visible back behavior.
- PIN inputs have reveal/hide controls.
- Success/failure outcomes use result screens or clear inline panels, not toast-only feedback.
- Native iOS/Android validation is required before public app-store readiness is claimed.
- Expo Web can remain a local UAT fallback, but must not be used as proof of native readiness.

## End-User Mobile Contract

### Contractor Auth

Required behavior:

- Role selection follows Stitch role selection pattern.
- Contractor login uses mobile + four-digit MPIN.
- MPIN field supports reveal/hide.
- Forgot MPIN explains retailer/admin reset.
- Hindi/English toggle remains visible.
- Successful login lands on Contractor Dashboard.

### Contractor Dashboard

Required sections:

- Human contractor name, photo/avatar, mobile, tier.
- Available points card, clickable to Balance Book.
- Lifetime/total points and tier progress.
- Selected site context with a clear Change/Create/Manage path.
- Prominent Scan QR action.
- Shortcuts: Balance Book, Scan History, Rewards, Sites/Profile.
- Featured rewards showing only relevant claimable/near-unlock rewards, not delivered/collected history items.
- Recent activity with human-readable labels.

Dashboard values must be actionable:

| Item | Destination |
| --- | --- |
| Points Available | Balance Book |
| Total Points/Tier | Rewards or tier detail |
| Selected Site | Site Select/Manage |
| Featured Reward | Reward Detail |
| Recent Scan | Scan Detail or Scan History |

### Site Flow

Required screens:

- Site Select before scan.
- Create Site for Contractor.
- Edit/Archive Site for Contractor.
- Site Detail.

Rules:

- Contractor can create/edit/archive own sites.
- Team Member can only select active sites.
- Scan cannot proceed without selected active site.
- Site context remains visible on scan screens.

### Scan Flow

Required screens:

- Scan Home.
- Native camera screen when native implementation phase begins.
- Manual token fallback for local/dev UAT only.
- Scan Success.
- Already Scanned.
- Expired.
- Invalid/Replaced.
- Session Expired.
- Network Retry.

Scan result must show:

- Product name.
- Invoice number/reference where allowed.
- QR short reference.
- Points credited for Contractor success.
- Current balance after Contractor success.
- Site.
- Actor: Contractor or Team Member.
- Next actions: Scan another, View history, Done.

### Scan History

Required behavior:

- Contractor sees full contractor scan history across all sites and Team Member scans.
- Team Member sees only permitted scans/attempts within their allowed scope.
- No raw database IDs as primary labels.

Required search/filter/sort:

- Search: product, invoice number, site, Team Member mobile, QR reference.
- Filters: success, failed, reversed, Contractor, Team Member, date range.
- Sort: latest scan first by default, product, points.

Rows show product, site, actor, date/time, status, points, invoice/QR reference.

### Rewards And Balance Book

Rewards:

- Reward tiles include image, reward name, required points, tier, status, progress, gap copy, and Claim ID when chosen.
- Featured rewards exclude delivered/collected rewards.
- Delivered/collected rewards live in Claims/Reward History.
- Reward detail includes larger image, description, eligibility, balance impact, and cancel cutoff.

Balance Book:

- Available points header.
- Chronological ledger rows.
- Search/filter/sort.
- Event details.
- Human-readable source labels.

Required Balance Book filters:

- Credits.
- Reward claims.
- Reward cancellations.
- QR reversals.
- Reward revocations.
- Date range.

## Team Member Contract

Required behavior:

- Team Member enters contractor mobile.
- Recent contractor appears only after successful OTP login and only one entry is stored.
- Recent contractor has Use and Clear controls.
- OTP is required every session.
- Landing is limited and scan-first.

Team Member landing shows:

- Contractor name.
- Contractor mobile.
- Contractor photo/avatar if available.
- Selected site context.
- Scan QR action.
- Allowed Scan History.
- Session reset note.

Team Member must not see:

- Rewards.
- Balance Book.
- Contractor analytics.
- Contractor site management.
- Full contractor profile management.

## Admin Mobile Contract

### Admin Login

Required behavior:

- OWNER/STAFF role selection.
- Mobile + PIN login.
- PIN reveal/hide.
- Backend bearer session.
- Logout.
- Session expiry handling.

### OWNER Dashboard

Required sections:

- Active contractors.
- QR status mix.
- Pending reward fulfillment.
- Return/reversal activity.
- Staff management shortcut.
- Contractor leaderboard preview.
- Reports shortcut.
- Recent activity.

Every summary card must be clickable or have documented no-click rationale.

### STAFF Dashboard

Required sections:

- Return scan shortcut.
- Read-only contractor lookup.
- Recent cancellations/reversals.
- Limited QR status summary.
- Clear no-access state for OWNER-only features.

### Return Scan

Phase 19 behavior remains the functional baseline.

Required recovery:

- App-native scan/result screen treatment.
- Camera-first native flow in later native validation phase.
- Token entry remains local/dev fallback only.
- Clear cancel-eligible, reverse-eligible, non-actionable, success, and error screens.

### Contractor Leaderboard And Directory

Contractors tab opens with:

- Leaderboard summary.
- Searchable/filterable Contractor Directory entry.
- Add Contractor for OWNER.
- STAFF read-only indicator.

Directory behavior:

- Search: name, mobile, contractor code, site/city.
- Filters: active, deactivated, tier, has rewards, has scans.
- Sort: points, scan count, name, newest.

Contractor detail:

- Human identity header.
- Photo, name, mobile, contractor code, tier, status.
- Name/mobile read-only after registration.
- OWNER can update photo and deactivate/reactivate.
- STAFF sees read-only detail.
- Sites/rewards/scans summaries are clickable where exposed.

### OWNER Staff Management

Required screens:

- Staff Directory.
- Add Staff.
- Staff Detail.
- Reset PIN confirmation/result.
- Deactivate/reactivate confirmation/result.

STAFF cannot access staff management.

### OWNER Reward Fulfillment

Required behavior:

- Claim ID lookup.
- Contractor/reward detail.
- OTP trigger.
- OTP entry.
- Mark Fulfilled.
- Success result.
- STAFF blocked server-side and UI-side.

## Native Readiness Notes

Before app-store readiness is claimed:

- Test on native iOS and Android or approved simulator/device path.
- Validate camera permissions.
- Validate secure storage behavior.
- Validate keyboard behavior on login, OTP, and forms.
- Validate Android hardware back.
- Validate Hindi/English text fit.
- Remove or gate local/dev token entry and mock OTP visibility from production builds.

## Phase 23/24 UAT Gate

End-User Mobile recovery must verify Contractor and Team Member paths separately.

Admin Mobile recovery must verify OWNER and STAFF paths separately.

For both:

- PIN reveal/hide works.
- Back behavior works.
- Lists have search/filter/sort.
- Dashboard drilldowns work.
- Histories show human-readable metadata.
- Screenshots cover key states.
- API/database readback verifies mutations.
