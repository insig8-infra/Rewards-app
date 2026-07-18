# Frontend Experience Standard - Volt Rewards V1

## Purpose

This standard defines the quality bar for Volt Rewards frontend work. The product should feel like a thoughtfully designed 2026 application, not a generic generated dashboard or an intern-made prototype.

Use this together with `PRODUCT_GRADE_PLATFORM_STANDARD.md`. This file governs frontend experience quality; the product-grade standard governs app structure, fixture quality, navigation, dashboard expectations, reward media, and completion gates across the whole platform.

It applies to:

- End-user mobile app: Contractor and Team Member.
- Admin mobile app: OWNER and STAFF.
- Admin web portal: OWNER and STAFF non-camera workflows.

## Core Standard

Frontend work must optimize for:

- Clear user jobs: each screen should make the next sensible action obvious.
- Operational speed: repeated tasks should take fewer taps/clicks and should not bury core controls.
- Trust: important actions need confirmation, status, audit-friendly copy, and no ambiguous success messages.
- Visual polish: spacing, typography, hierarchy, controls, and states must look intentionally designed.
- Domain fit: this is a rewards, QR, invoice, contractor, and retail-operations product, not a generic SaaS demo.
- App realism: navigation, back behavior, dashboard landing, user data, reward tiles, and media must feel like a real app, not a single-screen prototype.
- Accessibility: touch targets, contrast, form labels, error messages, and keyboard/focus behavior must be considered.
- Localization readiness: Hindi/English switching should not break layout, control sizing, or flow clarity.
- Store readiness: mobile implementation should avoid dev-only shortcuts that would block public App Store or Play Store launch.

## Reference Usage

Use `Sample_References/` for Admin Web visual quality and dashboard polish references when relevant.

Use `Sample_References/Stitch_Admin_design.md` only for color-scheme direction. Do not copy its layout blindly unless the current workflow benefits from it.

Use `Sample_References/Screenshots from Stitch/` as the client-approved mobile UI/UX visual direction. The extracted contract lives in `APPROVED_STITCH_UI_CONTRACT.md` and is mandatory for end-user mobile phases and strongly informs Admin Mobile. Treat the screenshots as reference for component grammar, polish, color confidence, icons, animation/micro-interaction expectations, and workflow hierarchy, not as a pixel-perfect copy target. Do not copy Stitch editor chrome such as the dotted background or purple outer frame.

The earlier PayTM/PhonePe-style guidance is now secondary context only. The approved Stitch screenshots are the primary visual target.

Before building a new frontend surface, the phase plan must state:

- Which reference images or documents were considered.
- Which parts are being adopted.
- Which parts are being rejected and why.
- Which approved Stitch screen pattern applies, or why none applies.
- For mobile redesign or recovery work, which 3-5 production-grade rewards, loyalty, payment, or high-engagement app patterns/templates were reviewed, unless the phase contract documents why the approved Stitch references alone are sufficient.

## Required Design Contract Per UI Slice

Every UI-bearing phase must include a short screen contract before implementation:

- Persona: Contractor, Team Member, OWNER, or STAFF.
- Primary job: the main thing the user is trying to complete.
- Screen map: route/screen names, parent tab/stack, detail/edit/confirm/result screens, and the expected post-success destination.
- Entry path: how the user reaches the screen.
- Navigation behavior: back, cancel, unsaved changes, and recovery after errors.
- Primary action and secondary actions.
- Data shown and why it matters.
- Data identity: human names, profile images, reward images, and status fields shown, including the source API/database field.
- Asset strategy: final image source, temporary image source, or explicit no-image rationale.
- Empty, loading, success, validation-error, permission-denied, and network-error states.
- Role differences.
- Mobile and desktop layout expectations where applicable.
- Persistence or API readback needed after mutation.
- Exact UAT URL, simulator, or device target.

## Admin Web UX Rules

Admin Web is an operations portal. It should be dense, calm, and scan-friendly.

- Favor clear tables, filters, side panels, segmented controls, status chips, and compact forms.
- Keep dashboards useful, not decorative. Metrics should answer operational questions.
- Avoid oversized marketing-style heroes, generic gradient cards, decorative blobs, and vague stock-style graphics.
- Put high-frequency actions near the data they affect.
- Separate daily operations from setup/configuration. Landing pages should default to the user's primary job; lower-frequency management workflows such as catalog setup, configuration, and bulk import should open from explicit actions into nested workspaces or detail routes.
- OWNER and STAFF differences must be visible and enforced.
- Destructive or high-risk actions need clear confirmation and persisted readback.

## Mobile UX Rules

Mobile screens must be task-first and easy to operate in a shop or field context.

- End-user mobile should feel familiar to Indian payment-app users: quick actions, clear status summaries, QR-first action hierarchy, transaction-style history, prominent success/failure feedback, and compact confirmation patterns.
- End-user mobile visual implementation must follow `APPROVED_STITCH_UI_CONTRACT.md`, including role selection, login, dashboard, scan result, Balance Book/Rewards, Team Member mobile entry, and helper scan states.
- Colors, spacing, typography, radius, shadows, and status colors must be defined through theme tokens so final branding can change later without broad rewrites.
- Contractor login must land on the main dashboard. Team Member login may land on a scan-first limited dashboard/screen only when the screen contract makes that explicit.
- Mobile app flows must use a real navigation model: bottom tabs for top-level areas and stack/detail screens for create, edit, detail, OTP, scan result, reward detail, claim, profile, help, and confirmation flows.
- Every detail or workflow screen needs a visible back affordance and native Android back behavior must be planned before store readiness is claimed.
- Authentication, site selection, scan, history, and reward actions should be reachable without unnecessary nesting.
- Site context should stay visible when scanning or viewing scan results.
- QR scan flows must make success, duplicate, expired, invalid, and permission-denied states unmistakable.
- QR scan flows must use dedicated result screens for success, already scanned, expired, invalid QR, session expired, and network retry states, following the approved Stitch scan-state references.
- Team Member flows must make temporary access clear without exposing full contractor data.
- Contractor Scan History should support full contractor history across all sites and Team Member scans.
- Team Member Scan History should show only site/session-attributed scans the Team Member performed or attempted, not full contractor history.
- Site-first scanning is the default expected model for end-user mobile. Starting a new scan batch should select or confirm a site, allow multiple successful QR scans into a persistent server-reserved cart, present scanned items and total points, and then credit points with `Add to account`.
- Failed scans never enter the cart; they are recorded as failed attempts only. If `Add to account` fails for a technical reason, the reserved cart remains available for retry.
- The reserved cart has no v1 point-value cap. If the cart has reserved items and the user tries to leave the selected site's Scan flow, prompt the user to `Add to account` or stay/go back to Scan.
- Team Member Recent contractor should appear only after successful OTP login, at most one entry, with clear/remove control, and must never bypass OTP.
- Important controls should be reachable and large enough for one-handed use.
- Photo upload, camera, contacts, and OTP flows must include permission-denied and retry states.
- Hindi/English toggle must exist from day one in the end-user mobile app.
- Mobile screens should be compatible with public store readiness: clear permission prompts, secure storage for sensitive convenience state, no hidden dev-only routes in production, and release-build-safe native capabilities.
- Reward tiles must include a reward image or documented temporary image asset, reward name, required points, required tier where applicable, status, progress to unlock/afford, gap copy, and Claim ID when chosen.
- Reward tiles must not truncate essential meaning at supported phone widths. If content must collapse, preserve reward name, required points, status, progress/gap copy, and Claim ID before hiding secondary description.
- Profile, Team Member Recent, scan history, reward fulfillment, and admin lists must show human contractor names from persisted data, not fixture labels or generated test strings.

## Reusable Control Standards

Repeated controls are product infrastructure. A repeated control must be centralized or follow a documented shared implementation pattern before a UI slice is marked complete.

Device image upload:

- Browser upload controls must show a deliberate user-facing native `input[type=file]` or approved native-equivalent target that opens the native file picker.
- Web UAT must exercise the visible button/label. Directly setting files on a hidden input is only a supplement and cannot be the sole evidence.
- Web UAT must run from a clean isolated/incognito-like browser profile by default. If a persistent Chrome profile behaves differently, investigate stale cache, extensions, blocked dialogs, service-worker/session state, or profile policy before making product-code changes.
- Web UAT for upload controls must verify DOM hit target, visible/enabled state, accepted file types, no overlay interception, and chooser cleanup after cancel/upload.
- Admin Web image uploads must use the shared file-picker component unless a phase contract documents a product reason for a different control.
- Mobile image uploads must request media-library permission, handle denial and cancellation, show selected-image state, persist through the backend, and verify readback.
- Every upload surface must define accepted types, maximum file-size/normalization behavior, error state, and persistence target.

Masked secret entry:

- PIN and MPIN inputs must include a visible reveal/hide control unless a phase contract explicitly documents a security exception.
- Mobile PIN/MPIN reveal/hide should use an eye-style icon affordance with accessible labels rather than text-only `Show`/`Hide`, unless a platform constraint is documented.
- Reveal/hide controls must work with mouse, touch, keyboard, and screen-reader labels.
- The reveal state must never change the submitted value, validation behavior, or input normalization.
- This applies to Admin Web login, Admin Mobile login, Contractor login, Contractor SET MPIN, and Contractor Change MPIN.

## Fixture And Visual Asset Rules

Frontend UAT and screenshots must use product-like data.

- Seeded users shown in app/web must have human names, not `Demo`, `Runtime Gate`, `UAT`, or `Isolated` labels.
- Seeded sites must resemble real construction/electrical customer sites.
- Seeded rewards must have images or a documented temporary image strategy; initials-only reward icons are a shell-level fallback, not product completion.
- Mock BUSY invoices must look like real electric-shop invoices with realistic product line items.
- Temporary content must be recorded in phase residual risks and replaced before client demo or production launch.

## Tooling And MCP Expectations

Use these tools when relevant:

- Context7 MCP: fetch current docs for Next.js, React, Expo, React Native, Supabase, Prisma, NestJS, or UI libraries before setup, migration, or library-specific implementation choices.
- Browser plugin or Playwright: verify local web UI through visible controls at the exact URL the user will use.
- Expo simulator/device workflow: verify mobile UI when mobile implementation begins. If not available, record the gap and use Expo Web only as a supplement.
- Expo Web for mobile apps must render inside the app's bounded responsive phone-width browser shell, not full desktop width. The shell must be fluid below its max width so smaller phones are not hidden by a single fixed desktop preview.
- Mobile browser UAT must include at least this viewport matrix before a mobile UI slice can pass: `360x740` small Android/iPhone SE pressure check, `390x844` mainstream iPhone/Android check, `430x932` iPhone Pro Max check, and `480x900` large Android check. Expo Web remains a supplement; native iOS/Android validation is still required before store-ready claims.
- Screenshots: capture desktop and mobile-width evidence for materially changed UI.
- Database/API readback: verify mutations after UI action.

Do not add frontend libraries, component kits, icon packs, animation libraries, or MCP servers just because they look useful. Add them only when the phase plan states the need, alternatives, and verification burden.

## Frontend Completion Gate

A frontend slice is not complete until:

- The screen contract exists.
- The screen map and navigation/back behavior are documented for mobile app work.
- Relevant open questions were surfaced before implementation.
- UI was tested through visible controls.
- Mobile app UI was inspected in the bounded responsive phone-width shell at the user-facing local URL, with text overflow, tap target placement, bottom navigation, screen hierarchy, and scroll behavior checked across the required mobile viewport matrix.
- For mobile recovery work, output eval and trajectory eval were updated with visible evidence, missed-defect learning, and explicit confirmation that the implementation matches the user's workflow rather than only a visually similar screen.
- Repeated controls such as upload buttons, PIN reveal buttons, selects, segmented controls, and tabs were tested through their visible targets, not only through implementation internals.
- Console/network/hydration errors were checked.
- Mutations were verified through API/database readback.
- Product-like fixture data and required images/media were present, or temporary content was explicitly recorded.
- Desktop/mobile layout fit was checked where applicable.
- The experience was reviewed against this standard.
- The experience was reviewed against `PRODUCT_GRADE_PLATFORM_STANDARD.md`.
- Residual design or implementation risks were recorded.
