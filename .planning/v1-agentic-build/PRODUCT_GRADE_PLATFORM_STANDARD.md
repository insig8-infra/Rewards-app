# Product Grade Platform Standard - Volt Rewards V1

## Purpose

This standard defines what "production-grade" means for Volt Rewards beyond API correctness. It applies to every mobile, web, backend, mock-data, and admin workflow slice.

Functional code is not enough. A slice is product-grade only when the user journey, data model, seeded content, navigation, visual treatment, permissions, persistence, and verification evidence all fit the real product.

## Non-Negotiable Rules

- No user-facing app surface may rely on placeholder labels such as `Demo Contractor`, `Runtime Gate Contractor`, `UAT Contractor`, `Isolated Contractor`, or similar test names except inside clearly test-only files.
- Seed, mock, UAT, and screenshot data must look like real customer data: human names, realistic mobile numbers, real electrical-shop products, real-looking sites, and believable rewards.
- End-user mobile and Admin Mobile UI work must follow the client-approved Stitch visual direction captured in `APPROVED_STITCH_UI_CONTRACT.md`; deviations must be explicitly documented in the phase plan/status.
- A mobile app workflow must use a real navigation model. Switching panels inside one long screen is acceptable only for an explicitly temporary shell, not for product completion.
- After login, the end-user mobile app lands on the main dashboard for Contractor. Team Member lands on the scan-first limited dashboard or scan screen only when that is the approved persona flow.
- End-user QR earning must follow the approved site-first persistent scan cart contract in `DEC-050`. A single immediate-credit scan shortcut is not product-complete because the approved workflow requires site confirmation, multiple successful scans into a server-reserved cart, review/cart, reserved-cart navigation guard, and `Add to account`.
- Every non-trivial workflow needs an entry screen, detail/edit/confirm/result screens where appropriate, back behavior, cancellation behavior, and clear recovery paths.
- Reward and product cards must use visual assets or a documented temporary asset strategy. Text-only tiles or initials are not product-grade reward presentation.
- Repeated interaction controls such as device image upload and masked PIN/MPIN entry must use shared, visible, user-operable patterns across surfaces. Web upload controls must prefer visible native `input[type=file]` controls; hidden-input bridges or programmatic picker clicks are not product-grade unless separately justified and manually verified on the target browser.
- UI completion requires visible-control UAT, API/database readback, screenshot evidence, and review against this file plus `FRONTEND_EXPERIENCE_STANDARD.md`.

## Mobile App Navigation Standard

The end-user mobile app must be structured as a real app:

- Use an app-level auth stack and an authenticated app stack.
- Use bottom tabs only for top-level destinations such as Dashboard, Scan, History, Rewards, and Profile/Sites as approved by the screen contract.
- Use the approved Stitch app-shell patterns for top app bars, language toggle placement, bottom tabs, card hierarchy, scan-result screens, reward tiles, and Team Member scan states.
- Push detail, create, edit, confirmation, OTP, reward claim, balance entry, site detail, scan result, Help, About, and profile flows onto stack screens instead of embedding every workflow in one scroll view.
- Each pushed screen must have a visible back affordance on iOS/web and must respect Android hardware back behavior when running native.
- Unsaved create/edit forms must warn or preserve state before leaving.
- Deep workflow screens must have one primary action, clear secondary/cancel action, and visible success/error/empty states.
- Navigation labels and behavior must remain correct in Hindi and English.

Temporary mobile shells are allowed only when the phase status says `visible shell` or `API validation shell`. They must not be called product-complete.

## Dashboard Standard

The Contractor dashboard is the default landing screen after Contractor login. It should answer:

- Who is logged in: human contractor name, photo/avatar, mobile, tier.
- What is the current value: available points, total accumulated points, tier progress.
- What should be done next: prominent Scan QR action and selected-site context.
- What is pending: active reward claim, soon-to-unlock rewards, failed/recent scans, or pending profile/support actions.
- Where to go: quick actions for Scan, Rewards, Scan History, Sites/Profile, Help/Support.

The Team Member landing experience must stay limited:

- Show the contractor human name, contractor mobile, contractor photo if available, and allowed site context.
- Keep Scan QR and permitted Scan History prominent.
- Do not expose full contractor dashboard, rewards, balance book, contractor analytics, or site-management actions.

Admin Web and Admin Mobile dashboards are operational command surfaces, not decorative summaries. They should answer:

- What changed recently: newest invoices, QR prints, returns, reversals, reward claims, contractor registrations, and staff actions.
- What needs attention: invoices ready for QR print, pending reward claims, return/reversal events, failed scans, inactive/deactivated users, and sync issues.
- Where to act next: shortcuts to print QR, contractor directory, staff management, reward fulfillment, reports, and return scan where role-appropriate.
- What is the current scale: contractor count, staff count, invoice count, QR printed/scanned/cancelled/reversed counts, reward claim counts, and key trends.
- What can be drilled into: every metric or count should link to the relevant filtered screen unless the phase contract explicitly defers it.

For Admin Mobile, dashboard controls must be app-native and functional. OWNER controls, Contractors count, Staff count, QR status, and Rewards/Claims surfaces should be clear entry points into workflows, not static text blocks.

## Workflow Hierarchy Standard

Production-grade workflow hierarchy must distinguish daily work from setup work.

- A landing screen should default to the persona's highest-frequency job.
- Setup/configuration/catalog/bulk-import workflows should be reachable through clear entry actions, tabs, or child routes, not rendered as the first content unless that is the screen's primary job.
- Returning from a nested management workspace should restore the parent operational context without forcing a full app reset.
- Before adding a large section to any landing page, the phase plan must state why it belongs on the landing page instead of behind a nested action.

## Operational List And History Standard

Directories, histories, ledgers, and invoice lists are product surfaces. They are not complete as static rows.

Each operational list should define the first useful version of:

- Search across the fields users naturally know, such as name, mobile number, contractor code, invoice number, product name, date, Claim ID, QR status, and site.
- Predefined filters for common states, such as active/deactivated, printed/not printed, scanned/cancelled/reversed, chosen/fulfilled, and date ranges.
- Sorting by the fields users compare most often, such as newest, oldest, name, points, status, invoice date, import time, print time, and scan time.
- Clickable rows or cards that open detail screens with full history and allowed actions.
- Empty, loading, error, and permission-denied states.
- Human-readable labels. Raw database IDs should not be the primary user-facing value.

## Reward Catalog Presentation Standard

Reward tiles and detail screens must be treated as product surfaces, not list rows.

Each reward tile should show:

- Reward image or documented temporary catalog asset.
- Reward name.
- Reward category or type where useful.
- Points value required.
- Required tier.
- Current status: locked, eligible, chosen, fulfilled/delivered, cancelled, or revoked where relevant.
- Visual progress to unlock or afford the reward.
- Gap copy such as `Collect 200 more points`.
- Claim ID when chosen.
- Clear primary action or disabled state with reason.

Essential reward tile content must remain readable on supported mobile viewports. Product-grade completion cannot rely on line clamps that hide the reward identity, points requirement, status, progress/gap copy, or Claim ID.

Reward detail should add:

- Larger image.
- Description and fulfillment expectations.
- Current balance impact.
- Cancellation cutoff.
- Delivered/Collected state after OWNER fulfillment.

The current schema already supports `RewardCatalogItem.imageUrl`; product-grade catalog work must populate and render it. If final client imagery is unavailable, use replaceable generated or curated temporary assets and track them as temporary content.

## Human Data And Identity Standard

The current model uses `User.displayName` as the contractor's user-facing human name. `Contractor` should not get a duplicate `name` column unless a future approved requirement needs separate fields such as legal owner name, business name, shop name, and preferred display name.

Required behavior:

- Admin registration captures a human name and writes it to `User.displayName`.
- Admin edit updates `User.displayName`.
- Mobile auth responses, Team Member Recent, admin lists, rewards fulfillment, scan history, and reports display `User.displayName`.
- Seeds and UAT scripts must use real human names such as `Ramesh Sharma`, `Vikram Patil`, `Amit Verma`, or similar client-appropriate examples.
- Test fixtures may use synthetic names only inside unit tests when clearly not user-facing.

If the product later needs multiple identity fields, the schema change must be explicit and should separate:

- `displayName`: app-facing human name.
- `legalName`: optional compliance/legal name.
- `businessName`: optional shop/company name.
- `photoUrl`: profile media URL or storage key.

## Fixture And Mock Data Standard

Mock data is part of product quality because it shapes UAT and client confidence.

Development seed data must include:

- Human OWNER, STAFF, and Contractor names.
- Realistic contractor sites, not `Demo Client` or `Demo Heights`.
- Electric-shop invoice lines such as Havells Wire, Atomberg Fans, Wipro Bulb, switches, MCBs, lights, and tools.
- Reward catalog items with images or temporary image assets.
- Points/tier values that demonstrate locked, eligible, chosen, fulfilled, and negative-balance edge states without corrupting ledger meaning.

Points/balance fixture data must reconcile. Available points, lifetime collected points, reward claim debits, reward cancellations, QR reversals, stale claims, and negative-balance scenarios must be explainable from ledger events before a mobile rewards/balance screen is accepted.

Test-only labels are allowed in automated test files and should not leak into seeded Supabase/local data, screenshots, or client demos.

## Screen Contract Additions

Every UI-bearing phase plan must define:

- Screen map: route/screen names, parent tab/stack, entry path, and exit path.
- Navigation behavior: back, cancel, unsaved state, post-success destination.
- Dashboard impact: what appears on the landing dashboard after the mutation.
- Data identity: which human names/images/statuses are shown and their source table/API field.
- Asset strategy: real image source, generated temporary asset, or explicit no-image rationale.
- Mobile-native readiness: keyboard handling, camera/contacts/storage permissions, hardware back, and release-build implications where relevant.

## Completion Gate

A UI slice is not product-grade until:

- It has a screen map and navigation behavior documented.
- It names the applicable approved Stitch reference screenshots and matches their layout/component grammar unless a documented product reason requires divergence.
- It uses realistic user-facing data.
- It renders required human names and images from the data model/API, not hardcoded placeholders.
- It has designed empty/loading/error/permission/success states.
- It passes visible-control UAT at the URL/device target the user will use.
- For file upload and PIN/MPIN reveal controls, UAT proves the visible control itself works across the relevant web/mobile surface before completion is claimed. File upload UAT must also verify the DOM hit target, accepted file types, enabled/visible state, and clean chooser cleanup after the test.
- For scan and reward/balance work, UAT proves credited points, QR value, available balance, lifetime points, and reward claim state are internally consistent through API/database readback.
- It has screenshot evidence for key states.
- Mutations are verified by API/database readback.
- Residual shortcuts are named honestly as shell, mock, or temporary content.
