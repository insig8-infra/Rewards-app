# Architecture Decisions - Volt Rewards V1

Status: Draft, ready for user review.

## DEC-001: TypeScript Monorepo

Decision: Use a TypeScript-first monorepo with npm workspaces.

Rationale:

- Mobile, web, and backend can share contracts and domain types.
- npm is available in this environment; pnpm is not currently installed.
- Shared packages let domain rules live outside UI frameworks.

Consequences:

- Root package owns shared scripts.
- Apps live under `apps/*`.
- Shared logic lives under `packages/*`.

## DEC-002: Shared Domain Package First

Decision: Build `packages/domain` before UI apps.

Rationale:

- QR lifecycle, points ledger, reward ledger, and role permissions are the highest-risk behaviors.
- These rules must be deterministic and testable without a browser or phone.
- UI should render backend/domain state, not invent business validity.

Consequences:

- First implementation slice is pure domain code and tests.
- NestJS API will later wrap these domain services.

## DEC-003: Expo For Mobile

Decision: Use Expo/React Native for Android and iOS apps.

Rationale:

- Requirements need cross-platform Android and iOS.
- Expo supports camera permissions, contacts access, and release build workflows.
- Shared TypeScript contracts can be consumed by both mobile apps.

Consequences:

- Use Expo permissions explicitly for camera and contacts.
- Use secure storage for Team Member Recent contractor.
- Mobile app code starts after backend/domain contracts stabilize.

## DEC-004: Next.js For Admin Web

Decision: Use Next.js App Router for `Volt Admin Web Portal`.

Rationale:

- Requirements need browser dashboard/report/admin workflows.
- App Router supports page/layout routing and server-side behavior.
- Admin web can consume OpenAPI/client contracts from backend.

Consequences:

- QR printing workflow starts in web after backend QR domain is ready.
- Server-side web actions must still call backend authorization where actions are high risk.

## DEC-005: NestJS For Backend API

Decision: Use NestJS for backend API.

Rationale:

- Requirements need modular API, role guards, validation, testing, and OpenAPI contracts.
- NestJS aligns with TypeScript monorepo and domain module boundaries.

Consequences:

- Backend modules mirror domain boundaries: auth, users, sites, busy, qr, scans, points, rewards, reports, audit.
- Guards/policies enforce role permissions server-side.

## DEC-006: PostgreSQL For System Of Record

Decision: Use PostgreSQL as the primary relational database.

Rationale:

- The product is ledger/state-machine heavy.
- Relational constraints and transactions are important for QR and points correctness.
- Reporting and audit queries benefit from structured relational data.

Consequences:

- Implementation must use transactions for scan credit, reward redeem, cancel, reverse, and fulfill flows.
- ORM/migration tool remains open until implementation scaffold for backend.

## DEC-007: Mock BUSY Adapter Until Actual API Integration

Decision: Build with a mock BUSY adapter until actual BUSY API integration is ready.

Rationale:

- Real BUSY invoice/return API details are open.
- QR printing can be built against an adapter interface without blocking the domain model.
- Full product development should continue against realistic mock invoice data.

Consequences:

- Production BUSY connector is deferred until actual API details arrive.
- Integration tests use mock invoices and returns.
- The mock adapter is a replaceable implementation, not a product build blocker.

## DEC-008: OWNER-Only Reward Fulfillment

Decision: Use `app-requirementsV1.md`: only OWNER can fulfill rewards.

Rationale:

- This supersedes older planning docs where OWNER and STAFF could fulfill.
- Reward fulfillment changes point/reward state and should be more tightly controlled.

Consequences:

- STAFF reward fulfillment must be denied server-side.
- UI must not expose fulfillment controls to STAFF.

## DEC-009: Prisma For Database Access And Migrations

Decision: Use Prisma with PostgreSQL for schema modeling, migrations, and generated database client.

Rationale:

- Prisma provides a TypeScript-friendly generated client and migration workflow.
- It fits the NestJS backend pattern documented in current Prisma docs.
- The product has relational, transaction-heavy behavior around QR units, points ledger, reward claims, and audit events.

Consequences:

- Backend persistence must use transaction boundaries for high-risk mutations.
- Prisma schema becomes part of the reviewed product contract.
- Real database integration starts after the API shell; the first API slice can use in-memory adapters while Prisma schema is drafted.

## DEC-010: Hash QR Tokens At Rest

Decision: Persist HMAC hashes of QR token values instead of raw QR bearer tokens.

Rationale:

- A QR token grants points if scanned successfully, so the token itself is sensitive.
- Database or log exposure should not reveal reusable scan credentials.
- The API can hash the presented token and perform lookup without storing the raw value.

Consequences:

- QR print flows must generate the raw token once for the printable QR label and store only its hash.
- Reprint flows must invalidate the old token hash and create a new active token hash.
- Scan attempts store `tokenHashSeen`, not the raw token.

## DEC-011: Prisma CLI Transitive Override

Decision: Override Prisma CLI's transitive `@hono/node-server` package to `1.19.13`.

Rationale:

- Prisma 7.8.0 currently pulls `@prisma/dev -> @hono/node-server@1.19.11`.
- npm audit reports a moderate advisory fixed in `@hono/node-server@1.19.13`.
- Downgrading Prisma through `npm audit fix --force` would be a breaking change.

Consequences:

- Root `package.json` owns the override until Prisma updates its dependency.
- Dependency audit must remain part of every build slice.

## DEC-012: Create QR Unit Placeholders At Invoice Import

Decision: Mock BUSY import creates one `NOT_PRINTED` QR unit placeholder per invoice unit before any QR code is printed.

Rationale:

- Requirements distinguish printed and skipped/unprinted units.
- Partial print batches need durable unit-level records to print later.
- Return validation can block later printing of still-`NOT_PRINTED` units.

Consequences:

- QR print transitions selected placeholders from `NOT_PRINTED` to `PRINTED_UNCLAIMED`.
- Print services must select placeholders transactionally and cannot create scannable QR units directly from request quantities.
- The BUSY connector must eventually provide enough line quantity and return information to maintain placeholder eligibility.

## DEC-013: QR Print Returns Raw Token Once

Decision: The QR print service returns raw token values only in the print result, while persisting only token hashes.

Rationale:

- Label printing needs the raw QR payload at print time.
- The database should not store reusable QR bearer credentials.
- Reprint can rotate tokens by invalidating the old hash and creating a new active hash.

Consequences:

- Print results must be handled carefully by Admin Web and not logged.
- Reconstructing a lost raw QR token is impossible by design; reprint must generate a replacement token.

## DEC-014: Temporary Header-Backed Actor Context

Decision: Use guarded development actor headers for protected API shells until real auth/session flows are implemented.

Rationale:

- The next UI slice needs server-side authorization behavior before final login flows exist.
- Body-provided actor role/user id is not an acceptable security boundary.
- A guard/decorator boundary lets controllers be written against request actor context now and later swap header parsing for real sessions.

Consequences:

- Protected shell requests use `x-actor-role`, `x-actor-user-id`, `x-actor-contractor-id`, and `x-actor-team-member-mobile`.
- Controllers must not use body fields as authority for actor role, actor user id, or contractor scope.
- This decision is explicitly temporary and must be replaced before production launch.

## DEC-015: Temporary Next.js Canary For Audit Cleanliness

Decision: Pin Admin Web to `next@16.3.0-canary.60` for now.

Rationale:

- Current stable `next@16.2.9` pins `postcss@8.4.31`.
- npm audit reports a moderate PostCSS advisory fixed in `postcss@8.5.10`.
- The checked canary version uses `postcss@8.5.10` and keeps production dependency audit clean.

Consequences:

- Treat this as a temporary dependency decision.
- Re-check stable Next releases regularly and return to stable as soon as the PostCSS fix lands.
- Keep Admin Web verification broad enough to catch canary regressions.

## DEC-016: Admin Web Parity Except Mobile Return Scan

Decision: Admin Web implements all non-camera OWNER/STAFF admin workflows available in Admin Mobile, while returned-product QR status scan, cancel, and reverse remain Admin Mobile only in v1.

Rationale:

- Admin Web is the right surface for browser-based management, reporting, exports, QR printing, staff management, contractor management, promotions, analytics, and reward fulfillment.
- Returned-product QR handling depends on scanning the physical QR at the product handling point and confirming the label was removed/discarded.
- Mobile camera scanning gives a simpler and more reliable operational workflow for return handling in v1.

Consequences:

- Admin Web roadmap/API contracts include dashboards, contractor management, staff management, reward fulfillment, reports/exports, promotions, and analytics.
- Admin Web must not expose returned-product QR status scan, cancel, or reverse controls in v1.
- Return scan lookup/cancel/reverse tests belong to Admin Mobile and backend authorization coverage, not Admin Web UI.

## DEC-017: Mock BUSY Adapter Unblocks Full Product Build

Decision: The full Volt Rewards product will be built against a realistic mock BUSY adapter until actual BUSY API integration details are available.

Rationale:

- QR printing needs invoice data, but product development should not wait for the external BUSY API.
- The mock adapter now carries realistic electric-shop invoice data: invoice number, date/time, seller/customer GST details, taxable totals, GST totals, final total, and electrical product line items.
- Keeping BUSY behind an adapter lets us replace the mock source with actual BUSY API integration later without redesigning domain rules or UI workflows.

Consequences:

- Mock BUSY remains the active v1 development data source.
- Real BUSY API work is an integration replacement task, not a blocker for Admin Web, Admin Mobile, rewards, reports, or end-user app development.
- Tests should target the adapter contracts and domain outcomes, not hardcode assumptions that only work with mock data.
- UI screens should be built as production screens, even when their data currently comes from mock BUSY.

## DEC-018: BUSY Writes Through Backend Ingestion API

Decision: Production BUSY integration will push sale invoice and return invoice events to Volt Rewards backend ingestion APIs. A full return invoice contains all original sale line items and quantities, so the sale and return net to zero. The BUSY local server or sync service will not write directly to the Volt Rewards PostgreSQL database.

Rationale:

- The backend must validate BUSY payloads before they affect QR eligibility, points, rewards, reports, or audit state.
- Database credentials should not be distributed to the BUSY machine.
- The backend can enforce idempotency, payload hashing, audit logging, and schema versioning.
- Keeping the integration at the API boundary makes the PostgreSQL provider portable between developer-owned and client-owned accounts.

Consequences:

- The shareable BUSY developer contract lives at `client-deliverables/BUSY_DEVELOPER_API_HANDOFF.md`; `client-deliverables/BUSY_API_INTEGRATION_SPEC.md` remains the internal detailed reference.
- Future API implementation should add `/api/integrations/busy/v1/*` endpoints.
- A sync-event table should record idempotency keys, event IDs, payload hashes, and failures.
- The mock BUSY adapter remains active until BUSY return-link, partial/full return samples, stable identifier, and authentication details are confirmed.

## DEC-019: Contractor Forgot MPIN Uses OWNER Reset

Decision: Forgot MPIN does not recover or reveal the existing MPIN. Contractor contacts retailer/admin, and OWNER resets a temporary MPIN from Admin Web or Admin Mobile.

Rationale:

- Showing or recovering the current MPIN would weaken credential handling.
- OWNER-mediated reset matches the operational relationship between retailer/admin and contractor.
- Reset MPIN should be a temporary credential, not a permanent replacement.

Consequences:

- Reset temporary MPIN is valid for 5 days.
- Contractor should be forced to set their own MPIN again after logging in with the reset MPIN.
- Admin Web and Admin Mobile both need OWNER-only reset controls and audit events.

## DEC-020: Team Member Is A Temporary Session Actor

Decision: Team Member is not a saved user profile in v1. Team Member is a temporary session actor scoped to one contractor, with mobile number, session id, selected site, and device context persisted on scan attempts.

Rationale:

- The Team Member role is scan-limited and contractor-scoped.
- Full scan history and failed attempt auditing can be achieved by storing Team Member attribution on scan attempts.
- Avoiding durable Team Member profiles reduces registration/admin overhead until requirements demand team management.

Consequences:

- Team Member OTP/session implementation must capture enough attribution for scan history.
- Contacts access is optional convenience for contractor mobile selection; manual entry must always work.
- A durable Team Member profile can be introduced later only if needed for cross-contractor identity, blocking, analytics, or team administration.

## DEC-021: Site Selection Required And Historical Sites Are Archived

Decision: Contractor and Team Member must select an active site before scanning. Sites with existing scans are archived/inactivated rather than hard-deleted.

Rationale:

- Every scan needs site context for contractor history, reports, disputes, and analytics.
- Hard-deleting a site with scans would either break historical references or make old reports misleading.
- Archiving preserves history while preventing future scans against a stale site.

Consequences:

- Scan endpoints must reject missing or inactive site ids.
- Archived sites are hidden from active scan selection by default but remain visible in historical scan/report contexts.
- Site deletion UI should use language like remove/archive rather than implying irreversible data deletion after scans exist.

## DEC-022: Managed PostgreSQL Provider Not Yet Locked

Decision: PostgreSQL is locked as the database engine and Prisma is locked as the ORM/migration tool. The managed PostgreSQL provider is not yet locked.

Rationale:

- Current implementation depends on standard PostgreSQL and Prisma, not provider-specific APIs.
- Supabase is technically compatible with this direction because it provides direct Postgres connection strings and connection pooling, and its docs support transferring projects between organizations.
- Provider choice should account for cost, backup/restore, region, transfer ownership, support, operational simplicity, and migration/export path.

Consequences:

- Continue local development against standard PostgreSQL.
- Avoid Supabase-only schema or auth/storage assumptions until provider selection is explicitly completed.
- Run a short provider selection gate before production deployment setup; Supabase should be one candidate, not an implicit lock-in.

## DEC-022A: Supabase Shared Pooler For Current Dev/UAT Connectivity

Decision: Current developer/UAT runtime uses Supabase Shared Pooler session mode on `aws-1-ap-southeast-1.pooler.supabase.com:5432` rather than Supabase direct DB host.

Rationale:

- The Supabase direct database host for the current project resolves as IPv6-only from this environment.
- Node/Prisma local runtime and seed commands require reachable IPv4-compatible Postgres connectivity.
- Supabase Shared Pooler session mode is the connection string supplied by the project Connect page and is appropriate for this current long-running local/API runtime.
- Password handling remains centralized through `SUPABASE_DATABASE_PASSWORD`; host/user/database settings are non-secret env values.

Consequences:

- Prisma CLI and API runtime build their effective `DATABASE_URL` from pooler env values and `SUPABASE_DATABASE_PASSWORD`.
- Current local/dev uses `SUPABASE_DATABASE_USE_LIBPQ_COMPAT=true` to handle pooler TLS chain behavior.
- Production launch must use verified TLS with the Supabase CA certificate, a Supabase IPv4 add-on/direct connection with verified TLS, or another managed Postgres provider with documented TLS/backup/failover settings.
- Health checks must distinguish process liveness from database readiness before production.

## DEC-023: BUSY Sends Facts, Volt Rewards Decides QR Effects

Decision: BUSY integration sends sale invoice, sale line edit, and return invoice facts keyed by stable `tmpVchCode`. A full return invoice uses the same return invoice pattern with all original sale line items and quantities. Volt Rewards computes QR lifecycle effects from those facts.

Rationale:

- BUSY is the source of invoice truth, but QR statuses and reward ledgers belong to Volt Rewards.
- Partial return behavior depends on local QR state: not printed, printed unclaimed, scanned claimed, expired, cancelled, or reversed.
- Keeping the decision in Volt Rewards avoids pushing QR-specific business logic into the BUSY connector.

Consequences:

- BUSY events must include original sale `tmpVchCode`, return invoice `tmpVchCode`, `SrNo` where stable, `tmpItemCode`, quantity, discount fields where available, and the return invoice fields needed to identify the returned item/quantity.
- BUSY must not send instructions like "reverse points"; it sends sale and return invoice facts.
- Volt Rewards must compare current BUSY facts to stored invoice/line state and decide whether to block later printing, require mobile cancellation, or reverse scanned points.

## DEC-024: Reward Points Display Uses Points, Not Rupee Marketing Copy

Decision: Reward ledger stores points, and contractor-facing scan/reward copy must display reward value as points. Earlier rupee-equivalent marketing copy (`1 point = Rs. 1`) is superseded by MANUALUAT2A on 2026-07-10 for user-facing app copy.

Rationale:

- The approved product direction now requires all QR earning, reward unlock, balance, and scan-history value copy to be in points.
- Mixed `Rs.` and points labels create trust and reconciliation risk because reward points are the actual ledger unit.
- Admin-only commercial fields such as reward value in INR remain monetary fields, but they must not be confused with contractor reward points.

Consequences:

- Ledger values remain points.
- End-user mobile, Admin Mobile, and Admin Web must use points labels for QR value, points spent, balances, reward costs, and scan history.
- Admin-only reward catalog cost/value fields may still show INR when the field is truly a cash procurement/value metric, for example `Reward Value in INR`.
- Existing examples, seed data display strings, docs, and tests using `Rs.` for reward points must be migrated to points terminology during the next relevant slice.
- Reward calculation rules now route through ItemCodes. `Absolute Points` and `% of Price` rules are approved; `% of Price` uses the latest synced ItemCode `Price` field and rounds resolved points to the nearest integer unless a later product decision changes rounding.

## DEC-025: UI Experience Contract Required For Product Completion

Decision: A user-facing mobile or web slice cannot be considered product-complete until it has a UI experience contract, frontend implementation or thin shell, visible-control UAT, persistence readback, and frontend quality review.

Rationale:

- Backend APIs can prove control-plane correctness but cannot prove whether the Contractor, Team Member, OWNER, or STAFF journey is usable.
- The agentic methodology requires state/action/outcome scenarios and rendered workflow verification, not only API tests.
- The product needs a modern, thoughtful 2026 frontend experience rather than generic generated screens.

Consequences:

- Phase status may say `API foundation complete` while frontend validation is pending, but must not overclaim product workflow completion.
- Every UI-bearing phase must use `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`.
- New or materially changed UI must use `ui-surface-implementation` and `frontend-experience-quality` review gates.
- Mobile/backend work for end-user flows should be paired with a thin mobile shell early enough for user validation.

## DEC-026: Phase-Relevant Open Questions Must Be Surfaced Before Implementation

Decision: Open questions must be brought forward at the phase they affect. The agent must not silently choose product behavior, UX defaults, provider choices, reward rules, data policy, or production security policy unless already locked in this decisions file.

Rationale:

- The project should stay agentic-engineering-led: the agent orchestrates and verifies, while product/client choices remain explicit.
- Deferring every open question blocks momentum, but silently deciding them causes rework and hidden assumptions.
- Phase-scoped question review keeps discussions timely and specific.

Consequences:

- Every phase plan must list relevant open questions, classify them, and record user decisions or explicit assumptions.
- Durable answers must update `OPEN_QUESTIONS.md` and this file when they become architecture/product decisions.
- `phase-question-governance` is a required read-only gate at phase start.

## DEC-027: Mobile UX Direction Uses Indian Payments-App Patterns

Decision: The end-user mobile app should use PayTM/PhonePe-style Indian payments-app UX patterns as inspiration, without copying their branding, assets, trademarks, or exact layouts. Colors can be chosen for Volt Rewards, but must be implemented through theme tokens so they are easy to change later.

Status: Superseded as the primary direction by `DEC-040`. Keep this decision only as historical context and secondary UX background.

Rationale:

- Contractors and Team Members are likely familiar with wallet/payment-app interaction patterns: quick actions, QR-first flows, clear transaction history, balance/status summaries, and explicit success/failure states.
- The product needs to feel polished, trustworthy, and operational rather than generic.
- Theme tokens preserve flexibility as final client branding evolves.

Consequences:

- For Phase 14, the app did not use the existing sample references as the mobile design reference. For all future mobile UI work, use `APPROVED_STITCH_UI_CONTRACT.md` as the primary visual source of truth.
- Use mobile patterns such as balance/status headers, prominent scan action, quick action tiles, transaction-history rows, clear status badges, and compact confirmation sheets where appropriate.
- Define color, spacing, radius, typography, and status-color tokens instead of scattering hardcoded styling.
- Avoid brand confusion with PayTM or PhonePe; the app remains Volt Rewards.

## DEC-028: Hindi/English Toggle Exists From Day One

Decision: The end-user mobile app must include a Hindi/English language toggle from the first mobile shell.

Rationale:

- `PLAT-007` requires Hindi and English switching on every end-user screen/page.
- Retrofitting localization later risks layout overflow, hardcoded copy, and inconsistent flows.

Consequences:

- Phase 14 must include a basic localization structure and visible language toggle.
- New end-user mobile copy should be routed through translation resources, even if translations are improved later.
- UI layout must account for Hindi text expansion from the first implementation.

## DEC-029: Scan History Visibility Differs By Persona

Decision: Contractor Scan History shows full contractor scan history across all sites and Team Member scans. Team Member Scan History shows only scans for sites the Team Member has scanned for or attempted to scan for within their allowed session/history scope.

Rationale:

- Contractor owns the complete contractor reward/scan context.
- Team Member access is temporary and scan-limited; showing all contractor history would expose more data than needed.
- Site-scoped Team Member history still supports issue solving for failed attempts.

Consequences:

- APIs and UI must enforce persona-specific scan-history visibility server-side.
- Contractor history filters can span all sites, statuses, and scanner types.
- Team Member history must be filtered to allowed site/session attribution and must not rely only on client-side filtering.

## DEC-030: Team Member Recent Contractor Is One Clearable Secure Entry

Decision: Team Member login may show at most one recent contractor, only after a successful OTP login for that contractor. The recent entry must be clearable/removable and must never bypass OTP.

Rationale:

- One recent contractor reduces repeated entry without turning Team Member into a durable profile.
- A clear/remove control gives the Team Member control when they switch contractor context or use a shared device.
- OTP every session preserves the security boundary.

Consequences:

- Recent contractor is local convenience state, stored in secure device storage.
- Recent is populated only after successful OTP verification.
- Login screen must include a clear/remove control when Recent is present.
- OTP request/verify is still required every Team Member session.

## DEC-031: Mobile Apps Are Built Store-Ready From The Start

Decision: Mobile app implementation must be compatible with eventual public App Store and Play Store launch from the start.

Rationale:

- The product is intended for public Android and iOS distribution.
- Early shortcuts around permissions, storage, package identity, native capabilities, or release builds can create expensive launch blockers later.

Consequences:

- Expo/React Native choices must account for release builds, native permissions, privacy disclosures, camera/contacts usage, secure storage, and platform review expectations.
- Mobile implementation should avoid dev-only behavior in production paths.
- CI/eval gates should include release-build readiness checks as the mobile apps mature.
- Final store submission assets, legal/privacy copy, screenshots, and account ownership can remain part of launch hardening, but implementation must not create avoidable store-review blockers.

## DEC-032: Reward Catalog, Tiers, And Eligibility

Decision: V1 rewards use a configurable catalog with realistic contractor-facing rewards such as toolbox, air fryer, and similar physical items. Contractor tiers are Silver, Gold, Platinum, and Diamond. Tiers unlock sets of rewards based on total points collected and current points available for redemption.

Rationale:

- The catalog needs to be buildable before the client finalizes every reward item.
- Contractors should understand both reward affordability and progress toward the next tier/reward.
- Tier names should be stable in product copy and reports from the first rewards slice.

Consequences:

- Seed/mock catalog data may be used during development, but it must be stored/configured through the same catalog model the production product will use.
- Reward tiles must show eligibility and how far the contractor is from unlocking or affording the reward.
- `Points Available` gates redemption. Tier state can additionally gate catalog visibility/eligibility where the catalog item requires a higher tier.
- Phase 15 may use starter tier thresholds/catalog values as mock data; final commercial reward prices remain configurable catalog data.

## DEC-033: Reward Balance, Cancellation, Fulfillment, And Negative Balance Rules

Decision: `Total accumulated points` is a lifetime gross display value and does not decrease when points are later reversed. `Points Available` is the current redeemable balance. A contractor can cancel a chosen reward until OWNER marks it Fulfilled/Delivered after entering OTP. OTP initiation alone does not block contractor cancellation. If a fulfilled reward is followed by product return or QR reversal, the reward stays fulfilled and `Points Available` may become negative; future scan credits first recover that deficit.

Rationale:

- Lifetime gross points are simpler for contractor motivation and tier display.
- Available points should reflect the actual spendable balance after redemption, cancellation, and reversal.
- Physical delivery is the operational handover boundary; OTP sent is not enough to treat a reward as collected.
- Reopening fulfilled reward handovers after a return would create operational ambiguity.

Consequences:

- Reward redeem creates a Claim ID, deducts available points, and records a ledger event.
- Contractor cancellation before fulfillment restores points, recalculates eligibility, and records a ledger event.
- OWNER fulfillment requires Claim ID lookup, OTP entry, and explicit Fulfilled/Delivered action.
- Fulfilled rewards cannot be casually cancelled by the contractor.
- Balance Book must show negative-balance events clearly when post-fulfillment reversals occur.

## DEC-034: QR Reward Points Are Resolved From Managed ItemCodes

Decision: QR scan reward points for v1 are resolved from the managed BUSY ItemCodes table keyed by `TempItemCode` / `tmpItemCode`. The table supports exactly one active editable rule per ItemCode: `Absolute Points` or `% of Price`. `% of Price` uses the latest synced ItemCode `Price` field and rounds resolved points to the nearest integer unless a later product decision changes rounding. Calculated `% of Price Points` and `Final Points` are displayed in Admin Web, and the resolved final value is copied onto each QR unit at print time.

Rationale:

- The client wants item-specific reward earning governed by BUSY item codes.
- Client Demo 2 introduced an Admin Web `ItemCodes` tab where the retailer can manage `Absolute Points` or `% of Price` for each BUSY item code.
- `TempItemCode` / `tmpItemCode` is the stable product key available from BUSY invoice line and item-master data.
- Freezing the resolved points value on printed QR units prevents future ItemCode rule changes or BUSY item deactivation from changing already printed labels.

Consequences:

- BUSY ingestion must persist `tmpItemCode` for every invoice line and QR unit.
- Admin Web must expose ItemCodes management with BUSY-sourced TempItemCode, Item Name, Product Category, Price, `Absolute Points`, `% of Price`, calculated `% of Price Points`, `Final Points`, and derived status.
- QR generation must copy the resolved points value onto each QR unit at print time so printed QR rewards remain fixed even if future rules change.
- Printed QR label copy must state `Collect X points`.
- If an item disappears from BUSY, existing printed QR units remain claimable for their stored points, while future QR generation should not include that item.
- Until production BUSY API exists, development uses a realistic dummy ItemCodes list with `Absolute Points` populated and `% of Price` blank.
- The BUSY developer contract must require enough item master or invoice-line data to map every eligible ItemCode and detect missing/deactivated items.
- OWNER can edit ItemCode reward rules; STAFF is read-only.
- Production BUSY integration still needs confirmation for GST/discount semantics and item master/change feed behavior, but Phase 26B implementation uses the synced ItemCode `Price` field for `% of Price`.

## DEC-035: Contractor Human Name Uses `User.displayName`

Decision: The contractor's app-facing human name is stored in `User.displayName`. Do not add a duplicate `Contractor.name` column for the current requirements.

Rationale:

- The current schema already models each Contractor as a user with a required display name.
- Admin contractor registration and edit flows already write the contractor name to `User.displayName`.
- Duplicating a name on `Contractor` would create synchronization risk without solving a product requirement.
- The observed problem is poor fixture/seed naming and shell-quality presentation, not a missing name field.

Consequences:

- Mobile auth responses, Team Member Recent, admin contractor lists, reward fulfillment lookup, scan history, reports, and profile surfaces must display `User.displayName`.
- Seed, mock, UAT, screenshot, and client-demo data must use realistic human names instead of `Demo`, `Runtime Gate`, `UAT`, or `Isolated` labels.
- If the product later needs separate legal name, business/shop name, and app display name, that schema change must be explicit and should not be hidden inside this fix.

## DEC-036: Product Completion Requires Real App Navigation And Product Data

Decision: A visible mobile shell can validate APIs, but cannot be treated as product-complete unless it has real app navigation, dashboard landing, back behavior, product-like fixture data, reward media, and product-grade UAT evidence.

Rationale:

- Agentic engineering requires verified user journeys, not just working components or API-connected panels.
- A production mobile app needs logical routes/screens, back/cancel flows, dashboard hierarchy, media-rich catalog presentation, and realistic data.
- Client confidence and UAT quality degrade when placeholder names, text-only reward tiles, or single-screen prototypes are presented as complete product work.

Consequences:

- The next end-user mobile phase must correct the shell into a product-grade baseline before broadening to new feature areas.
- Every mobile UI phase plan must include a screen map, navigation/back behavior, dashboard impact, data identity, and asset strategy.
- Reward tiles and reward details must render images or documented temporary assets using catalog media fields such as `imageUrl`.
- Phase status language must distinguish `API foundation`, `visible shell`, and `product-grade workflow complete`.

## DEC-037: Phase 16 Mobile Navigation And Temporary Reward Assets

Decision: Phase 16 will keep Contractor top-level tabs as Dashboard/Home, Scan, History, and Rewards. Sites/Profile/Help are reached from dashboard/profile/menu actions rather than adding another bottom tab. Team Member uses a scan-first limited dashboard/screen with contractor identity, selected-site context, Scan QR, and allowed Scan History. Development reward images use replaceable temporary generated/catalog images through `RewardCatalogItem.imageUrl`.

Rationale:

- Four top-level Contractor tabs keep the mobile navigation focused and familiar.
- Sites, profile, Help, About, and MPIN management are important but not frequent enough to deserve permanent bottom-tab space.
- Team Member should land where the job starts, but still needs contractor identity and site context to avoid accidental scans under the wrong contractor/site.
- Reward images are needed now for product-grade catalog presentation, while final client images can remain a content replacement task.

Consequences:

- Phase 16 screen map uses bottom tabs for Dashboard/Home, Scan, History, and Rewards for Contractor.
- Contractor dashboard/profile actions must provide access to Sites, Profile, Help, About, Logout, and MPIN change.
- Team Member navigation must expose only the limited scan-first dashboard and allowed history/site selection paths.
- Seed catalog items must populate `imageUrl` with replaceable temporary assets.

## DEC-038: Admin Mobile Is A Separate App With Admin Bearer Sessions

Decision: Admin Mobile is a separate Expo/React Native app surface named `Volt Admin`. It must not be implemented as a hidden mode inside the end-user `Volt Rewards` app. OWNER and STAFF authenticate through backend PIN login and persisted bearer sessions, not through Admin Web development actor headers.

Rationale:

- Requirements define distinct end-user and admin mobile apps with different personas, permissions, navigation, and store-facing identities.
- Admin Mobile includes high-risk returned-product QR handling, contractor management, staff management, and reward fulfillment. These must not depend on client-only role toggles or local dev headers.
- The existing `AuthSession` model already supports role-scoped bearer sessions and can carry OWNER/STAFF actor context without adding a second session table.
- A separate app keeps App Store/Play Store metadata, permissions, and camera usage boundaries cleaner.

Phase 17 baseline assumptions:

- OWNER tabs are Dashboard, Return Scan, Contractors, and Reports.
- STAFF tabs were Dashboard, Return Scan, and Contractors in the Phase 17 baseline.
- Supersession note: Phase 25F/post-demo correction now gives STAFF Dashboard, Return Scan, Contractors, Rewards, and Reports with restricted/read-only behavior. STAFF still cannot manage staff, fulfill rewards, export reports, or mutate protected records.
- OWNER reward fulfillment is surfaced from the OWNER Dashboard first, matching the dashboard requirement. It can move to a faster dedicated screen later if UAT requires it.
- Staff mobile-number edits remain deferred; current shared foundation supports create, reset PIN, deactivate, and reactivate.
- Expo Web uses token-entry lookup for Return Scan UAT. Native camera scanning is not claimed complete until simulator/device validation passes.

Consequences:

- Add `apps/admin-mobile` as a separate workspace.
- Add `POST /api/auth/admin/login` and use bearer sessions for Admin Mobile protected calls.
- Admin Mobile may reuse shared backend services and role permissions, but it should use admin-mobile route contracts where the workflow is mobile-specific.
- Admin Web remains the full non-camera browser admin surface and still must not expose returned-product QR status scan/cancel/reverse in v1.

## DEC-039: Admin Mobile Route Contracts Must Match Rendered Mobile Data

Decision: Admin Mobile can reuse backend services, but every Admin Mobile screen must render against the actual API response contract verified through browser/device UAT. If a mobile screen needs a field such as `auditEventId` or site-level `scanCount`, the backend contract must expose it explicitly instead of relying on optimistic frontend types.

Rationale:

- Phase 17 UAT caught two contract mismatches that typecheck alone could not catch: dashboard activity rows used `id` while the API returned `auditEventId`, and contractor site rows expected `scanCount` while the API omitted it.
- Agentic engineering requires evidence-backed slice completion. A green unit test is insufficient if the visible app renders warnings, blank values, or stale placeholders.
- Mobile operational screens are high-trust surfaces for returned-product, contractor, reward, and staff work; blank operational data weakens UAT confidence.

Consequences:

- Every new mobile API wrapper must be validated through live API readback in the phase UAT evidence.
- Screen plans must list the concrete response fields they render.
- Browser/device UAT findings that expose contract mismatch must be fixed or documented as a blocking residual risk before the phase is marked complete.
- Shared Admin Web services may remain the source of truth, but Admin Mobile route aliases should shape or extend payloads for mobile workflow needs where necessary.

## DEC-040: Approved Stitch Screenshots Are The Mobile Visual Source Of Truth

Decision: The client-approved screenshots in `Sample_References/Screenshots from Stitch/` are the primary UI/UX visual direction for Volt Rewards mobile work. The extracted implementation contract is `APPROVED_STITCH_UI_CONTRACT.md`.

Rationale:

- The client approved these screens as the desired look and flow language.
- Future phases need a stable visual target before adding more screens, otherwise each slice risks creating a different app feel.
- The screenshots cover the highest-risk mobile UX areas: role selection, Contractor login, dashboard, scan success/failure, Balance Book/Rewards, Team Member OTP entry, and helper scan states.

Consequences:

- The earlier generic PayTM/PhonePe inspiration is now secondary. Stitch-approved patterns are the primary mobile design target.
- Phase plans for mobile UI must cite the relevant Stitch screenshot(s).
- Existing Phase 16 and Phase 17 mobile baselines need a visual-system alignment pass before deeper feature expansion.
- Do not copy Stitch editor artifacts such as the black dotted canvas or purple frame.
- UI completion evidence must include screenshots compared against this contract.

## DEC-041: QR Reversal Revokes Newest Chosen Claims Until Balance Recovers

Decision: When Admin Mobile reverses a scanned QR and the points deduction makes `Points Available` negative, the backend revokes the newest `CHOSEN` and unfulfilled reward claims until the contractor balance is non-negative or no chosen claims remain. Fulfilled claims stay fulfilled. If no chosen claims remain and the balance is still negative, the remaining deficit stays as negative `Points Available`.

Rationale:

- Scanned QR points are fungible after credit, so the platform needs a deterministic rule for deciding which unfulfilled claim is affected.
- Newest-first revocation is auditable and avoids silently choosing an arbitrary reward.
- This preserves the existing rule that a fulfilled/delivered reward is not reopened after a later product return.
- It satisfies the requirement that unfulfilled claims affected by QR reversal are revoked rather than left in an impossible pending state.

Consequences:

- QR reverse transactions must first write the QR reverse ledger entry, then revoke chosen claims only if the balance is negative.
- Each revoked claim must write a `REWARD_REVOKED_DUE_TO_RETURN` ledger entry that restores its deducted points and an audit event naming the QR unit and claim.
- Admin Mobile reverse lookup must show projected negative balance and claim-impact information before the user confirms reversal.
- Balance Book must show both the QR reversal and any claim-revocation restore entries.

## DEC-042: BUSY Returns Arrive As Linked Return Vouchers

Decision: BUSY sales returns are represented as new return invoices that look like sale invoices but have a different `VchType`, linked to the original sale invoice. The original sale invoice does not change in BUSY. The linkage is invoice-level, not line-item-level, and BUSY does not provide a unique identifier for each physical item. A full return invoice contains all original sale line items and quantities.

Rationale:

- The BUSY developer clarified that a return creates a separate voucher rather than mutating the original invoice.
- Return linkage is to the original voucher, so Volt Rewards cannot assume BUSY will identify the exact original invoice line or physical unit.
- QR units are created and tracked inside Volt Rewards, so QR cancel/reverse decisions must be derived from original invoice quantities, returned item codes, and local QR state.

Consequences:

- Production BUSY integration and the mock BUSY adapter must ingest return invoices separately from sale invoices.
- Return invoices must not appear in the Admin Web QR printing queue.
- Admin Web should show return invoices as updates/history against the original invoice.
- For each return invoice line, Volt Rewards must validate that the returned `tmpItemCode` existed on the linked original invoice and that cumulative returned quantity does not exceed sold quantity.
- Return allocation follows `DEC-045`: consume not-yet-printed units first, then printed-unscanned units as cancel-eligible allocation candidates, then scanned/claimed units as review-needed when no physical QR scan identified the exact unit.
- BUSY return import must not silently reverse contractor points without an Admin Mobile physical QR scan or another future approved exact-unit verification method.
- Admin Mobile remains the exact-unit action surface: physical scan of a printed returned QR determines whether cancel or reverse flow applies.
- Duplicate original invoice lines with the same `tmpItemCode` use the Phase 21 pooled allocation rule unless BUSY provides additional line detail.

## DEC-043: Contractor Name And Mobile Are Immutable After Registration

Decision: After an OWNER registers a contractor, contractor name and mobile number are immutable in production workflows. The contractor photo can be updated. If name or mobile number was entered incorrectly, the retailer should deactivate the contractor and create a new contractor record.

Rationale:

- Contractor mobile number is part of authentication, identity, scan history, rewards, and audit traceability.
- Allowing casual edits to name and mobile number weakens support, audit, reward, and QR dispute handling.
- The Manual UAT 1 feedback explicitly treats editing name and phone number as inappropriate for a production-grade admin portal.

Consequences:

- Admin Web and Admin Mobile edit flows must not expose name/mobile edits after creation.
- Backend mutation APIs must enforce the same rule instead of relying only on hidden UI controls.
- Contractor creation still captures human display name and mobile number.
- Contractor detail screens should show immutable identity fields clearly, with photo update and deactivate/reactivate actions separated from identity display.
- Historical scan, reward, invoice, and audit records continue to display the contractor's persisted `User.displayName` and mobile number.

## DEC-044: Manual UAT 1 Blocks Further Feature Breadth Until Recovery Phases

Decision: Manual UAT 1 findings block further feature breadth. The next work must first produce and execute product-grade recovery phases for BUSY return modeling, Admin Web UX/auth/listing, End-User Mobile UX/history/rewards, and Admin Mobile UX/OWNER operations.

Rationale:

- The same quality gap appears across multiple surfaces: static dashboards, weak list tooling, poor detail layouts, missing drilldowns, hidden or incomplete workflows, and internal IDs in user-facing history.
- Continuing to add features before correcting the product surface would compound rework and drift away from the agentic engineering method.
- The correct response is not only bug fixing; it is tightening the phase contracts, completion gates, and visible UAT criteria.

Consequences:

- `MANUAL_UAT1_TRIAGE.md` is the active recovery input.
- Each recovery phase must include a screen/API contract before code changes.
- Dashboards must be operational surfaces with clickable metrics, shortcuts, drilldowns, and meaningful status.
- Operational lists must include appropriate search, filters, sorting, and detail navigation unless explicitly deferred in the phase plan.
- User-facing histories must show human-readable invoice, product, site, actor, and status metadata instead of raw database IDs.
- UI phases cannot be marked product-complete from rendered shells alone.

## DEC-045: BUSY Return Invoice Allocation Defaults

Decision: Phase 21 uses the following return allocation defaults:

1. If a BUSY return invoice arrives without Admin Mobile scanning the returned product QR and all matching QR units are already scanned, create a review-needed allocation item and do not automatically reverse points.
2. If the original sale invoice has multiple lines with the same `tmpItemCode` and BUSY provides no original line reference, pool allocation by original invoice plus `tmpItemCode`, validate cumulative quantity, and record allocation metadata.
3. If a return invoice arrives without physical QR scan and the matching sale quantity includes both not-yet-printed and printed-unscanned QR units, consume not-yet-printed units first. Printed-unscanned QR units should not be auto-cancelled without the physical QR scan; they become review/cancel candidates only when needed.

Rationale:

- BUSY gives invoice-level return facts, not the exact physical QR label.
- Silent auto-reversal without a physical QR scan risks deducting points from the wrong contractor.
- Pooled item-code allocation is deterministic and lets the build proceed while preserving audit metadata for later reconciliation.
- Not-yet-printed placeholders have no field label, so reducing future print availability is safer than invalidating an already printed label without scanning it.

Consequences:

- Phase 21 must persist return invoices and allocations separately from original sale invoices.
- QR print availability must be reduced by linked return allocations.
- Scanned QR allocations without physical QR scan must create review-needed state, not direct point reversal.
- Admin Mobile remains the exact-unit cancel/reverse surface when the returned product QR is physically scanned.

## DEC-046: Admin Web Product Auth And Phase 22 Defaults

Decision: Phase 22 Admin Web recovery uses real OWNER/STAFF login based on the existing backend `POST /api/auth/admin/login` identity rules. The Admin Web session token is stored only in an HttpOnly, same-site cookie set by a Next.js route handler. Client JavaScript must not store or read the bearer token from `localStorage`, `sessionStorage`, or other browser-readable storage.

Phase 22 also adopts the first-pass Admin Web list search/filter/sort defaults from `PHASE_20_ADMIN_WEB_CONTRACT.md`, and dashboard metrics may share backend calculations with Admin Mobile while using Admin Web-specific drilldown destinations optimized for desk and batch operations.

Rationale:

- The visible dev actor selector is not product-grade authentication and must not appear in product UAT.
- Browser-readable bearer tokens are avoidable for Admin Web and increase exposure if an XSS bug is introduced.
- A small Next.js server-side proxy/BFF lets client components call Admin Web APIs while keeping the bearer token server-side.
- Admin Web and Admin Mobile have different operating contexts: Admin Web is for desk/batch management, while Admin Mobile is for counter/field actions.
- The Phase 20 Admin Web contract already defines practical first-pass list tooling; reopening every field before implementation would slow recovery without improving the first UAT slice.

Consequences:

- Admin Web product path must call Next route handlers for login/logout and backend proxying.
- Protected Admin Web routes must validate session server-side before rendering.
- Dev actor-header mode may remain only as explicit test-only fallback.
- Phase 22A focuses on login/session/shell before dashboard and list redesign.
- Future production hardening still needs failed-attempt throttling, lockout policy, and deployment-specific secure-cookie checks before launch.

## DEC-047: Reward Catalog Management, Stock Reservation, And CSV Import

Decision: Reward catalog content is OWNER-managed operational data, not hardcoded app content. Admin Web Rewards must include OWNER-only catalog management, and Admin Mobile OWNER must receive a mobile-optimized catalog management surface. STAFF can view Reward History where allowed but cannot manage catalog items or fulfill claims.

Reward catalog items use a stable reward code/SKU for CSV upserts and support name, quick description, multiple images, internal reward value in INR, contractor-facing required points, total quantity, and active/inactive/draft readiness. Phase 22F rewards have no tier gate.

Reward images use Supabase Storage for staging/production from Phase 22F onward. DEC-052 later adds a development-only local media mode to avoid Supabase Storage egress during local UAT. Admin Web CSV upload is the v1 CSV surface; Admin Mobile does not need CSV upload and instead supports manual OWNER catalog edits and image management.

Stock availability is derived from claims:

1. `Claim Raised` reserves one reward unit.
2. Contractor cancellation or QR-return claim revocation releases the reserved unit.
3. `Delivered` consumes the unit permanently.
4. Contractor general catalog hides inactive, draft/image-less, and sold-out rewards.
5. Existing contractor-owned claims and history remain visible even if the reward later becomes inactive or sold out.

Rationale:

- The retailer must be able to change the reward list, stock, and images without developer changes.
- Quantity and internal INR value are retailer operations metrics; contractors need required points and reward desirability, not internal procurement value.
- Reserving stock at `Claim Raised` prevents overselling while preserving cancellation/restoration behavior.
- Stable reward codes make CSV updates deterministic and avoid name-based accidental duplicates.
- Requiring at least one image before publish protects the contractor-facing catalog from blank or low-quality reward tiles.

Consequences:

- `RewardCatalogItem` must be expanded and a multi-image model must be added.
- CSV upload must preview validation before commit and leave image-less rows draft/incomplete.
- Supabase Storage must be used for staging/production reward images from Phase 22F. Local/dev media follows DEC-052 and may use `MEDIA_STORAGE_MODE=local` with placeholder read models to control egress.
- Backend redemption must atomically re-check active/image-backed catalog readiness and positive available quantity before creating a claim.
- OWNER cannot reduce total quantity below active reservations plus delivered claims.
- Deactivation hides future browsing but does not mutate existing claims/history.
- Admin Mobile catalog management shares backend APIs/validation with Admin Web, but CSV remains Admin Web-only for v1.

## DEC-048: Reusable Visible Controls For Upload And PIN Entry

Decision: Repeated product controls must use shared visible interaction patterns before a phase can claim product-grade completion. In v1 this applies immediately to device image upload and masked PIN/MPIN entry.

Admin Web image uploads must use a shared visible file-picker button backed by a native browser file input. Admin Mobile image uploads must use the OS media picker with explicit permission, cancellation, error, and readback handling. End-user and admin masked PIN/MPIN fields must include reveal/hide controls unless a future security exception is explicitly approved.

Rationale:

- Contractor photo upload and Reward Catalog image upload failed in separate manual UAT passes because similar controls were implemented differently.
- Hidden-input manipulation or direct API mutation can prove data plumbing but does not prove the user-operable control works.
- PIN/MPIN reveal is a repeated usability requirement that should be built into the first implementation pass, not patched per screen.

Consequences:

- Admin Web upload controls should use the shared file-picker component unless a phase contract documents an exception.
- Visible-control UAT must exercise the actual button/label/toggle users operate.
- Phase status cannot claim upload or PIN/MPIN completion unless each applicable surface is named in verification evidence.
- Native mobile image-picker behavior must be verified on iOS/Android simulator or device before public store-readiness is claimed; Expo Web is only supplemental.

## DEC-049: First-Pass Reports, Exports, And Promotions Defaults

Decision: Phase 22H locks the first-pass Reports and Promotions scope.

Reports are built first, with Promotions as a separate follow-up slice unless reprioritized. Admin Web is the primary Reports surface. Admin Mobile report depth waits for Phase 24 unless a report metric directly blocks the active slice.

First-pass reports prioritize OWNER analytics around QR Print, Scan History, Rewards, and related operations:

1. QR Print Analytics.
2. Scan History Analytics.
3. Rewards Analytics.
4. Contractor Leaderboard.
5. QR Status.
6. Reward Claims.
7. Returns/Reversals.

Manual UAT2 later removed Product/Category Performance and Contractor Deep Dive from the first-pass report library until they have distinct owner use cases. Their useful insights can reappear through focused owner workflows such as ItemCodes analytics and Contractor Site analytics, not as generic report tabs by default.

Reports use date range filters: Today, This Week including today, Last Week, This Month, Last 3 Months, and Custom. QR Print, Scan History, and Rewards reports include status filters. Additional report-specific filters may be added where clearly relevant.

PDF and Excel exports include all relevant columns for the selected report. OWNER can view and export PDF/Excel. STAFF can view reports only and cannot export. WhatsApp report sharing and Hindi report output are not included in the initial reports implementation.

Promotions use simple all-user advertisement banners in Contractor and Team Member dashboard/high-attention placements where they do not interrupt operations or important messaging. First-pass promotions support images, GIFs, or images with animated elements. OWNER manages promotions from a separate `Manage Promotions` section inside Promotions, can upload media, set optional expiry date, edit header overlay text and style, and deactivate promotions. Client Demo 2 adds horizontal marquee text scroller controls with a capped Hindi-safe font list, bold, italic, and color. Tier/city/category/persona targeting and future start scheduling are not included initially.

Rationale:

- OWNER needs operational visibility first, especially around QR printing, scan history, rewards, returns, and product/category performance.
- Reports must be useful on the landing page before drilling into tables, so the Reports tab should show important analytics and insight cards.
- WhatsApp and Hindi output can add product and provider complexity without blocking the first useful Reports slice.
- All-user promotions satisfy the v1 advertisement need without adding premature targeting complexity.
- An optional expiry date supports basic promotion lifecycle control without requiring a campaign scheduler.

Consequences:

- Phase 22H implementation planning must use `PHASE_22H_REPORTS_PROMOTIONS_DECISION_CONTRACT.md` as the source report matrix.
- Backend report/export APIs must enforce STAFF export denial.
- Report export UAT must verify the exported file matches the filtered source rows.
- Promotion management and banner visibility should be implemented as a separate slice after Reports unless explicitly pulled forward.
- Future targeting, WhatsApp share, Hindi reports, and advanced scheduling require new decisions before implementation.

## DEC-050: End-User Scan Uses Persistent Reserved Cart Before Points Credit

Decision: End-user QR earning uses a site-first persistent reserved-cart model. Contractor or Team Member must select/confirm the active site for a scan batch. A successful QR scan validates the token and immediately reserves that QR unit server-side for the contractor/site/cart, but it does not credit points yet. Points are credited only when the contractor presses `Add to account`.

Client Demo 2 tightens the scan-site entry behavior: every visit to Scan QR starts with no active scan-site selected, scanner controls stay hidden until the user selects a site, and successful `Add to account` clears the active scan-site selection for the next batch. This is a UI/workflow reset rule and must not discard retryable reserved-cart items after a technical commit failure.

The reserved cart persists across app visits and is not automatically emptied by a short TTL. Failed scans never enter the cart; they are recorded as failed scan attempts only. If `Add to account` fails because of a technical issue such as network/API failure, the successfully reserved cart items remain in the cart and the contractor can retry `Add to account`.

Once a QR is validly reserved before expiry, the reserved cart item should not be automatically removed because the original printed QR expiry passes later. The only exceptions should be explicit product/security invalidation rules recorded before implementation.

MANUALUAT2A supersedes the earlier 1000-point cart cap. The reserved cart has no point-value cap for v1. High-value QR tokens must reserve successfully if they are valid and the cart/site/session is otherwise eligible. If a cart has reserved items and the user tries to leave the selected site's Scan flow, the app must prompt the user to either press `Add to account` or stay/go back to the Scan flow. This is a UX guard, not a scan rejection rule.

Scan History rows should use human-readable QR/invoice/product references, with full raw IDs available in detail screens and copy support. Failed/already-claimed attempts show `0 credited points`; QR value may be displayed separately as informational value.

Admin Mobile Staff management remains OWNER-only. STAFF users do not receive staff-management mutation controls. After Phase 25F/post-demo correction, STAFF does receive restricted Rewards and Reports entry points.

Rationale:

- Contractors may scan multiple QR labels at a site and should be able to review the batch before crediting.
- A persistent cart prevents loss when the user forgets to press `Add to account` or loses network connectivity.
- Server-side reservation prevents the same QR from being claimed by another contractor while it is in a valid cart.
- The navigation guard prevents forgotten carts without rejecting legitimate high-value QR scans.
- Separating QR value from credited points prevents duplicate/already-claimed attempts from looking like successful credit.

Consequences:

- QR lifecycle needs an intermediate reserved state between printed/reprinted active QR and credited/claimed QR.
- Scan APIs must separate `reserve scanned QR into cart` from `commit reserved cart to points ledger`.
- Points ledger writes happen during `Add to account`, not during initial QR scan reservation.
- Reserved cart rows must survive app restart and session return.
- Reserved cart rows should survive QR expiry after successful reservation unless an explicit invalidation rule applies.
- Failed scan attempts stay visible in Scan History but are never cart items.
- Implementation must define safe behavior for rare invalidation cases where a reserved QR is cancelled/reversed/security-blocked before `Add to account`.
- Backend scan-cap enforcement and cart-cap UI copy must be removed or disabled for v1.
- Output eval must include a high-value QR reservation and commit case above 1000 points, plus a navigation-guard proof when reserved cart items exist.

## DEC-051: Client Demo 2 Becomes Phase 26 Alignment Before New Breadth

Decision: Client Demo 2 changes are a controlled Phase 26 alignment phase, not scattered fixes. Admin Web list/report/reward/promotions corrections, the new ItemCodes tab, and stricter Scan QR site-selection behavior must be implemented with a phase contract, output eval, trajectory eval, visible proof, and stale-doc sweep.

Rationale:

- The demo changes touch multiple source-of-truth areas: Admin Web operations, QR point-rule governance, reward fulfillment freshness, promotions, and mobile scan workflow.
- ItemCodes affects QR point calculation and BUSY integration contracts, so it needs data/API/model decisions before UI implementation.
- Fresh site selection on every Scan visit changes the user workflow even though Phase 25 already implemented site-first scanning; old PASS evidence must not be treated as enough for the tightened behavior.
- Treating demo notes as a phase preserves the agentic-engineering loop: requirements, decisions, implementation, output eval, trajectory eval, then UAT.

Consequences:

- `CLIENT_DEMO_2_TRIAGE.md` is the normalized intake for Phase 26.
- Phase 26A covers Admin Web corrections: Invoice Ledger date range, contractor belongs/association note, contractor site analytics, Reward History date/sort/Claimed/Fulfilled columns, active Claim Desk refresh, system Reward Code, and promotion marquee controls.
- Phase 26B covers ItemCodes master, QR point-rule resolution, dummy seed data, BUSY refresh/manual refresh, status derivation, and Dashboard Attention Queue integration.
- Phase 26C covers Contractor and Team Member fresh site selection on Scan entry and deselection after `Add to account`.
- Phase 26B brought forward and resolved `% of Price` base/rounding and ItemCodes permission questions before coding.

## DEC-052: Development Media Storage Uses Local Placeholder To Control Supabase Egress

Decision: Development and local UAT use `MEDIA_STORAGE_MODE=local` by default. In this mode, reward and promotion media uploads still pass through backend validation, but the API stores/returns one shared local placeholder data URL and masks existing Supabase Storage public URLs in read models. Supabase Storage is enabled only when `MEDIA_STORAGE_MODE=supabase` is explicitly configured for staging or production with server-side credentials.

Rationale:

- The Supabase project exceeded Free plan egress in July 2026, and Phase 27 hit Storage `402 exceed_egress_quota` while uploading a proof reward image.
- Existing Supabase Storage public URLs can keep generating egress when mobile/web clients render reward and promotion images, even if new uploads are stopped.
- Development needs stable reward-image behavior without consuming remote Storage quota or ballooning the database with repeated uploaded images.
- Production still needs a real object-storage path, quota/spend-cap decision, bucket verification, and egress monitoring before launch.

Consequences:

- `.env.example` defaults `MEDIA_STORAGE_MODE=local`.
- Development proofs can pass with local placeholder media if they preserve image-required business rules and record that production Storage readback remains a launch gate.
- Staging/production must explicitly set `MEDIA_STORAGE_MODE=supabase`, provide `SUPABASE_PROJECT_ID` and `SUPABASE_SECRET_KEY` server-side, and verify `reward-images` and `promotion-assets` buckets.
- `SUPABASE_EGRESS_RUNBOOK.md` is the operating guide for diagnosing egress, local development media policy, and production readiness gates.

## DEC-053: Real BUSY Voucher Payloads Normalize Into Existing Import Contracts

Decision: The real BUSY adapter maps BUSY Sale/Return invoice payloads into the existing `BusyInvoiceImport` and `BusyReturnVoucherImport` contracts. An explicit `VchType` value wins over the XML/root wrapper name because BUSY samples may wrap sale-like data in a `<Sale>` root while using `VchType` to identify the effective invoice class.

Sale vouchers accept `VchType = Sale` or numeric sale voucher type `9`. The unique invoice id field is `tmpVchCode`; `VchNo` is the BUSY billing invoice number, not the unique id for Volt Rewards. Sale metadata maps `Date`, `BillingDetails.tmpVchCode`, and `BillingDetails.PartyName`; item lines map `SrNo`, `ItemName`, `tmpItemCode`, `Price`, and `Qty`. The adapter sets actual BUSY sale line `pointsPerUnit` to `0` so ItemCodes remain the authoritative reward-rule source at QR print time.

Return invoices look like sale invoices but have a different `VchType`. They must carry a linked original sale `tmpVchCode` in one of the known return-link fields until BUSY provides the final field name. The link is invoice-level, not line-item-level. Return line mapping uses the returned `tmpItemCode` and `Qty` to identify what item and quantity from the original invoice are being returned; duplicate same-item original lines continue to use the Phase 21 pooled allocation rule unless BUSY provides additional line detail.

Rationale:

- Client-provided `SaleWithRef.txt` uses BUSY fields that differ from the earlier mock invoice contract.
- ItemCodes and QR print-time point freezing are already implemented and must stay the reward-rule source.
- Production BUSY authentication, PUSH sync-agent/retry mechanics, GST/discount semantics, exact return-link field names, and partial/full return samples remain unresolved and should not be silently invented.

Consequences:

- BUSY payload normalization is testable before the production connector exists.
- BUSY developer handoff is PUSH-only and must not include code snippets.
- Non-sale/non-return invoice types are ignored before they create invoices or QR placeholders.
- Actual BUSY imports can reuse the existing persistence, ItemCodes refresh, QR placeholder, and return-allocation paths.
- Production connector work still requires real partial-return, full-return, and auth samples before launch.

## DEC-054: Neon Selected For Test/Staging PostgreSQL

Decision: Phase 31 selects Neon Postgres as the test/staging managed PostgreSQL provider for the next Test API Deployment and BUSY connector testing. The API runtime uses Neon pooled connection strings, while Prisma CLI/migration operations use Neon direct connection strings.

This decision does not select an object-storage provider. Reward and promotion media continue to use `MEDIA_STORAGE_MODE=local` for development/test unless a later phase explicitly verifies a production storage path.

Rationale:

- Volt Rewards uses a custom NestJS backend, Prisma migrations, and custom MPIN/OTP/session logic rather than Supabase Auth, Realtime, Edge Functions, or auto-generated APIs.
- Supabase was being used primarily as managed Postgres plus optional Storage; Supabase Storage already caused egress friction during development.
- Neon fits the current architecture as managed Postgres without requiring Supabase platform-specific assumptions.
- BUSY connector testing needs a stable remote database behind a real Test API, not a local-only database target.

Consequences:

- `NEON_CONNECTION_STRING` is the preferred runtime database URL when present.
- `NEON_DIRECT_URL` is the preferred Prisma CLI/migration database URL when present.
- Leftover Supabase database env vars are treated as fallback only when Neon env vars are absent.
- Production storage remains a separate launch decision and must not be treated as solved by the Neon database migration.

## DEC-055: Test BUSY Connector Uses Public API Deployment With Private Env Secrets

Decision: Phase 32 prepares Volt Rewards API for public HTTPS Test API deployment so the BUSY developer can PUSH voucher and item-master data to backend endpoints. The test connector path supports Vercel as a quick public deployment using root `server.mjs` plus `vercel.json`, and a Docker/container path using `apps/api/Dockerfile` for hosts that run a long-lived Node service.

The shareable BUSY developer document names the public API base URL shape and header names only. Actual connector credentials are generated per environment, configured as server-side deployment env vars, and shared separately from source-controlled documents. The API base URL shared with BUSY must include the `/api` prefix, for example `https://<volt-test-api-host>/api`.

Rationale:

- BUSY integration is PUSH-only and needs a remotely reachable HTTPS receiver, not localhost.
- The backend must remain the integration boundary; BUSY must not write directly to Neon/PostgreSQL.
- Secrets such as Neon URLs, JWT/QR secrets, Vercel tokens, and BUSY API keys must not be embedded in Markdown/PDF handoffs.
- Vercel can provide a fast test endpoint, while the Docker path keeps the API portable if a container host is preferred for staging/production.

Consequences:

- A public Test API URL is not considered ready until deployment env vars are configured and `/api/health` plus authenticated `/api/integrations/busy/v1/health` checks pass.
- Vercel project/env setup remains an operational deployment step because the current connector can deploy but does not expose env-var write operations.
- `MEDIA_STORAGE_MODE=local` remains acceptable for BUSY connector testing because voucher/item ingestion does not require object storage.
- Production hosting remains a separate launch-hardening decision; Phase 32 only resolves the test connector deployment path.

## DEC-056: Railway Selected For Test API Deployment

Decision: On 2026-07-18, Railway replaces Vercel as the selected public HTTPS Test API host for BUSY connector testing. Neon remains the managed PostgreSQL database. The repo uses root `railway.json` to tell Railway to build with `apps/api/Dockerfile` and health-check `/api/health`.

Rationale:

- Volt Rewards API is a normal Nest/Fastify backend with Prisma/Postgres access and server-to-server BUSY PUSH endpoints.
- Railway's service/container model aligns better with a long-running Node API than a serverless-first deployment shape.
- Railway service variables support the private env vars we need without embedding Neon URLs, JWT/QR secrets, GitHub tokens, or BUSY API keys in source-controlled files.

Consequences:

- BUSY test base URL should be the Railway public domain with `/api`, for example `https://<volt-railway-test-domain>/api`.
- The BUSY developer receives only the base URL and connector headers/values, not database or deployment secrets.
- A public Railway URL is not considered ready until Railway variables are configured and both `/api/health` and authenticated `/api/integrations/busy/v1/health` pass.
- Vercel-specific deployment artifacts are removed from the active repo path to avoid mixed deployment signals.
