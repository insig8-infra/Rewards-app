# Phase 20 UI Recovery Contract

Status: Active contract for recovery implementation phases  
Created: 2026-07-06  
Source: Manual UAT 1

## Purpose

This contract defines the cross-surface quality bar for the recovery work triggered by Manual UAT 1.

The immediate problem is not that individual buttons or cards need styling. The problem is that dashboards, directories, histories, and workflows were allowed to exist as static or shell-like surfaces. Future implementation must start from user jobs, screen maps, and verifiable behavior.

## Applies To

- Admin Web Portal: OWNER and STAFF.
- Admin Mobile App: OWNER and STAFF.
- End-User Mobile App: Contractor and Team Member.

## Recovery Principles

1. Dashboards are command surfaces, not summary decorations.
2. Metrics and counts must drill into relevant filtered lists or workflow screens.
3. Operational lists require search, filters, sorting, and clickable detail rows unless explicitly deferred.
4. Histories and ledgers must show human-readable business facts, not raw database IDs.
5. Create/edit flows must be placed where users expect them, not buried at the bottom of long pages.
6. Mobile apps must feel app-native, with clear navigation, back behavior, and one-handed workflow ergonomics.
7. UI completion requires visible-control UAT for role-specific journeys, not only API proof or rendered screenshots.

## Cross-Surface Screen Map

### Admin Web

- Login.
- Dashboard.
- QR Print Queue.
- Invoice Ledger.
- Invoice Detail.
- Print History.
- Contractor Directory.
- Contractor Detail.
- Add Contractor.
- Staff Directory.
- Add Staff.
- Rewards/Fulfillment.
- Reports.
- Promotions.

Returned-product QR scan, cancel, and reverse remain excluded from Admin Web in v1.

### End-User Mobile

- Role Selection.
- Contractor Login.
- Team Member Entry and OTP.
- Contractor Dashboard.
- Team Member Limited Landing.
- Site Select.
- Site Create/Edit for Contractor only.
- Scan Home.
- Scan Result: success, already scanned, expired, invalid, session expired, network retry.
- Scan History.
- Rewards Catalog.
- Reward Detail.
- Claims/Reward History.
- Balance Book.
- Balance Entry Detail.
- Profile.
- Help/Support.

### Admin Mobile

- OWNER/STAFF Login.
- OWNER Dashboard.
- STAFF Dashboard.
- Return Scan Home.
- Return Scan Result: cancel eligible, reverse eligible, non-actionable, success.
- Contractor Leaderboard.
- Contractor Directory.
- Contractor Detail.
- Add Contractor for OWNER.
- Staff Management for OWNER.
- Reward Fulfillment for OWNER.
- Reports Hub for OWNER.
- Profile/More.

## Dashboard Contract

Every dashboard must answer five questions:

1. Who is using this screen?
2. What needs attention now?
3. What changed recently?
4. What are the important numbers?
5. Where can the user act next?

Required dashboard behavior:

- Every count card must have a target destination or documented no-click rationale.
- Dashboard shortcuts must be real workflow entry points.
- Recent activity must use human-readable labels: actor name/role, invoice number, product name, contractor name, date/time, and status.
- Dashboard data must be role-aware.
- Dashboard refresh/loading/error states must be designed.

Recommended dashboard metric definitions:

| Metric | Admin Web Target | Admin Mobile Target |
| --- | --- | --- |
| Contractors | Contractor Directory filtered to active/all as appropriate | Contractor Leaderboard or Directory |
| Staff | Staff Directory | OWNER Staff Management |
| Invoices ready to print | QR Print Queue | Not primary unless OWNER needs it |
| Total invoices | Invoice Ledger | Reports summary |
| QR printed | Print History filtered by period | Reports/QR summary |
| QR scanned | QR Status report or Scan History report | Reports/QR summary |
| QR cancelled/reversed | Returns/Reversals report | Return Scan dashboard/history |
| Pending rewards | Rewards/Fulfillment queue | OWNER Reward Fulfillment |

Admin Web should optimize for desk operations and batch management. Admin Mobile should optimize for counter/field actions. Metrics may share definitions but can have different drilldown destinations.

## Operational List Contract

Each directory, ledger, and history must define:

- Search fields.
- Quick filters.
- Sort options.
- Row/card primary label.
- Row/card secondary metadata.
- Detail destination.
- Empty state.
- Loading state.
- Error state.
- Permission-denied/read-only state.

Minimum list behavior:

| Surface | Search | Filters | Sorts |
| --- | --- | --- | --- |
| Contractor Directory | name, mobile, contractor code, city/site | active, deactivated, tier, has rewards, has scans | newest, name, points available, total points, scan count |
| Staff Directory | name, mobile | active, deactivated | newest, name, last opened |
| Invoice Ledger | invoice number, customer, product, GSTIN | sale, return, cancelled, ready to print, fully printed, has returns | import time, invoice date, invoice number, final total |
| Print History | invoice number, product, actor | date range, actor, product/category | printed time, invoice date, units printed |
| Scan History | product, invoice number, site, actor, QR code | success, failed, reversed, Team Member, date range | scan time, product, points |
| Balance Book | reward, product, invoice number, event type | credit, debit, reversal, reward claim, date range | event time, points value, balance after |

These are recommended defaults. Implementation phases must bring them forward for confirmation or explicitly defer individual filters.

## Data Identity Contract

Do not show raw database IDs as the primary user-facing value.

Replace internal identifiers with:

- Contractor: name, mobile number, contractor code, tier, photo/avatar.
- Staff: name, mobile number, role/status.
- Invoice: invoice number, date/time, customer, product summary, import time.
- QR: short QR/reference code, invoice number, product name, QR status.
- Site: client/site name, flat/building/area/city.
- Scan: product, site, actor type, actor name/mobile, date/time, status, points.
- Reward: reward image, reward name, Claim ID, points, status, date/time.
- Ledger: event title, amount, balance after, source invoice/reward/QR, actor where relevant.

Raw IDs may appear only in developer diagnostics, copied support detail, or hidden metadata.

## Navigation And Back Behavior

- Top-level destinations use tabs/nav appropriate to the surface.
- Workflow/detail screens must have visible back behavior.
- Forms must have clear Save/Cancel behavior.
- High-risk actions require confirmation and post-action readback.
- Mobile flows must plan Android hardware back behavior before app-store readiness is claimed.
- After mutation success, the destination must be explicit: list refresh, detail view, dashboard, or result screen.

## State Contract

Each implemented screen must include:

- Loading state.
- Empty state.
- Validation error state.
- Permission denied/read-only state.
- Network/API error state.
- Success/result state for mutations.

## Role Contract

- OWNER can manage staff, contractors where allowed, rewards, reports/exports, and dashboard actions.
- STAFF is read-only for contractor/staff master data and cannot perform OWNER-only management actions.
- STAFF can perform allowed return scan cancel/reverse in Admin Mobile where already approved.
- Contractor sees full contractor app.
- Team Member sees only limited scan/site/history access for the selected contractor/session.

Role restrictions must be enforced in backend authorization and rendered honestly in UI.

## UAT Issue Mapping

| UAT ID | Recovery Phase | Contract Handling |
| --- | --- | --- |
| UAT1-001 | Phase 22 | Admin Web dashboard drilldowns and operational metrics |
| UAT1-002 | Phase 21 | BUSY linked return-voucher domain correction |
| UAT1-003 | Phase 22 | Invoice Ledger vs QR Print Queue split |
| UAT1-004 | Phase 22 | Print History as separate route |
| UAT1-005 | Phase 22 | Contractor directory/detail/create redesign and immutable identity |
| UAT1-006 | Phase 22 | Staff directory redesign |
| UAT1-007 | Phase 22 | Real Admin Web login |
| UAT1-008 | Phase 24 | Admin Mobile app-native dashboard and workflows |
| UAT1-009 | Phase 24 | OWNER staff management in Admin Mobile |
| UAT1-010 | Phase 24 | Contractor leaderboard/directory |
| UAT1-011 | Phase 23 | End-user native-app experience recovery |
| UAT1-012 | Phase 23/24 | PIN reveal/hide in end-user and admin mobile |
| UAT1-013 | Phase 23 | Site select/create/manage discoverability |
| UAT1-014 | Phase 23 | Reward image/status/catalog correction |
| UAT1-015 | Phase 23/22 | Human-readable histories and list tooling |
| UAT1-016 | Phase 23/22 | Clickable dashboard values and Balance Book drilldowns |

## Completion Gate For Recovery UI Work

A recovery UI phase is not complete until:

- The phase-specific screen contract exists.
- Relevant open questions were brought forward.
- All implemented dashboard metrics either drill down or have documented no-click rationale.
- Lists include approved search/filter/sort behavior.
- Internal IDs do not appear as primary user-facing labels.
- Visible-control UAT covers OWNER/STAFF or Contractor/Team Member as applicable.
- Mutations are verified through API/database readback.
- Screenshots are captured for key states.
- Residual shells or temporary data are named explicitly.
