# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-06-09)

**Core value:** Secure product QR issuance, contractor/helper scanning, reward crediting, and admin control across mobile apps and web portal.  
**Current focus:** Phase 27 Mobile Native And Visual Readiness Closure is active after Phase 26 passed on 2026-07-15. Planning, automated tests, and current-code visible proof now pass for the remaining end-user/Admin Mobile readiness surfaces; native iOS/Android validation remains blocked by missing local toolchains/native project directories, and fresh image-backed reward-claim fulfillment proof is blocked by Supabase Storage `402 exceed_egress_quota`. Do not claim store-ready/public-launch readiness until native proof is run.

## Manual UAT 1 Recovery - 2026-07-06

- User findings are recorded in `.planning/v1-agentic-build/ManulUAT1.md`.
- Codex triage is recorded in `.planning/v1-agentic-build/MANUAL_UAT1_TRIAGE.md`.
- Roadmap correction is recorded in `.planning/v1-agentic-build/ROADMAP.md`.
- Durable decisions are recorded as:
  - `DEC-042`: BUSY returns arrive as linked Return of Sale vouchers.
  - `DEC-043`: Contractor name and mobile are immutable after registration.
  - `DEC-044`: Manual UAT 1 blocks further feature breadth until recovery phases.
- Phase 20 product recovery contracts are completed in `.planning/v1-agentic-build/PHASE_20_STATUS.md`.
- Phase 21 BUSY return-voucher domain correction is completed in `.planning/v1-agentic-build/PHASE_21_STATUS.md`; `DEC-045` now controls return allocation when the exact physical QR is unknown.
- Active next plan: Phase 22 Admin Web product-grade recovery, then Phase 23 End-User Mobile product-grade recovery, and Phase 24 Admin Mobile product-grade recovery.

## Forensics - 2026-07-01

- Contractor management UAT exposed an Agentic Engineering process gap: prior evidence verified nearby implementation paths but did not require the visible `Browse` control and exact `127.0.0.1:3001` browser path to be exercised like a user.
- Root cause and remediation are recorded in `.planning/forensics/report-20260701-085649.md`.
- Future UI-bearing phases must use interaction-faithful Browser UAT, persisted API/database readback, role-denied checks, and explicit residual-risk documentation before they can be called complete.

## Current Confirmed Decisions

- Platform includes end-user mobile app for Android and iOS.
- Platform includes admin mobile app for Android and iOS.
- Mobile apps will use a cross-platform app stack.
- Exact cross-platform framework will be decided during architecture.
- Public Play Store and App Store launch is in scope.
- Platform includes admin web portal in browser.
- Contractor profiles are created by client/admin only; no contractor self-registration.
- Login screen has two paths: `Contractor` and `Helper`.
- Contractor login uses ContractorID and 4-digit MPIN.
- Forgot ID sends ContractorID to registered mobile number.
- Forgot MPIN sends OTP to registered mobile number and allows MPIN reset after OTP verification.
- If contractor is not found, app directs them to contact the client for onboarding.
- Helper does not see the full registered contractor list.
- Helper enters the registered mobile number of the contractor/electrician they are currently helping.
- If the mobile number belongs to a registered contractor, OTP goes to that contractor; helper receives it offline and enters it.
- Helper sees a Recent list with no more than one contractor, populated only after successful OTP login for that contractor.
- Helper Recent contractor is stored locally on the helper's device using secure device storage.
- Helper Recent contractor is convenience-only; OTP remains required for every helper login/session.
- Helper can remove/change the Recent contractor.
- Helper access is Scan QR only.
- Helper sessions reset every day.
- Contractor access shows full end-user app.
- End-user app must support Hindi and English switching.
- Working frontend app brand is `Volt Rewards` until final client brand assets are supplied.
- Language toggle appears on every screen as `EN | हिंदी`.
- Contractor app bottom navigation is Home, Scan, History, Rewards & Balance.
- Formal section/page title remains `Rewards and Points Balance`.
- Contractor Home/Profile headers show contractor identity.
- Contractor inner screens show page title + back.
- Contractor home must show Scan QR, Balance Book, tier, total accumulated points, rewards, reward expiry, and claim action.
- Helper screen must show selected contractor name, number, photo, and Scan QR only.
- Helper may see the selected contractor's full registered mobile number after successful OTP login.
- Helper must not see ContractorID, points, balance, rewards, history, tier, or all contractors.
- Helper scan success must be scan-success only; no point amount or account-balance copy.
- Support/help should be a small footer/link where useful.
- Contractors Collect points and Claim rewards. Do not use Redeem wording in the frontend app.
- Visual benchmark is clean dense Google Pay / PhonePe-style clarity.
- Frontend apps must include banner/ad placements for client offers/promotions.
- Ads/promotions are shown to both Contractor and Helper personas.
- Admin web portal landing/front page shows `Print QR codes`.
- Admin web portal owns QR print workflow.
- After BUSY invoice generation, invoice data reaches the client database and is pulled into our portal through API integration.
- Invoice line items are pre-checked for QR printing.
- Staff can uncheck line items to omit QR printing.
- Staff can reduce QR print quantity for a line item, but cannot exceed invoice quantity.
- System tracks QR records at individual QR/unit level, linked back to invoice and line item.
- System stores selected/printed units as `Printed` and skipped/unprinted units as `Not Printed`.
- Staff can later print `Not Printed` units in one or more partial batches only after system rechecks through API that the product/invoice line item was not returned.
- Admin web portal includes end-user management, reward data, analytics, reports, QR print history, QR scan/expiry/unclaimed/reversal status.
- Admin mobile app working name is `Volt Admin`.
- Admin mobile apps include OWNER and STAFF personas.
- OWNER is the store owner/admin master account created from the backend.
- OWNER logs in with registered mobile number and fixed 4-digit PIN.
- OWNER can add staff members from the admin app.
- STAFF logs in with mobile number and a unique app-generated 4-digit PIN shared by the OWNER.
- OWNER and STAFF sessions stay logged in until access is removed/deactivated, PIN is changed, or the app is not opened for 4 straight days.
- Admin mobile apps include useful data screens, including dashboard, reports, contractor details, QR history, rewards, and analytics.
- Web portal owns QR printing and broader management workflows not explicitly confirmed for admin mobile.
- Admin mobile can register new contractors from the OWNER persona only.
- OWNER contractor registration requires contractor name, mobile number, and optional photo.
- ContractorID is auto-generated during contractor registration.
- Contractor registration sends a welcome SMS to the contractor's mobile number with frontend app download links.
- Duplicate contractor mobile numbers are blocked and should show existing contractor details.
- OWNER can update contractor photo and deactivate/unregister contractors from admin mobile. Contractor name and mobile are immutable after registration per `DEC-043`; incorrect identity data should be handled by deactivation and new registration.
- STAFF can view contractor information but cannot add, edit, deactivate, unregister, delete profiles, or manually change points.
- Admin mobile app supports return scan status check.
- Admin mobile app can cancel a returned-product QR only when the QR is unused/uncollected and not expired, after the QR label is removed and discarded.
- Cancel flow has no contractor, points, or reverse action because no points were collected for that QR.
- Admin mobile app can reverse points only when the returned-product QR was already scanned/collected and points were credited; after reversal, that QR is discarded.
- Cancel/Reverse reason is fixed as `Product Returned`; no extra proof upload is required.
- Cancel and Reverse both require a confirmation checkbox that the QR label was removed and discarded.
- Cancel scan details show product name, QR ID, and invoice number.
- Reverse scan details show product name, QR ID, invoice number, contractor name, contractor mobile number, points to reverse, and scan date.
- Reverse confirmation warns when the action may create a negative contractor balance.
- If returned QR points were claimed but not fulfilled, system unclaims/revokes the claim.
- If returned QR points were already fulfilled, system reverses points and can create a negative contractor balance.
- QR expiry is 45 days for now.
- OWNER can add, reset/regenerate PIN, deactivate, and reactivate STAFF accounts.
- STAFF can Cancel/Reverse returned-product QR codes and fulfill verified reward claims, but cannot change contractor/staff/points master data.
- OWNER and STAFF can fulfill rewards at the counter by entering Claim ID, verifying the claim, triggering OTP to the registered contractor mobile number, entering OTP in Volt Admin, then marking the claim as `Fulfilled`.
- Rewards working assumption: point thresholds unlock discount vouchers or prizes such as Air Fryer, claimed from the shop; exact workflow to be finalized later.
- OWNER dashboard includes today's scans, active contractors, pending reward pickups, QR cancelled/reversed today, top contractors, expired QR, unclaimed QR, and total points issued.
- STAFF dashboard shows read-only total QR codes printed by date/week/last week/custom dates and read-only return-scan stats.
- Admin mobile reports include QR printed by date/category, contractor leaderboard, QR status report, reward claims, returns/reversals, and product/category performance.
- STAFF reports are view-only.
- OWNER can export/share reports as PDF, Excel, and WhatsApp.
- Admin mobile notifications/alerts are not needed for now.
- Admin mobile More/Profile includes language setting, staff management, support, about, app version, logout, privacy, and terms.
- Admin mobile Contractors bottom-nav landing screen is `Contractor Leaderboard`.
- `Contractor Leaderboard` includes a manage-contractors entry area for `Contractors List`, `Add New Contractor`, and contractor detail screens.
- `Reports Hub` may show `Contractor Leaderboard` as a report/export option, but that report is tied to the same ranking data and is not the contractor-management entry point.
- Analytics/reporting confirmed so far: QR codes printed by day/month/3-month period with product category and quantity; contractor leaderboard by points; deep-dive analytics per contractor; QR status; reward claims; returns/reversals; product/category performance.
- QR printed reports support custom date range filtering.
- QR lifecycle statuses: Printed/Unclaimed, Scanned/Claimed, Expired, Reversed, Reprinted, Cancelled.
- Reprint is allowed only for unscanned, non-expired QR codes.
- Cancellation is allowed only for unused/uncollected, non-expired QR codes.
- QR reprint generates a replacement QR token and invalidates the old QR token.
- Reversal is allowed only for already collected/scanned, Scanned/Claimed QR codes.
- Expired means unscanned and past expiry.
- Exact BUSY/API fields will be finalized after receiving sample invoice data from the client.
- BUSY remains expected invoice source, with SQL/API access still to be verified.
- QR labels remain separate from BUSY invoice layout unless PRD changes it.
- Latest Stitch admin STAFF pass update: the STAFF Contractors branch was updated in place with `project.file_update`: `Contractor Leaderboard` (`projects/11128801461567928004/screens/e4a1ed5fc14b4d3dba3d7731835388f4`), `Contractors List` (`projects/11128801461567928004/screens/a5aaaea036534871ba2fc0f9cb26b9ec`), and `STAFF - Contractor Detail Read-only - Final` (`projects/11128801461567928004/screens/86fac0a035e446d9a4a70584a371ee9e`) now show read-only STAFF views with no Add/Edit/Deactivate/export/manual point controls; the detail screen also has no Return Scan/Fulfill Reward shortcuts.
- Latest Stitch admin reports update: `Reports Hub` (`projects/11128801461567928004/screens/c06a5958cdc34498a20dbf1a32f1e6cf`), `QR Printed Report` (`projects/11128801461567928004/screens/7d7dd0117c7e4d668a9d1440cece8d56`), `QR Status Report` (`projects/11128801461567928004/screens/8aa264eed1064226a3dfbd69c044ace2`), and `Reward Claims Report` (`projects/11128801461567928004/screens/3bc76ce4294d4863a98bedecf868f28f`) were updated in place with `project.file_update` as STAFF view-only report screens with More selected, Claim/Fulfilled terminology, and no export/share/download/print/generate QR/reprint/Cancel/Reverse or in-report fulfillment controls.
- Current Stitch admin stop point: an attempted in-place edit of `Returns and Reversals Report` (`projects/11128801461567928004/screens/a35ee0117316490dac3633348aa7944b`) returned generated artifact `projects/11128801461567928004/screens/2e36eaa2ce9648928191425465482de9` (`Returns & Reversals Report - STAFF View`) instead of `project.file_update`. Immediate `list_screens` did not list the artifact, and the original remains visible. Resume from the original screen only after handling this artifact.

## Superseded / Do Not Use As Current Baseline

- Earlier Android-only pilot assumption.
- Earlier direct APK-only distribution assumption.
- Earlier cost breakdown based on Android-only end-user app.
- Earlier one-pager based on Android-only end-user app and web-only admin.

## Existing Deliverables

These files exist but are now background/reference until regenerated:

- `client-deliverables/Electrician_Loyalty_QR_Pilot_Cost_Breakdown.pdf`
- `client-deliverables/Electrician_Loyalty_QR_Pilot_Cost_Breakdown.docx`
- `client-deliverables/Electrician_Loyalty_QR_Platform_One_Pager.pdf`
- `client-deliverables/Electrician_Loyalty_QR_Platform_One_Pager.docx`
- `client-deliverables/Electrician_Loyalty_QR_Platform_One_Pager.md`

Current UI/UX working files:

- `client-deliverables/Stitch_Frontend_App_Prompts.md`
- `client-deliverables/Stitch_Admin_App_Prompts.md`

## Stitch MCP Sync - 2026-06-10

- Stitch MCP tools are available in this Codex session.
- Verified read tools used: `list_projects`, `list_screens`, `get_screen`.
- Owned Stitch projects listed:
  - `Electrical Retailer Loyalty App` - relevant frontend/end-user mobile app project.
  - `insig8 Landing Page` - unrelated desktop project.
- Shared Stitch projects returned none.
- Relevant project inspected: `Electrical Retailer Loyalty App` (`projects/255631333562829582`).
- Current visible frontend screen count inspected: 35.
- Current Stitch screen set includes the original Contractor and Helper flows plus:
  - Split Forgot MPIN flow: ID Entry, OTP Verification, Reset MPIN.
  - Separate Contractor scan error screens: already claimed, expired, invalid/replaced, network retry.
  - Separate Helper scan error screens: already claimed, expired, invalid QR, network retry.
  - Rewards and Points Balance tabs: Balance Book, Rewards, Claims.
- `client-deliverables/Stitch_Frontend_App_Prompts.md` was updated to match the current Stitch screen inventory and design direction.
- No API key or local MCP secret was written to repo files.
- Product requirements were not changed during this sync. Items that were open on 2026-06-10 were resolved in the 2026-06-11 consistency pass below: working brand `Volt Rewards`, compact nav label `Rewards & Balance`, full helper post-login phone visibility, and point-free Helper scan success.

## Stitch Consistency Pass - 2026-06-11

- User approved the frontend consistency plan and resolved key UI decisions:
  - Use `Volt Rewards` as the working brand for now.
  - Show language toggle on every screen.
  - Use contractor identity in Home/Profile headers; use page title + back on inner screens.
  - Use `Rewards & Balance` as the compact bottom-nav label and `Rewards and Points Balance` as the formal title.
  - Full contractor mobile number is acceptable post-login.
  - Helper scan success must show success only, with no point amount.
  - Support/help should be a small footer/link.
  - Use Collect for points and Claim for rewards.
  - Use clean dense Google Pay / PhonePe-style clarity as the visual benchmark.
- Stitch MCP tools were verified and used in this session: `list_projects`, `get_project`, `list_screens`, `get_screen`, `edit_screens`, and `upload_design_md`.
- Relevant Stitch project remains `Electrical Retailer Loyalty App` (`projects/255631333562829582`).
- Legacy project visible source screen count from `list_screens` was 35 at that time.
- `edit_screens` was run by screen family to generate standardized variants for:
  - Helper restricted scan/home/error/session screens.
  - Contractor scan success/error/history/detail screens.
  - Rewards and Points Balance balance book/catalog/claim/success screens.
- Important MCP limitation observed in the legacy project: generated standardized screen resources were retrievable by direct `get_screen` ID, but `list_screens` and `get_project` still showed the original 35 visible source screens. Those legacy visible source screens contained drift such as `About Volt Pro`, Helper scan success with point amount, and stale design-system language.
- Direct design-system paths were attempted:
  - `update_design_system` rejected payloads with `Request contains an invalid argument`.
  - `create_design_system` rejected payloads with `Request contains an invalid argument`.
  - `upload_design_md` accepted a Volt Rewards DESIGN.md payload and returned screen instance `14705946599942692536`.
  - `create_design_system_from_design_md` then rejected the uploaded payload with `Request contains an invalid argument`.
- At that point, `client-deliverables/Stitch_Frontend_App_Prompts.md` was rewritten for the original frontend/end-user baseline; that baseline is now superseded by the clean 36-screen project inventory below.
- No API key or local MCP secret was written to repo files.
- Product requirements were not changed except documenting the user-approved UI decisions above.

## Clean Stitch Project - 2026-06-11

- User reported that the original Stitch project became messy after refresh, with multiple new screens being created.
- A separate clean Stitch project was created instead of continuing to modify the messy original project:
  - Project title: `Volt Rewards - Clean End User Flow`
  - Project ID: `9940539769254693568`
  - Resource: `projects/9940539769254693568`
  - Visibility: Private
  - Device type: Mobile
- New project design system asset currently available:
  - `assets/baaad88c73794da18984b9e731ea8dd4`
  - Display name: `Volt Rewards`
- Important caveat: the design-system style guidelines still include stale generated wording such as `Redeem` and a generic `Rewards` bottom-nav label, so every screen generation prompt must explicitly override visible copy with `Claim`, `Collect`, `Scan QR`, and `Rewards & Balance`.
- Initial full-flow one-shot generation timed out; the clean flow was generated in smaller batches and single-screen calls.
- On 2026-06-12, the user manually deleted duplicate/unneeded screens in Stitch. `list_screens` now returns the kept visible screen inventory below.
- Current kept visible screen count: 36.
- Current kept screen IDs:
  - `projects/9940539769254693568/screens/233175f913fa47f3a8d2fd40c6226ba5` - Splash Screen.
  - `projects/9940539769254693568/screens/a50eec3bceba41dc89ffbcf82d1dedc6` - Language Selection.
  - `projects/9940539769254693568/screens/39d4364f8af741e68e9bd3560e681e1f` - Entry & Login Flow.
  - `projects/9940539769254693568/screens/80f1cd79330a428984ce1cdec062ac05` - Role Selection.
  - `projects/9940539769254693568/screens/c4ded4437e364d2182ff25665f1f1882` - Contractor Login.
  - `projects/9940539769254693568/screens/418f008fe4de4209802586899bec5a76` - Contractor Not Found State.
  - `projects/9940539769254693568/screens/9b79b917c22d493b958979dcba13b590` - Forgot ID.
  - `projects/9940539769254693568/screens/9c795eee60be467f9331d4ca36d86cf6` - Forgot MPIN - ID Entry.
  - `projects/9940539769254693568/screens/6f2340412a224ce8a23a4f407ced04b1` - OTP Verification.
  - `projects/9940539769254693568/screens/6b41a4cac69545c78ecb24ddc795ddbb` - Reset MPIN.
  - `projects/9940539769254693568/screens/a0d0e96e37aa4c619605cfa056f5da84` - Helper Login Entry.
  - `projects/9940539769254693568/screens/1a6c9b437c2445359b722074365d2887` - Helper Not Found.
  - `projects/9940539769254693568/screens/64e34b9a986d48409487aa4e67901c2d` - Helper OTP Verification.
  - `projects/9940539769254693568/screens/e3d20971c8f94149b590fc0b98348b88` - Contractor Dashboard & Scanning.
  - `projects/9940539769254693568/screens/70e06b38476948e0bf677606318bb622` - Contractor Scan QR Camera.
  - `projects/9940539769254693568/screens/585c2390ccd7431eb1975c9fca0d6c0e` - Contractor Scan Success Result.
  - `projects/9940539769254693568/screens/47e6db70440847fab5744dd52cda0184` - Contractor Scan Error - Already Claimed.
  - `projects/9940539769254693568/screens/aa6100d1e48a4cb18279b086d492b190` - Contractor Scan Error - Expired.
  - `projects/9940539769254693568/screens/ee157b0e37894d68b3aa27c0c060baa2` - Contractor Scan Error - Invalid QR.
  - `projects/9940539769254693568/screens/a371f5453edc4004b88ce415108f37fc` - Contractor Scan Error - Network Retry.
  - `projects/9940539769254693568/screens/67192c89ab914d33a0202489ff093368` - Contractor History Ledger.
  - `projects/9940539769254693568/screens/37c17375ab7046d7953191efd9d96a9d` - Transaction History Details.
  - `projects/9940539769254693568/screens/efe1599ddedd47ed8e602911808b44bd` - Balance Book & Points Ledger.
  - `projects/9940539769254693568/screens/f6b13a6e57df4632a14dc7c2882092db` - Rewards and Points Balance - Rewards Catalog.
  - `projects/9940539769254693568/screens/7595548e8bd747acb329a4f3ad8dcfd7` - Reward Detail & Claim Confirmation.
  - `projects/9940539769254693568/screens/4c643405679445198cc04b9facb0e56c` - Reward Claim Successful.
  - `projects/9940539769254693568/screens/65699e65eacc4183953c1f7304c8943e` - Contractor Profile.
  - `projects/9940539769254693568/screens/11bb12405cc64ad59c90d4e7383de67c` - About Page.
  - `projects/9940539769254693568/screens/dca29d732c1f49c8851fb50eda02837c` - Helper Scan Home.
  - `projects/9940539769254693568/screens/6f56f525d11d4efd850cd84e05695b31` - Helper QR Scanner.
  - `projects/9940539769254693568/screens/81246d68b72a4cae8be08068c93a7818` - Helper Scan Success.
  - `projects/9940539769254693568/screens/e65a6e8bba974d8abbad43dcf0fa407f` - Helper Already Claimed.
  - `projects/9940539769254693568/screens/649b2192a11f40eab1871dd405c1e65e` - Helper QR Expired.
  - `projects/9940539769254693568/screens/6f84fdbd961043ffbcafc7140820d111` - Helper Invalid QR.
  - `projects/9940539769254693568/screens/63c95bd49ddf43cfb31b69e9463908d3` - Helper Network Retry.
  - `projects/9940539769254693568/screens/5b16231d831947ffb1b3940c6952bb02` - Helper Session Expired.
- One-at-a-time consistency pass was run on existing kept screen IDs for language-toggle normalization, rewards icon consistency, bottom-nav labels/icons, helper restrictions, and inner-screen nav cleanup.
- Important MCP caveat: one History Ledger edit returned an unlisted generated variant `projects/9940539769254693568/screens/df21cad0ebb64743be15909843ec93bc`. It does not appear in current `list_screens`; if it appears in Stitch UI after refresh, manually discard it and keep `67192c89ab914d33a0202489ff093368`.
- Final `list_screens` check after the consistency pass still returned 36 kept visible screens.
- Follow-up documentation cleanup on 2026-06-12 updated `client-deliverables/Stitch_Frontend_App_Prompts.md` and `.planning/docs/STITCH_MCP_SETUP_NOTES.md` to use the current 36 kept clean-project screens as the active inventory.
- Final Stitch MCP verification after documentation cleanup confirmed `list_screens` still returns 36 kept visible screens for `projects/9940539769254693568`.
- No API key or local MCP secret was written to repo files.

## Volt Admin Prompt Pack - 2026-06-13

- User clarified admin mobile app requirements and confirmed the working app name `Volt Admin`.
- Admin mobile now has two personas:
  - OWNER: store owner/master admin account created from backend.
  - STAFF: staff users added by OWNER with app-generated 4-digit PIN.
- OWNER and STAFF login with mobile number + 4-digit PIN.
- OWNER and STAFF stay logged in unless deactivated/removed, PIN changes, or the app is not opened for 4 straight days.
- OWNER can add staff members, reset/regenerate staff PIN, deactivate staff, and reactivate staff.
- OWNER can register contractors from admin mobile using contractor name, mobile number, and optional photo.
- ContractorID is auto-generated during admin mobile contractor registration.
- Contractor registration sends welcome SMS with frontend app download links.
- Duplicate contractor mobile numbers are blocked and show existing contractor details.
- OWNER can update contractor photo and deactivate/unregister contractors. Contractor name and mobile are immutable after registration per `DEC-043`; incorrect identity data should be handled by deactivation and new registration.
- STAFF can view contractors but cannot add/edit/deactivate/unregister contractors, delete profiles, manually change points, manage staff, or export/share reports.
- Bottom navigation is Dashboard, Return Scan, Contractors, More.
- Cancel and Reverse require checkbox confirmation that the QR label was removed and discarded.
- Cancel scan details show product name, QR ID, and invoice number.
- Reverse scan details show product name, QR ID, invoice number, contractor name, contractor mobile number, points to reverse, and scan date.
- Reverse confirmation warns if reversal may create a negative contractor balance.
- OWNER and STAFF can fulfill rewards by entering Claim ID, verifying the claim, sending OTP to the registered contractor mobile number, entering OTP, and marking the reward as `Fulfilled`.
- Admin mobile reports include QR printed by date/category, contractor leaderboard, QR status, reward claims, returns/reversals, and product/category performance.
- STAFF reports are view-only; OWNER can export/share reports as PDF, Excel, and WhatsApp.
- Admin mobile notifications/alerts are not needed for v1.
- Admin app supports English and Hindi through a Profile language setting; no per-screen language toggle.
- Created `client-deliverables/Stitch_Admin_App_Prompts.md`.
- Created `.planning/docs/STITCH_ADMIN_APP_PROMPTS.md` as a pointer to the canonical prompt pack.
- Updated `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/docs/CLIENT_DISCOVERY_DRAFT.md`, `.planning/docs/QR_MANAGEMENT_WORKFLOW.md`, and `.planning/docs/OPEN_QUESTIONS.md` to match the OWNER/STAFF admin mobile baseline.

## Volt Admin Stitch Project Pass - 2026-06-13

- Active admin Stitch project:
  - Project title: `Volt Admin Mobile App`
  - Project ID: `11128801461567928004`
  - Resource: `projects/11128801461567928004`
  - Device type: Mobile
  - Design system asset: `assets/3c9cd173ebbf4ea199fedaefaea901da`
- Earlier pass status:
  - `client-deliverables/Stitch_Admin_App_Prompts.md` defines 37 intended admin mobile screens.
  - The original pass refined screens 1-24 and several reports/staff screens one at a time.
  - Stitch generated duplicate artifacts during some `edit_screens` calls even when the prompt requested in-place editing.
  - Known older duplicate artifacts: `projects/11128801461567928004/screens/25ef8579e3cd4816b68199058fd549e3` (`Reports Hub - OWNER View`) and `projects/11128801461567928004/screens/4cc090f5c254465a965fa3509cf7a722` (`More`). The user manually deleted visible More artifacts before the latest pass.
- Latest user cleanup / recreation pass:
  - User refreshed Stitch and deleted unneeded More artifacts.
  - User deleted `Reports Hub - OWNER View`.
  - User removed `Staff Management`, `Add Staff`, `Staff Detail / PIN and Access`, and `Contractor Leaderboard` and requested clean recreation of those flows.
  - User clarified that `Contractor Leaderboard` is the Contractors bottom-nav landing screen, with manage-contractor options leading to `Contractors List`, `Add New Contractor`, and contractor detail.
  - User clarified Cancel vs Reverse: Cancel only for unused/uncollected and not expired QR; Reverse only after points were already collected/scanned, then points are reversed and the QR is discarded.
- Screens recreated one at a time and verified by direct `get_screen`:
  - `More` - `projects/11128801461567928004/screens/ccbc7cd7e7724e6e97544770210d80da`
  - `Staff Management` - `projects/11128801461567928004/screens/b752982f1eae4cc591e0674a6c5b17b5`
  - `Add Staff` - `projects/11128801461567928004/screens/c5a9cfacd4a8451991b7b0b80444c992`
  - `Staff Detail / PIN and Access` - `projects/11128801461567928004/screens/91ab777fb3dc41aab15010ac1fde3984`
  - `Contractor Leaderboard` - `projects/11128801461567928004/screens/e4a1ed5fc14b4d3dba3d7731835388f4`
- Existing screens safely updated in-place with `project.file_update` during this latest pass:
  - `Reports Hub` - updated to tie its Contractor Leaderboard report option to the same ranking data while keeping contractor management under the Contractors tab.
  - `QR Status - Cancel Eligible` - updated to show only unused/uncollected, not-expired Cancel eligibility; no contractor, points, or Reverse action.
  - `Cancel QR Confirmation` - partially updated in-place for unused/uncollected Cancel flow.
- Latest stop condition:
  - While trying to make a small text correction on the original `Cancel QR Confirmation`, Stitch returned a generated screen object instead of `project.file_update`.
  - Generated artifact reported by Stitch: `projects/11128801461567928004/screens/4ed4fa91475c441bb920cec83aa37b41`
  - Generated artifact title: `Cancel QR Confirmation`
  - Follow-up `list_screens` did not show this artifact, but it should be deleted/discarded if it appears in Stitch after refresh.
  - Stop condition was triggered to avoid creating more duplicates.
- Resume pass on 2026-06-14:
  - `list_screens` still showed visible `STAFF Dashboard` (`projects/11128801461567928004/screens/804bc1cdcde44d39a115c0a13548f55f`) and visible `Contractor Detail - STAFF Read-only` (`projects/11128801461567928004/screens/abd9cc0f0ee44643a6c375d8fbafd11c`).
  - Direct `get_screen` confirmed hidden/generated duplicate `Cancel QR Confirmation` artifact `projects/11128801461567928004/screens/4ed4fa91475c441bb920cec83aa37b41` is retrievable but still not visible in `list_screens`.
  - Safely updated with `project.file_update`:
    - `Cancel QR Confirmation` - original visible screen cleaned for unused/uncollected Cancel flow.
    - `Cancel QR Success` - original visible screen cleaned for unused/uncollected Cancel success; no points reversed.
    - `QR Status - Reverse Eligible` - original visible screen cleaned for already collected/scanned Reverse eligibility.
    - `Reverse QR Confirmation` - original visible screen cleaned for points reversal, QR discard checkbox, and negative-balance warning.
    - `Reverse QR Success` - original visible screen cleaned for points reversed and QR discarded.
    - `QR Status - Non-actionable` - original visible screen cleaned to show non-actionable statuses and no Cancel/Reverse actions.
    - `STAFF Dashboard` - original visible screen reworked as post-login STAFF landing with Dashboard selected, read-only QR/return stats, allowed quick actions, and view-only entries.
    - `Contractor Detail - STAFF Read-only` - original visible screen reworked as STAFF read-only contractor detail.
  - New stop condition:
    - A narrow icon-only correction on `Contractor Detail - STAFF Read-only` returned a generated screen object instead of `project.file_update`.
    - Generated artifact reported by Stitch: `projects/11128801461567928004/screens/5bc89cebbccb41efba0706daeab675df`
    - Generated artifact title: `Contractor Detail - STAFF Read-only`
    - Treat this as a duplicate artifact. Discard/delete it if it appears after Stitch refresh. Keep original visible screen `projects/11128801461567928004/screens/abd9cc0f0ee44643a6c375d8fbafd11c`.
  - Remaining admin Stitch work should resume one screen at a time only after generated artifacts are cleared or confirmed hidden:
    - Original `Contractor Detail - STAFF Read-only` may still have a `redeem` material icon ligature on the `Fulfill Reward` shortcut; text is still `Fulfill Reward`.
    - Review/rework `Profile and Language`.
    - Verify whether `About, Support, Privacy, Terms` is visible or needs explicit recreation/removal from active screen set.
    - Recheck visible/direct generated screens for More, Staff Management, Add Staff, Staff Detail / PIN and Access, and Contractor Leaderboard after user refresh.
    - Stop immediately if `edit_screens` returns a generated screen object instead of a `project.file_update` event for a selected existing screen ID.
    - No API key or local MCP secret was written to repo files.
- User requested on 2026-06-14:
  - Redo `Cancel QR Success`.
  - Review/rework `Profile and Language`.
  - Create separate `About`, `Support`, `Privacy`, and `Terms` pages.
  - Create clearly named STAFF persona flow screens from login through landing, navigation, and allowed actions.
  - Clarification: creating new screens is acceptable when required, but existing screens should be improved in place instead of duplicated.
- 2026-06-14 follow-up execution:
  - `list_screens` showed previous generated duplicates now visible:
    - `projects/11128801461567928004/screens/4ed4fa91475c441bb920cec83aa37b41` - duplicate `Cancel QR Confirmation`.
    - `projects/11128801461567928004/screens/5bc89cebbccb41efba0706daeab675df` - duplicate `Contractor Detail - STAFF Read-only`.
  - Original `Cancel QR Success` (`projects/11128801461567928004/screens/6ec1b7e82fa94d5caaa7d294fe4a415f`) was redone in place with `project.file_update` for unused/uncollected QR cancellation success.
  - A narrow bottom-nav correction on the same existing `Cancel QR Success` screen returned a generated screen object instead of `project.file_update`.
  - Generated artifact reported by Stitch: `projects/11128801461567928004/screens/c6697fed76df4527ab0691e46d289cff`
  - Generated artifact title: `Cancel QR Success`
  - Treat this as a duplicate artifact. The generated artifact appears to contain the corrected nav, but it was not an in-place update of the original existing screen.
  - Stitch edits stopped before `Profile and Language`, legal/support page creation, and STAFF flow creation to avoid compounding duplicate artifacts.
- User follow-up correction on 2026-06-14:
  - User reported both `Cancel QR Success` copies are still wrong and requested a fresh new screen; user will delete the two older copies.
  - User reported the `Cancel QR Confirmation` duplicate is not visible after refresh and the single visible screen looks correct.
  - User reported two copies of `Contractor Detail - STAFF Read-only` and requested a fresh new screen; user will delete the two older copies.
- Fresh replacement screens created one at a time and verified by direct `get_screen`:
  - `Cancel QR Success - Final` - `projects/11128801461567928004/screens/8206048fbb014847a796f18598f0b794`
  - `STAFF - Contractor Detail Read-only - Final` - `projects/11128801461567928004/screens/86fac0a035e446d9a4a70584a371ee9e`
- Latest one-screen-at-a-time Stitch update:
  - `Profile and Language` (`projects/11128801461567928004/screens/851018f32e534a3b9cde2c2f55bcbb0a`) was updated in place with `project.file_update`.
  - The screen now covers profile identity, role/store/mobile, default language selection, session/security notes, support/legal links, and logout.
- Latest new legal/support screen:
  - `About - Volt Admin` - `projects/11128801461567928004/screens/16f79f86cadb45e59c07c261639efe22`
  - `Support - Volt Admin` - `projects/11128801461567928004/screens/675806bf72db4dcd9fc9c7c001ab9fbc`
  - `Privacy Policy - Volt Admin` - `projects/11128801461567928004/screens/dae25b2116b7419fbdf484e0887e9086`
  - `Terms & Conditions - Volt Admin` - `projects/11128801461567928004/screens/d0f31ca89c7347ec91dd9f1f144c4f96`
- Latest STAFF persona flow screen:
  - `STAFF - Login` - `projects/11128801461567928004/screens/316ba5ac61ad41a69d9e86342dd799eb`
  - `STAFF - Access Blocked / Re-login` - `projects/11128801461567928004/screens/f467bd4d628542c8bf8bcc74d1bd511f`
- Latest STAFF in-place flow update:
  - `STAFF Dashboard` (`projects/11128801461567928004/screens/804bc1cdcde44d39a115c0a13548f55f`) was updated with `project.file_update` as the post-login STAFF landing screen.
  - `QR Status - Cancel Eligible` (`projects/11128801461567928004/screens/87388c0430ae4cf286762157bc8620cf`) was updated with `project.file_update` as the STAFF Cancel-only status screen for unused/uncollected, not-expired QR labels.
  - `Cancel QR Confirmation` (`projects/11128801461567928004/screens/4ed4fa91475c441bb920cec83aa37b41`) was updated with `project.file_update` as the STAFF confirmation screen for fixed Product Returned cancellation, label-discard checkbox, and STAFF audit note.
  - `Cancel QR Success - Final` (`projects/11128801461567928004/screens/8206048fbb014847a796f18598f0b794`) was updated with `project.file_update` as the STAFF Cancel success screen with Cancelled/Discarded result, no points reversed, and STAFF audit note.
  - `QR Status - Reverse Eligible` (`projects/11128801461567928004/screens/11ad9f5300044e02bc26a91bab4c7985`) was updated with `project.file_update` as the STAFF Reverse-only status screen for scanned/claimed QR labels with contractor, mobile, scan date, points to reverse, and negative-balance warning.
  - `Reverse QR Confirmation` (`projects/11128801461567928004/screens/0f94124fa5524e62abe50d2f73c1b3c8`) was updated with `project.file_update` as the STAFF confirmation screen for Product Returned point reversal, label-discard checkbox, negative-balance warning, and STAFF audit note.
  - `Reverse QR Success` (`projects/11128801461567928004/screens/ba497731bb574e5b9d00e70880a70d59`) was updated with `project.file_update` as the STAFF Reverse success screen with Reversed/Discarded result, points reversed summary, balance-book note, and STAFF audit note.
  - `QR Status - Non-actionable` (`projects/11128801461567928004/screens/51b5216a46ec4e52baf3c477dfee4bf3`) was updated with `project.file_update` as the STAFF no-action return-scan result with expired example, other non-actionable states, no Cancel/Reverse actions, and support note.
  - `Reward Fulfillment - Claim ID Entry` (`projects/11128801461567928004/screens/fa1fb99b94ce451889c06d066d36787a`) was updated with `project.file_update` as the STAFF Claim ID verification entry with pending pickup preview and OTP security note.
  - `Reward Fulfillment - OTP Verification` (`projects/11128801461567928004/screens/f878e9d7648f40f898ddbd3ca81c77c7`) was updated with `project.file_update` as the STAFF contractor OTP verification screen with resend timer, MPIN warning, and fulfillment next-step hint.
  - `Reward Fulfillment Success` (`projects/11128801461567928004/screens/3ac14fb9cee04899ad15c6ef9f559cb1`) was updated with `project.file_update` as the STAFF Fulfilled completion screen with claim summary, Fulfilled by audit trail, and no Redeem wording.
- Latest return-scan update:
  - User confirmed `Return Scan Camera` (`projects/11128801461567928004/screens/4580c459a432402fa3c27b81a56dc715`) is the only STAFF return-scan screen visible and should be kept for now.
  - Treat `projects/11128801461567928004/screens/4580c459a432402fa3c27b81a56dc715` as the active STAFF return-scan screen.
- Screens user plans to delete from Stitch:
  - Older `Cancel QR Success` copies: original `projects/11128801461567928004/screens/6ec1b7e82fa94d5caaa7d294fe4a415f` and generated `projects/11128801461567928004/screens/c6697fed76df4527ab0691e46d289cff`.
  - Older `Contractor Detail - STAFF Read-only` copies: original `projects/11128801461567928004/screens/abd9cc0f0ee44643a6c375d8fbafd11c` and generated `projects/11128801461567928004/screens/5bc89cebbccb41efba0706daeab675df`.

## Current Open Questions

- What exact automatic audit fields are required for admin mobile Cancel/Reverse and reward fulfillment actions?
- What exact advertisement placements, formats, scheduling, and targeting rules are needed?
- What final logo and production brand colors should be used for `Volt Rewards`?
- What is the exact Hindi copy for the end-user app?
- What exact contractor profile fields should be shown?
- What exact tier names and thresholds should be used?
- Whether total accumulated points and available claimable points are separate values.
- What is the exact reward claim, approval, and fulfillment workflow?
- Which reports and analytics beyond the confirmed baseline are required for v1?
- Which exact BUSY version/edition/database/API is available?

## Next Step

Use `Volt Rewards - Clean End User Flow` (`projects/9940539769254693568`) as the active frontend Stitch review target. For admin mobile, use `Volt Admin Mobile App` (`projects/11128801461567928004`) as the active Stitch target. Current intended replacements are `Cancel QR Success - Final` (`projects/11128801461567928004/screens/8206048fbb014847a796f18598f0b794`) and `STAFF - Contractor Detail Read-only - Final` (`projects/11128801461567928004/screens/86fac0a035e446d9a4a70584a371ee9e`). `Profile and Language` is updated in place; `About - Volt Admin`, `Support - Volt Admin`, `Privacy Policy - Volt Admin`, and `Terms & Conditions - Volt Admin` have been created. `STAFF - Login` and `STAFF - Access Blocked / Re-login` have been created, existing `STAFF Dashboard` is updated as the post-login landing screen, and `Return Scan Camera` (`projects/11128801461567928004/screens/4580c459a432402fa3c27b81a56dc715`) is the active STAFF return-scan screen. Continue remaining STAFF persona flow screens one at a time.
