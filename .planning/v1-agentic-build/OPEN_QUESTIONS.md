# Open Questions - Volt Rewards V1

Source: `app-requirementsV1.md`

These questions must be resolved or explicitly deferred before implementation reaches the affected slice. They do not all block the next engineering step. The agentic build rule is: each phase must either resolve its relevant questions or record an explicit assumption/mock boundary before implementation.

## Question Governance Rule

Before implementation starts for any phase, the active phase plan must include a phase-specific open-question review.

The agent must:

1. Read this file and extract only the questions that affect the current phase.
2. Classify each relevant question as blocking before implementation, needed before completion, or safe to defer with an explicit assumption.
3. Bring blocking and completion-relevant questions to the user before making the decision.
4. Record the user's answer in this file and, when durable, in `architecture/DECISIONS.md`.
5. Record temporary assumptions or mock boundaries in the active phase plan and phase completion notes.

The agent must not silently decide product behavior, provider choices, user experience defaults, reward rules, data-retention behavior, or production security policy unless the decision is already locked in `architecture/DECISIONS.md`.

## Current Triage

### Resolved For Current Build Direction

| Question | Resolution | Reference |
| --- | --- | --- |
| Which cross-platform mobile framework should be used? | Expo/React Native. | `architecture/DECISIONS.md` DEC-003 |
| Which backend/database stack should be used? | NestJS backend API and PostgreSQL database. | `architecture/DECISIONS.md` DEC-005, DEC-006 |
| Should first implementation include production BUSY integration? | No. Build with the mock BUSY adapter and replace it with the production connector when actual BUSY API details arrive. | `architecture/DECISIONS.md` DEC-007 |
| OWNER/STAFF reward fulfillment conflict from older docs | Use `app-requirementsV1.md`: OWNER-only reward fulfillment. | `architecture/DECISIONS.md` DEC-008 |
| Admin Web vs Admin Mobile workflow split | Admin Web supports all non-camera OWNER/STAFF admin workflows; returned-product QR status scan/cancel/reverse stays Admin Mobile only in v1. | `architecture/DECISIONS.md` DEC-016 |
| Does real BUSY API integration block the full product build? | No. Build the full product against the mock BUSY adapter and replace the adapter when actual BUSY API details are available. | `architecture/DECISIONS.md` DEC-017 |
| Should BUSY write directly to our PostgreSQL database? | No. BUSY should push sale invoice, return invoice, and item master facts to backend ingestion APIs; the backend writes to PostgreSQL. | `architecture/DECISIONS.md` DEC-018, `client-deliverables/BUSY_API_INTEGRATION_SPEC.md` |
| How does Forgot MPIN work? | Contractor contacts retailer/admin; OWNER resets a temporary MPIN valid for 5 days; contractor should set their own MPIN after login. OWNER reset must exist on Admin Web and Admin Mobile. | `architecture/DECISIONS.md` DEC-019 |
| Does Team Member need a saved profile? | No for v1. Team Member is a temporary session actor; scan attempts store team member mobile/session/device context for history and audit. | `architecture/DECISIONS.md` DEC-020 |
| Is phone contacts access required for Team Member login? | No. It is optional convenience for selecting contractor mobile number. Manual entry must work. | `architecture/DECISIONS.md` DEC-020 |
| Is site selection mandatory before QR scan? | Yes. Contractor and Team Member must select an active site before scanning. | `architecture/DECISIONS.md` DEC-021 |
| Does BUSY decide QR cancel/reverse effects? | No. BUSY sends sale invoice and linked return invoice facts keyed by `tmpVchCode`; Volt Rewards decides QR lifecycle and points effects. A full return invoice contains all original sale lines. | `architecture/DECISIONS.md` DEC-023 |
| Are rewards points or rupees? | Superseded 2026-07-10 by MANUALUAT2A: ledger and user-facing QR/reward/balance copy use points. INR is reserved for actual monetary fields such as invoices and admin-only reward value. | `architecture/DECISIONS.md` DEC-024 |
| What mobile design direction should the end-user app use? | Use client-approved Stitch screenshots in `Sample_References/Screenshots from Stitch/` as the primary mobile visual direction. PayTM/PhonePe-style patterns are now secondary background context only. | `architecture/DECISIONS.md` DEC-040, `APPROVED_STITCH_UI_CONTRACT.md` |
| Should Hindi/English be included from the first mobile shell? | Yes. Hindi/English toggle exists from day one, with mobile copy routed through localization resources. | `architecture/DECISIONS.md` DEC-028 |
| What scan history should Contractor and Team Member see? | Contractor sees full contractor scan history across all sites and Team Member scans. Team Member sees only scans for sites they scanned for or attempted to scan for within allowed scope. | `architecture/DECISIONS.md` DEC-029 |
| How should Team Member Recent contractor behave? | At most one recent contractor, shown only after successful OTP login, stored securely as local convenience state, with clear/remove control, and never bypassing OTP. | `architecture/DECISIONS.md` DEC-030 |
| Should mobile apps be store-ready from day one? | Yes. Mobile implementation must remain compatible with public Play Store and App Store launch from the start. | `architecture/DECISIONS.md` DEC-031 |
| What is the reward catalog/tier direction for v1? | Use a configurable reward catalog with realistic physical rewards such as toolbox and air fryer. Tiers are Silver, Gold, Platinum, and Diamond. Tiers unlock sets of rewards based on total points collected and points available. | `architecture/DECISIONS.md` DEC-032 |
| How do total accumulated points, available points, reward cancellation, fulfillment, and negative balance work? | Total accumulated points are lifetime gross and do not decrease on reversal. Points Available is current redeemable balance. Contractor can cancel until OWNER marks Fulfilled/Delivered after OTP entry. Fulfilled reward stays fulfilled if a later return creates negative balance. | `architecture/DECISIONS.md` DEC-033 |
| How are QR scan reward points calculated for v1? | QR scan reward points are resolved from managed BUSY `TempItemCode` / `tmpItemCode` reward rules at QR print time and copied onto printed QR units. ItemCodes support exactly one active rule: `Absolute Points` or `% of Price` using latest synced ItemCode `Price`, rounded to the nearest integer. Printed QR labels show `Collect X points`. | `architecture/DECISIONS.md` DEC-034, `CLIENT_DEMO_2_TRIAGE.md` |
| Does the current contractor schema need a new name column? | No for current requirements. The contractor's user-facing human name is `User.displayName`. Add separate legal/business/display fields only if a future approved identity requirement needs them. | `architecture/DECISIONS.md` DEC-035 |
| Can a single-screen mobile shell be treated as product-complete? | No. A shell can validate APIs, but product completion requires real navigation, back behavior, dashboard landing, product-like data, reward media, and product-grade UAT. | `architecture/DECISIONS.md` DEC-036 |
| What is the Phase 16 Contractor navigation decision? | Keep top-level Contractor tabs as Dashboard/Home, Scan, History, and Rewards. Sites/Profile/Help are reached from dashboard/profile/menu actions rather than adding another bottom tab. | `architecture/DECISIONS.md` DEC-037 |
| What is the Phase 16 Team Member landing decision? | Use a scan-first limited dashboard/screen with contractor identity, selected-site context, Scan QR, and allowed Scan History. | `architecture/DECISIONS.md` DEC-037 |
| What reward image source should development use before final client imagery? | Phase 16 used replaceable temporary generated/catalog images via `RewardCatalogItem.imageUrl`; Phase 22F upgrades the catalog to OWNER-managed multi-image media without changing reward ledger logic. | `architecture/DECISIONS.md` DEC-037, DEC-047 |
| How are BUSY sales returns represented? | BUSY creates a new return invoice that looks like a sale invoice but has a different `VchType`; the original sale invoice does not change. The return invoice links to the original invoice at invoice level, and Volt Rewards allocates returned quantities by original invoice + returned `tmpItemCode` + returned `Qty`. | `architecture/DECISIONS.md` DEC-042 |
| Can contractor name and mobile number be edited after registration? | No. Name and mobile number are immutable after registration. Photo can be updated; wrong identity data should be handled by deactivation and new registration. | `architecture/DECISIONS.md` DEC-043 |
| Does Manual UAT 1 allow further feature breadth? | No. Manual UAT 1 created a product-grade recovery gate before broadening features. | `architecture/DECISIONS.md` DEC-044, `MANUAL_UAT1_TRIAGE.md` |
| How should BUSY return invoices allocate when exact physical QR is unknown? | Create review-needed state for scanned QR without physical scan; pool duplicate same-item lines by invoice + item code; consume not-yet-printed units before printed-unscanned units. | `architecture/DECISIONS.md` DEC-045 |
| How should Admin Web product authentication and Phase 22 defaults work? | Use backend OWNER/STAFF admin login, store the Admin Web session token only in HttpOnly same-site cookie via Next route handler, proxy Admin Web API calls server-side, use Phase 20 list-control defaults, and optimize dashboard drilldowns for desk/batch operations. | `architecture/DECISIONS.md` DEC-046 |
| How should OWNER-managed reward catalog, stock, CSV, and images work? | Reward catalog is OWNER-managed operational data. Admin Web gets catalog management with CSV preview/commit. Admin Mobile OWNER gets mobile catalog management. `Claim Raised` reserves stock, cancellation/revocation releases stock, Delivered consumes stock, and inactive/draft/sold-out rewards are hidden from general contractor catalog. | `architecture/DECISIONS.md` DEC-047 |
| What did Client Demo 2 change for Admin Web and scanning? | Admin Web needs Invoice Ledger date range, contractor belongs/association note, site analytics, Reward History date/sort/claimed/fulfilled columns, auto-refreshed active Claim Desk, system reward codes, promotion marquee controls, and a new ItemCodes tab. Contractor and Team Member Scan QR require fresh site selection on every Scan visit and after `Add to account`. | `CLIENT_DEMO_2_TRIAGE.md`, `architecture/DECISIONS.md` DEC-051 |
| Does STAFF Admin Mobile have Reports and Rewards tabs? | Yes after Phase 25F/post-demo correction. STAFF has Dashboard, Return Scan, Contractors, Rewards, and Reports with restricted/read-only behavior; STAFF still cannot manage staff, fulfill rewards, export reports, or mutate protected data. | `REQUIREMENTS_LEDGER.md` MADM-010, `architecture/DECISIONS.md` DEC-038 |

### Still Blocking Before Specific Slices

| Area | Blocks | Current Handling |
| --- | --- | --- |
| Hosting provider | Deployment architecture and CI/CD release setup | Resolved only for Test API/BUSY connector testing by Phase 33: Railway for public HTTPS Test API, Neon for DB, Dockerfile build path. Production hosting and CI/CD release hardening remain open. |
| Real BUSY fields/sample data | Only the real BUSY connector implementation and production ItemCodes refresh | `SaleWithRef.txt` received and Phase 28 maps Sale/Return payloads into existing import contracts; `tmpVchCode` is confirmed as the unique invoice id field. Phase 29 created `client-deliverables/BUSY_DEVELOPER_API_HANDOFF.md` for the BUSY developer and revised it to be PUSH-only with no code snippets. Still need partial return sample, full return sample containing all original sale lines, duplicate-line matching behavior, GST/discount semantics, item master/change feed for TempItemCodes, production price semantics beyond the mapped line `Price`, exact return-link field naming, and PUSH sync-agent/auth answers. |
| OTP/SMS provider | Real contractor OTP, Team Member OTP, welcome SMS, reward fulfillment OTP | Phase 13 implements mock SMS/local delivery for Contractor temporary MPIN and Team Member OTP. Production provider remains open. |
| MPIN/OTP lockout and rate limits | Production auth hardening | Phase 13 implements persisted sessions/challenges and hashed secrets; production throttling/lockout defaults remain open before launch. |
| Team Member mobile identity | Future durable Team Member profile features only | v1 uses temporary session identity; scan history stores team member mobile/session context without a saved user profile. |
| Site deletion/archive behavior | None for current site implementation | Resolved: sites with scans are archived/inactivated, not hard-deleted. Phase 12 implements soft archive. |
| Site field model | Future controlled-list/location refinement only | Phase 12 uses free-text site fields: client name, flat/apartment, building, area, and city. |
| Reward catalog/tier rules | Final commercial reward catalog values | Direction resolved for Milestone 5. Exact production catalog item list, tier thresholds, and item point costs remain configurable content to finalize with client. |
| Reward image storage | Phase 22F reward catalog management and production launch | Resolved for production direction: image-backed reward catalog uses object storage, currently Supabase Storage. Resolved for development after DEC-052: use `MEDIA_STORAGE_MODE=local` with one placeholder image unless a phase explicitly verifies the Supabase path. |
| Supabase Storage quota | Reward catalog image upload, fresh active reward-claim fulfillment proof, and launch readiness for image-backed rewards | Phase 27 proof on 2026-07-15 hit Supabase Storage `402 exceed_egress_quota`. Development can proceed with `MEDIA_STORAGE_MODE=local`, which avoids new Storage uploads and masks existing Supabase Storage media URLs. Production/staging still require quota/spend-cap resolution and Supabase upload/readback verification. |
| Admin Mobile CSV upload | Phase 22F reward catalog management | Resolved for Phase 22F: CSV upload is Admin Web-only for v1; Admin Mobile OWNER supports manual catalog edit/image/deactivate, not CSV. |
| Reward tier gate optionality | Phase 22F reward catalog management | Resolved for Phase 22F: no tier gate for rewards in this slice. |
| Reward claim revocation on QR reversal | Phase 19 Admin Mobile reverse completion | Resolved: deduct QR points first; if Points Available becomes negative, revoke newest chosen/unfulfilled claims until the balance is non-negative or no chosen claims remain. Fulfilled claims stay fulfilled and any remaining deficit remains negative balance. |
| Report filters/columns/export format | Reports slice | Resolved for first-pass reports in `PHASE_22H_REPORTS_PROMOTIONS_DECISION_CONTRACT.md`: date range filters, relevant status filters, all relevant report columns, PDF/Excel export, no WhatsApp, no Hindi output. |
| Promotion placement/targeting | Promotions slice | Resolved for first-pass promotions in `PHASE_22H_REPORTS_PROMOTIONS_DECISION_CONTRACT.md`: all-user banners, dashboard/high-attention placements, image/GIF/animated image assets, optional expiry date, no future scheduler, no targeting. |
| Contractor photo media storage | Production contractor profile photo upload | Local Admin Web uses device upload preview, compresses selected images to small profile-image data URLs, and stores that value in `photoUrl`; production should use object storage/media service. |
| Staff profile field expansion | Future staff profile editing/Admin Mobile expansion slice | Phase 11 foundation uses name and mobile number only. Additional staff metadata and edit-mobile behavior remain open. |
| Managed PostgreSQL provider | Runtime E2E gates for Admin Web/API/database slices | Resolved for Test API/UAT path on 2026-07-17 by Phase 31: use Neon Postgres with pooled runtime URL and direct Prisma migration URL. Supabase database env vars remain fallback only when Neon env vars are absent. Production launch still needs hosting/deployment runbook and TLS/backup checks. |
| Frontend experience contract | Every new mobile/web UI slice | A screen contract and quality review are required before a UI-bearing slice can be considered product-complete. Use `FRONTEND_EXPERIENCE_STANDARD.md`, `PRODUCT_GRADE_PLATFORM_STANDARD.md`, and the relevant project skills. |
| Product-grade mobile navigation | Next end-user mobile correction phase | Resolved for Phase 16: Contractor top tabs are Dashboard/Home, Scan, History, Rewards; Sites/Profile/Help come from dashboard/profile/menu actions; Team Member landing is scan-first and limited. |
| Reward catalog images/assets | Product-grade rewards catalog phase | Resolved for Phase 22F: use OWNER-managed multi-image catalog media backed by Supabase Storage bucket `reward-images`; final client imagery remains content, not architecture. |
| Client-facing seed/UAT data | Next product-grade UAT/demo phase | Replace placeholder user/site/reward labels with realistic human names, real-looking sites, electric-shop products, and reward content before client-facing screenshots or demos. |
| Store listing assets, legal copy, and developer account ownership | Final App Store / Play Store submission | Implementation must stay store-ready from day one, but final listing metadata, screenshots, privacy policy/legal copy, and account transfer details can be handled in launch hardening. |
| Admin Mobile app boundary | Admin Mobile baseline | Resolved for Phase 17: build `Volt Admin` as a separate Expo app workspace, not as a mode inside the end-user app. |
| Admin Mobile auth mechanism | Admin Mobile baseline | Resolved for Phase 17: OWNER/STAFF use backend PIN login and bearer sessions; Admin Mobile must not rely on Admin Web dev actor headers. |
| Admin Mobile STAFF Reports tab | Admin Mobile baseline and Phase 25F correction | Superseded after Phase 25F/post-demo correction: STAFF has Dashboard, Return Scan, Contractors, Rewards, and Reports with restricted/read-only behavior. Staff management remains OWNER-only. |
| ItemCodes `% of Price` rule | Phase 26B ItemCodes implementation | Resolved 2026-07-15: use latest synced ItemCode `Price` as the base; support fractional percent values such as `1%`, `2%`, `0.5%`, `0.25%`; UI enforces exactly one editable reward rule per ItemCode, either `Absolute Points` or `% of Price`. |
| ItemCodes permissions | Phase 26B ItemCodes implementation | Resolved 2026-07-15: OWNER can edit ItemCode reward rules; STAFF is read-only. |
| Contractor belongs/association field label | Phase 26A Admin Web correction | Bring forward during UI copy pass. The field itself is required; final label and helper copy remain open. |
| Mobile design reference gate | Phase 27 Mobile Native And Visual Readiness Closure | Resolved for Phase 27: approved Stitch screenshots are primary; PhonePe, Google Pay India, Paytm, and CRED are secondary pattern checks only. See `evals/phase27/DESIGN_REFERENCE_APPENDIX.md`. |
| OWNER reward fulfillment placement | Admin Mobile baseline | Resolved for Phase 17 baseline: surface from OWNER Dashboard first per `MADM-012`; dedicated screen/tab can be reconsidered after UAT. |
| STAFF mobile-number editing | Admin Mobile baseline | Deferred: current shared foundation supports create/reset PIN/deactivate/reactivate; staff mobile edits remain a future profile-expansion decision. |

### Safe To Proceed Now

We can proceed with the backend API shell and persistence interfaces if we keep these boundaries:

- BUSY integration remains an adapter interface with mock implementation. This does not block the full product build.
- OTP/SMS remains a mock/local delivery boundary until provider selection.
- Hosting remains undecided.
- Contractor auth now has persisted bearer sessions, temporary MPIN reset/setup/change, and mock SMS delivery; production lockout/rate-limit rules remain to be set.
- Team Member auth now has OTP challenge/verify, persisted temporary bearer sessions, and mock SMS delivery; secure local Recent storage remains a mobile UI task with one clearable recent contractor after successful OTP login.
- Reports and promotions are not finalized beyond current draft contracts until their questions are resolved.
- Backend/API foundations may proceed only as foundations. User-facing workflows are not product-complete until the corresponding mobile/web experience contract, frontend implementation, and visible-control UAT pass.
- End-user mobile implementation can proceed only through the product-grade correction gate in `PHASE_16_EXECUTION_PLAN.md` before broadening to new feature areas.

## Next Phase Bring-Forward Queue

For Phase 21 BUSY return-voucher domain correction, bring forward before implementation:

1. [Resolved] If a return invoice arrives without Admin Mobile scanning the returned product QR and all matching QR units are already scanned, Volt Rewards creates a review-needed item and does not auto-reverse points.
2. [Resolved] If an original sale invoice has duplicate lines with the same `tmpItemCode` and BUSY provides no original line reference, allocation may pool by invoice + item code with audit metadata.
3. [Resolved] If a return invoice arrives without scanned physical QR, not-yet-printed units are consumed before printed-unscanned units.

For Phase 22 Admin Web product-grade recovery, bring forward before implementation:

1. [Resolved] Use the first-pass filter/sort/search fields in `PHASE_20_ADMIN_WEB_CONTRACT.md`.
2. [Resolved] Admin Web uses the same OWNER/STAFF mobile + PIN identity rules as Admin Mobile, with Admin Web token stored in HttpOnly same-site cookie through a Next route handler.
3. [Resolved] Admin Web and Admin Mobile may share backend metric calculations, but Admin Web drilldowns optimize separately for desk/batch operations.

For Phase 23 and Phase 24 mobile recovery, bring forward before implementation:

1. [Resolved for Phase 23 default] Use first-pass filters/sorts/search fields in `PHASE_20_MOBILE_CONTRACT.md`; Phase 23 implements local first-pass filtering where backend parameters are not yet available and only expands backend filters when needed.
2. [Resolved for Phase 23 default] Native iOS and Android validation is required before store-ready/public-launch readiness is claimed; Expo Web is only supplemental UAT.
3. [Resolved for Phase 23 default] Mock OTP display and manual QR token entry are local/dev-only and must be hidden in production builds through shared runtime gating.

For Phase 26 Client Demo 2 alignment (`PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`), bring forward before implementation:

1. [Resolved] Admin Web requires Invoice Ledger date range, contractor belongs/association text area, contractor site analytics, Reward History date/sort/Claimed/Fulfilled columns, active Claim Desk auto-refresh, system-populated Reward Code, promotion marquee controls, and ItemCodes tab.
2. [Resolved] Contractor and Team Member Scan QR must start with no default scan-site selected every time the Scan workflow is entered. Scanner controls appear only after site selection, and `Add to account` clears the active scan-site selection for the next batch.
3. [Resolved 2026-07-15] `% of Price` point-rule base is latest synced ItemCode `Price`. Fractional percent values are allowed.
4. [Resolved 2026-07-15] `Absolute Points` and `% of Price` cannot both be populated; exactly one editable reward rule is enforced per ItemCode.
5. [Resolved 2026-07-15] OWNER edits ItemCode reward rules; STAFF is read-only.
6. [Needed before completion for Phase 26A] Confirm final label/helper copy for contractor belongs/association text area.

For Phase 27 Mobile Native And Visual Readiness Closure (`PHASE_27_MOBILE_NATIVE_VISUAL_READINESS_PLAN.md`), bring forward before implementation:

1. [Resolved for Phase 27] Approved Stitch screenshots are the primary client visual direction.
2. [Resolved for Phase 27] External pattern checks are PhonePe, Google Pay India, Paytm, and CRED, used only for workflow/design heuristics and never for copied branding/assets.
3. [Completion relevant] Native iOS/Android proof requires an available simulator/device/toolchain; otherwise record the exact blocker and do not claim store-readiness.
4. [Resolved for development on 2026-07-16] Local/no-network media path is configured through `MEDIA_STORAGE_MODE=local`; production Supabase Storage quota/spend-cap and upload/readback remain launch gates.

For Phase 28 BUSY Adapter Payload Hardening (`PHASE_28_BUSY_ADAPTER_HARDENING_PLAN.md`), bring forward before implementation:

1. [Resolved for Phase 28] `SaleWithRef.txt` sale fields map into `BusyInvoiceImport` using `Date`, `BillingDetails.tmpVchCode`, `BillingDetails.PartyName`, `SrNo`, `ItemName`, `tmpItemCode`, `Price`, and `Qty`.
2. [Resolved for Phase 28] Explicit `VchType` wins over a BUSY XML/root wrapper name, so Return can be detected even if BUSY wraps the payload as `<Sale>`.
3. [Resolved for Phase 28] Actual BUSY adapter lines keep `pointsPerUnit = 0`; ItemCodes remain the reward-rule source and QR points freeze at print time.
4. [Deferred to production connector] Need exact return-link field name from real partial/full return samples; Phase 28 supports known aliases without locking a final BUSY field.
5. [Deferred to production connector] Need production auth/PUSH sync-agent/retry details, discount/GST detail, and item-master/change-feed samples.

For Phase 29 BUSY Developer API Handoff (`PHASE_29_BUSY_DEVELOPER_HANDOFF_PLAN.md`), bring forward before implementation:

1. [Resolved for Phase 29] Create a shareable BUSY developer requirements document using exact `SaleWithRef.txt` field names.
2. [Resolved for Phase 29] Link the new handoff from the deeper BUSY API integration spec.
3. [Resolved 2026-07-17] Integration handoff is PUSH-only; Volt Rewards will not pull from BUSY.
4. [Resolved 2026-07-17] Shareable BUSY developer handoff must not include code snippets.
5. [Resolved 2026-07-17] `tmpVchCode` is the unique invoice id field.
6. [Resolved 2026-07-17] `VchNo` is the BUSY billing invoice number, not the unique invoice id.
7. [Resolved 2026-07-17] BUSY return/partial return is a new invoice with different `VchType`; the original sale invoice is not edited, and the link to original sale is invoice-level, not line-item-level.
8. [Deferred to BUSY developer response] Confirm whether PUSH needs a local sync-agent/service and how retries/outbox work.
9. [Deferred to BUSY developer response] Confirm stable line identity, return-link field, item master change feed, and `% of Price` price-base semantics.

For the immediate product-grade mobile correction phase, bring forward before implementation:

1. [Resolved] Contractor top-level tabs stay Dashboard/Home, Scan, History, and Rewards; Sites/Profile/Help are reached from dashboard/profile/menu actions.
2. [Resolved] Team Member uses a scan-first limited dashboard/screen with contractor identity and site context.
3. [Resolved] Development reward assets use replaceable temporary generated/catalog images through `RewardCatalogItem.imageUrl`.
4. [Resolved for current scope] Contractor identity needs only human display name now; future legal/business/shop name fields are planned only if later approved.
5. [Phase implementation task] Rename client-facing seed/UAT records to realistic human/site/product/reward data while preserving test-only fixture labels where needed.

For future end-user mobile hardening phases, the previously blocking Phase 14 questions are resolved:

1. Use the approved Stitch screenshots in `Sample_References/Screenshots from Stitch/` as the primary mobile UI/UX direction; Phase 14's PayTM/PhonePe guidance is now historical/secondary context.
2. Include Hindi/English toggle from day one.
3. Contractor sees full contractor scan history across sites and Team Member scans; Team Member sees only site/session-attributed history they scanned or attempted.
4. Team Member sees one recent contractor only after successful login, with clear/remove control.
5. Keep implementation App Store and Play Store ready from the start.

For the next production auth-hardening phase, bring forward before implementation:

1. MPIN/OTP failed-attempt limits.
2. Lockout duration and reset process.
3. SMS/WhatsApp provider choice.
4. Production OTP/temporary MPIN message copy.

## Critical Before Architecture Lock

1. [Resolved] Which exact cross-platform mobile framework should be used? Expo/React Native.
2. [Resolved for Test API/UAT database] Backend is NestJS and database engine is PostgreSQL. Phase 31 selected Neon Postgres for test/staging database use. API hosting and production object storage remain separate deployment decisions.
3. [Resolved] Is the first implementation expected to include production BUSY integration, or should v1 start with mock/sample BUSY import and later connector? Build the full product with mock/sample BUSY adapter; production connector follows real sample data without blocking product build.
4. [Partially resolved/blocking for real BUSY connector] Real sale invoice sample received in `SaleWithRef.txt`; `tmpVchCode` is the unique invoice id field. Phase 28 maps the received Sale shape and return aliases into the existing import contracts. Still need partial return, full return, exact return-link field, line matching, discount, GST detail, item-master/change-feed, and authentication/sync-agent samples from BUSY developer.
5. [Deferred/blocking for production OTP/SMS] What OTP/SMS provider should be used for contractor OTP and welcome messages? Phase 13 uses mock/local delivery only.

## Auth And MPIN

1. [Resolved] Forgot MPIN resets through retailer/admin support; current MPIN is not recovered or shown.
2. [Resolved] Temporary reset MPIN is valid for 5 days.
3. [Resolved] OWNER can reset contractor MPIN from Admin Web and Admin Mobile.
4. What lockout/rate-limit rules apply after failed MPIN or OTP attempts? Phase 13 does not enforce production throttling.

## Team Member

1. [Resolved] Team Member uses temporary session identity, not a saved profile in v1.
2. [Resolved] Team Member mobile number is captured during OTP/session flow and persisted on scan attempts for history/audit.
3. [Resolved] Phone contacts access is optional convenience, not mandatory.
4. [Resolved for Phase 12 API] Scan History endpoint returns persisted scans for the selected contractor with filters. Mobile UI default may still narrow to current daily session later.
5. [Resolved for Phase 14 UI] Contractor sees full contractor scan history across sites and Team Member scans. Team Member sees only scans for sites they scanned for or attempted to scan for within allowed scope.
6. [Resolved for Phase 13 API] Team Member OTP request/verify creates a temporary bearer session scoped to contractor and expiring at the end of the current server-local day.

## Sites

1. [Resolved] Site selection is mandatory for every scan, including Team Member scans.
2. [Resolved for Phase 12 foundation] No default-site bypass; scans require an active selected site. Revisit only if client explicitly approves default-site behavior.
3. [Resolved] Sites with scan history should be archived/inactive, not hard-deleted.
4. [Resolved for Phase 12 foundation] Site fields are free text. Controlled city/area lists remain a future refinement.

## QR And BUSY

1. Which product categories are QR eligible?
2. [Resolved by Client Demo 2 ItemCodes direction] Every printed unit gets the reward value resolved from its BUSY ItemCode rule at QR print time. The rule is exactly one of `Absolute Points` or `% of Price` using latest synced ItemCode `Price`; printed QR value must be frozen.
3. What data should be printed on the QR label besides the QR code?
4. What printer and label format are required?
5. [Resolved 2026-07-17] The all-lines case is a full return invoice containing all original sale line items and quantities. Volt Rewards then applies the existing return allocation and Admin Mobile exact-unit cancel/reverse rules.
6. [Resolved for primary allocation] For partial returns, return quantity maps against original invoice + `tmpItemCode` and local QR state. Cancel active unscanned units first; reverse scanned/claimed units only for returned quantity that cannot be covered by unscanned units. Duplicate original lines with the same `tmpItemCode` remain a matching-risk question.
7. Can expired QR be manually overridden by OWNER?
8. [Resolved 2026-07-17] BUSY integration is PUSH-only; polling/pull is not part of the current handoff. Need BUSY developer to confirm whether a local sync agent/service is required to perform PUSH reliably.
9. [Resolved 2026-07-17] `tmpVchCode` is the unique invoice id field.
10. Can BUSY provide one sample each for partial return invoice and full return invoice containing all original sale line items and quantities?
11. Are GSTIN, customer address, customer mobile, HSN/SAC, CGST, SGST, IGST, item brand, and item category available in the BUSY API?
12. What exact item-level discount field should be used, and can BUSY provide net unit price after discount directly?
13. Can BUSY provide an item master API/change feed for newly added `tmpItemCode` values?
14. [Resolved for v1 default] If the original sale invoice has multiple lines with the same `tmpItemCode` and BUSY provides no original line reference, Volt Rewards allocates by item code across all matching lines and records audit metadata.
15. What exact BUSY field on the return invoice stores the original sale `tmpVchCode`? Phase 28 supports known aliases, but production connector completion still needs the final field name from a real BUSY return sample.

## Rewards

1. [Resolved for Phase 15 direction] Reward catalog is configurable and may use mock physical items such as toolbox and air fryer until final client catalog is approved.
2. [Resolved for Phase 15 direction] Tiers are Silver, Gold, Platinum, and Diamond. Tiers unlock sets of rewards based on total points collected and available points; exact thresholds are configurable catalog/business data.
3. [Resolved] "Total points accumulated till date" is lifetime gross and does not decrease when points are later reversed.
4. [Resolved] "Points Available" is current redeemable balance.
5. [Resolved] Contractor-facing reward statuses are `Locked`, `Get Now`, `Claim Raised`, and `Delivered`; cancelled/revoked states are historical lifecycle events and not active Claim Desk statuses.
6. [Resolved] A contractor can cancel a chosen reward after OTP has been initiated but before OWNER marks the reward Fulfilled/Delivered.
7. [Resolved] If a physically delivered reward is followed by return/QR reversal, the reward stays fulfilled and available balance may become negative.
8. [Superseded 2026-07-10] Contractor-facing display may show reward points as rupee value using 1 point = Rs. 1. MANUALUAT2A now requires points-only copy for QR value, reward cost, balances, scan cart, and Scan History.
9. [Resolved for v1] QR reward calculation uses a configurable BUSY `TempItemCode` / `tmpItemCode` ItemCodes table. Until BUSY API exists, use the dummy list with `Absolute Points` and blank `% of Price`.
10. [Resolved 2026-07-15] `% of Price` uses the latest synced ItemCode `Price` field.
11. [Resolved 2026-07-15] Fractional percentages are allowed. Implementation rounds the final point value to the nearest integer unless a later client decision changes rounding.
12. [Resolved] When QR points are reversed and the contractor has one or more `CHOSEN` but unfulfilled reward claims, deduct QR points first. If `Points Available` becomes negative, revoke newest chosen/unfulfilled claims until balance is non-negative or no chosen claims remain. Fulfilled claims remain fulfilled and any remaining deficit stays as negative balance.
13. [Resolved] Reward catalog is OWNER-managed. Admin Web must support catalog management and CSV import; Admin Mobile OWNER must support catalog management; STAFF cannot manage catalog.
14. [Resolved] Catalog quantity is reserved when a contractor raises a claim, released on cancellation/revocation, and consumed on Delivered.
15. [Resolved] Contractor general catalog hides inactive, draft/image-less, and sold-out rewards, while existing active claims/history remain visible.

Open content still needed before production launch:

- Final reward catalog item list, images, point costs, and tier requirements.
- Final Silver/Gold/Platinum/Diamond threshold values.
- Final `tmpItemCode` to points mapping, including behavior for unmapped or ineligible item codes.
- Final client-approved reward images/content; production storage is currently Supabase Storage unless a future production deployment decision changes it. Development uses DEC-052 local placeholder media by default.
- [Resolved for Phase 22F] Reward catalog CSV template is `rewardCode,rewardName,quickDescription,rewardValueInr,pointsRequired,quantity,status`; CSV remains Admin Web-only.

## Admin Mobile

1. [Superseded by Phase 25F/post-demo correction] STAFF Admin Mobile has Dashboard, Return Scan, Contractors, Rewards, and Reports with restricted/read-only behavior. STAFF still cannot manage staff, fulfill rewards, export reports, or mutate protected records.
2. [Resolved for Phase 17 baseline] OWNER reward fulfillment is reached from Dashboard first. A dedicated flow can be added later if UAT requires faster access.
3. [Resolved for Phase 11 foundation] Staff profile requires name and mobile number. Additional fields remain deferred to the future staff profile expansion slice.
4. [Deferred] Can OWNER edit STAFF mobile number, or only deactivate and recreate? Phase 17 keeps existing create/reset/deactivate/reactivate behavior.

## Manual UAT 1 Product Recovery

1. [Resolved] Admin Web dev actor selector is not product-grade. Admin Web needs real OWNER/STAFF login for product UAT and production readiness.
2. [Resolved] Dashboards should be operational command surfaces, not static summaries. Metrics and shortcuts should drill into the relevant screen or filtered list.
3. [Resolved] Operational directories and histories need search, filters, sorting, and clickable details unless explicitly deferred in a phase plan.
4. [Resolved] User-facing histories must not expose raw database IDs as primary labels.
5. [Resolved] PIN entry in Contractor, OWNER, and STAFF mobile login flows should include reveal/hide control.
6. [Phase planning question] Which exact filters, sort options, and columns should be included first for Contractor Directory, Staff Directory, Print History, Invoice Ledger, Scan History, and Balance Book?
7. [Phase planning question] Should Admin Web and Admin Mobile use identical dashboard metric definitions and drilldown destinations, or should each surface optimize for different daily jobs?

## Media Storage

1. Which storage provider should hold contractor/staff profile photos? Reward images are production-directed to Supabase Storage but local/dev UAT uses DEC-052 placeholder media; profile photos still use compressed inline data URLs during local/product UAT.
2. What maximum file size and image dimensions should be enforced in production?
3. Should contractor photos be private signed URLs or public CDN URLs?

## Reports And Exports

1. [Resolved for first-pass reports] Filters: date range using Today, This Week including today, Last Week, This Month, Last 3 Months, Custom; status filters for QR Print, Scan History, and Rewards; additional report-specific filters where clearly relevant.
2. [Resolved for first-pass reports] PDF and Excel exports include all columns relevant to the selected report as listed in `PHASE_22H_REPORTS_PROMOTIONS_DECISION_CONTRACT.md`.
3. [Resolved for first-pass reports] WhatsApp share is not included initially.
4. [Resolved for first-pass reports] Hindi report output is not included initially.

## Promotions

1. [Resolved for first-pass promotions] Simple advertisement banners on Contractor/Team Member dashboards and other high-attention areas where banners do not interrupt operations or important messaging.
2. [Resolved for first-pass promotions] Images, GIFs, or images with animated elements.
3. [Resolved for first-pass promotions] No future campaign scheduler for v1; OWNER can set an optional expiry date, edit header overlay text and style, and deactivate promotions from a separate `Manage Promotions` section inside Promotions.
4. [Resolved for first-pass promotions] All users only; no tier/city/category/persona targeting initially.

## Mobile Manual UAT 2026-07-10

Source: `.planning/v1-agentic-build/Mobile_App_ManualUAT`  
Triage contract: `.planning/v1-agentic-build/MOBILE_APP_MANUAL_UAT_TRIAGE.md`

1. [Resolved 2026-07-10] Pending scan batch reservation: successfully scanned QR units are reserved immediately server-side for that contractor/site/cart. The cart should persist across app visits and should not be emptied automatically by a short TTL. Points are credited only when the contractor presses `Add to account`.
2. [Resolved 2026-07-10] Scan cart membership: failed scans never enter the cart. Only successfully validated QR scans enter the reserved cart. If `Add to account` fails due a technical issue such as network/API failure, the successfully scanned items remain in the cart and the contractor retries `Add to account`.
3. [Superseded by MANUALUAT2A 2026-07-10] Cart capacity: the earlier 1000-point cart cap is removed for v1. Valid high-value QR tokens must reserve if all normal token/site/session rules pass. If reserved items exist and the user tries to leave the selected site's Scan flow, show a prompt to `Add to account` or stay/go back to Scan.
4. [Resolved 2026-07-10] Already-claimed scan display: failed/already-claimed attempts show `0 credited points`; QR value may be displayed separately as informational `QR value`.
5. [Resolved 2026-07-10] Scan History ID display: list rows show human-readable QR/invoice/product references; detail screens expose full IDs with copy support.
6. [Resolved 2026-07-10] Admin Mobile Staff tab scope: Staff management remains OWNER-only; STAFF users do not get a Staff tab/read-only staff directory unless a future requirement changes this.
7. [Implementation default adopted 2026-07-10] Edge case for reserved cart invalidation: keep the cart row visible with a clear item-level error, do not credit points, and require the user to remove/refresh that item. Failure-injection verification remains a Phase 25 output-eval item.
8. [Implementation default adopted 2026-07-10] Reserved QR display label: contractor cart label `Ready to add`, Scan History label `Reserved`, backend QR state `RESERVED_IN_CART`. Admin-facing final copy can still be polished during Admin Mobile/Web status-label work.
9. [Resolved for Phase 27 2026-07-15] Mobile design research gate: use the approved Stitch screenshots as the primary direction, with PhonePe, Google Pay India, Paytm, and CRED as secondary pattern checks. See `evals/phase27/DESIGN_REFERENCE_APPENDIX.md`.
10. [Resolved by MANUALUAT2A 2026-07-10] End-user mobile points copy: QR value, cart total, reward cost, available balance, lifetime total, and Scan History must use points terminology. `Rs.` is allowed only for actual money fields such as invoice amount or admin-only reward value in INR.
11. [Resolved by MANUALUAT2A 2026-07-10] Team Member no-site behavior: if the selected contractor has no active sites, Team Member scan/site selection shows a user-facing message naming the contractor and asking them to create a site first.
