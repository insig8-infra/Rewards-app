# Auth And Permissions Draft

Status: Draft.

## Personas

- Contractor: registered by admin/client, uses registered mobile number and MPIN.
- Team Member: scan-limited session actor helping one contractor after contractor OTP.
- OWNER: master store admin account created from backend.
- STAFF: staff account created by OWNER with app-generated PIN.

## Contractor Auth

Flow:

1. Admin creates contractor.
2. System sends welcome SMS with temporary one-time MPIN and app links.
3. Contractor logs in with registered mobile number and temporary MPIN.
4. App forces SET MPIN.
5. Contractor sets own 4-digit MPIN.
6. Future logins use mobile number + MPIN.
7. If contractor forgets MPIN, contractor contacts retailer/admin.
8. OWNER resets contractor temporary MPIN from Admin Web or Admin Mobile.
9. Reset temporary MPIN is valid for 5 days and should force contractor to set their own MPIN again after login.

Permissions:

- View and manage own profile.
- Change MPIN with old MPIN.
- Create/edit/archive own sites.
- Select own site and scan QR.
- View own Scan History.
- View Rewards, Balance Book, and catalog.
- Redeem eligible rewards.
- Cancel chosen reward before physical collection.

Denied:

- Self-register.
- Modify points directly.
- Fulfill rewards.
- Access admin surfaces.

## Team Member Auth

Flow:

1. Team Member chooses Team Member login.
2. Enters contractor mobile number manually, or optionally selects it from phone contacts if permission is granted.
3. System checks if contractor exists.
4. OTP goes to contractor.
5. Team Member receives OTP offline from contractor.
6. Team Member enters OTP.
7. Session is scoped to selected contractor, stores Team Member mobile/session context for scan history, and expires daily.
8. Recent contractor is stored locally as convenience-only after successful OTP login, shows at most one contractor, includes clear/remove control, and never replaces OTP.

Identity model:

- Team Member is a temporary session actor in v1, not a saved `users` profile.
- Scan attempts persist the Team Member mobile number and session/device context so the full scan history remains auditable without creating durable Team Member accounts.
- A durable Team Member profile can be added later only if approved requirements need cross-contractor identity, team management, blocking, or per-Team-Member analytics.

Permissions:

- View selected contractor name/number/photo.
- View selected contractor active sites.
- Select site and scan QR.
- View only scan history for sites the Team Member scanned for or attempted to scan for within allowed scope.

Denied:

- Full contractor list.
- Contractor points, rewards, tier, Balance Book, profile, analytics.
- Site create/edit/delete.
- Authentication via Recent without OTP.
- Full contractor Scan History across all sites and other Team Member scans.

## OWNER Auth

Flow:

1. OWNER account is created from backend.
2. OWNER logs in with registered mobile number and fixed 4-digit PIN.
3. Session persists unless deactivated, PIN changes, or app not opened for 4 days.

Permissions:

- Dashboard.
- Return Scan cancel/reverse.
- Contractor leaderboard.
- Add/edit/deactivate contractors.
- Add/deactivate staff and reset staff PIN.
- Reward fulfillment by Claim ID + OTP.
- Reports and exports.

## STAFF Auth

Flow:

1. OWNER creates staff account.
2. System assigns 4-digit PIN.
3. STAFF logs in with mobile number and assigned PIN.
4. Session persists unless deactivated, PIN changes, or app not opened for 4 days.

Permissions:

- Limited dashboard.
- Recent reverse/cancellation activity.
- Return Scan cancel/reverse.
- Contractor list/detail view-only.
- View-only reports if included in final navigation.

Denied:

- Add/edit/deactivate contractors.
- Delete profiles.
- Manually change points.
- Manage staff.
- Export/share reports.
- Fulfill rewards.

## Admin Web Scope Clarification

Admin Web uses the same OWNER/STAFF role permissions as Admin Mobile for all non-camera admin workflows:

- Dashboards.
- Contractor management.
- Staff management.
- Reward fulfillment.
- Reports and exports.
- Promotions.
- Analytics.
- QR printing, reprint, and print history.

Exception:

- Returned-product QR status scan, cancel, and reverse are Admin Mobile only in v1 because they require mobile camera scanning and label-removed/discarded confirmation at the product handling point.

Server-side rules:

- Admin Web routes must not expose returned-product QR status scan, cancel, or reverse controls in v1.
- Any future non-camera return handling method requires an explicit product decision and new authorization tests.

## Server-Side Enforcement

Every protected endpoint must check:

- Actor is authenticated.
- Actor role has permission for action.
- Actor scope matches target resource.
- High-risk mutation is valid for current domain state.

Client UI visibility is not a security boundary.

## Current Backend Guard Boundary

Status: Temporary development boundary until real login/session flows are implemented.

Protected API shells currently read actor context from headers:

- `x-actor-role`
- `x-actor-user-id`
- `x-actor-contractor-id`
- `x-actor-team-member-mobile`

Rules:

- Controllers must not trust `actorRole`, `actorUserId`, or `contractorId` from body payloads for protected flows.
- `ActorGuard` enforces the route's required domain action through the shared permission matrix.
- Admin Web QR print and mock BUSY import require `ADMIN_PRINT_QR`.
- QR scan requires `QR_SCAN` and a contractor scope.

This boundary is intentionally narrow. It must be replaced by real OWNER/STAFF login, Contractor MPIN sessions, and Team Member OTP sessions before production launch.
