# Stitch Prompts: Frontend End-User App

**Created:** 2026-06-09  
**Last updated:** 2026-06-12  
**Tool target:** Stitch by Google  
**Scope:** End-user mobile app only: Contractor + Helper personas. Admin mobile app and admin web portal prompts will be created separately.

## Stitch MCP Status

Stitch MCP is available in Codex and connected through the local private MCP config. No Stitch API key or MCP secret is stored in this file.

Verified tools used:

- `list_projects`
- `create_project`
- `get_project`
- `list_screens`
- `get_screen`
- `generate_screen_from_text`
- `edit_screens`
- `upload_design_md`

Active clean frontend/end-user Stitch project:

- `Volt Rewards - Clean End User Flow`
- Project ID: `9940539769254693568`
- Resource: `projects/9940539769254693568`
- Device type: Mobile
- Design system asset: `assets/baaad88c73794da18984b9e731ea8dd4`
- Purpose: active review target for the manually cleaned Contractor + Helper end-user flow.
- Current kept visible screen count from `list_screens`: 36

Legacy/messy frontend/end-user Stitch project:

- `Electrical Retailer Loyalty App`
- Project ID: `255631333562829582`
- Device type: Mobile
- Visible source screen count from `list_screens`: 35
- Status: preserve as prior reference only; do not use as the current review baseline unless explicitly requested.

## Stitch Consistency Pass - 2026-06-11

Approved working decisions now reflected in this prompt pack:

- Working brand: `Volt Rewards`.
- Language toggle appears on every screen as `EN | हिंदी`.
- Contractor Home/Profile show contractor identity in the header.
- Contractor inner screens show back button + page title.
- Contractor bottom navigation is `Home`, `Scan`, `History`, `Rewards & Balance`.
- Formal page title remains `Rewards and Points Balance`.
- Helper full contractor mobile number is allowed after successful OTP login.
- Helper must not see all contractors, ContractorID, points, balance, rewards, history, or tier.
- Helper scan success must show scan success only, with no point amount and no account-balance copy.
- Helper Recent list shows max one contractor, only after successful OTP login, stored locally as convenience-only; OTP is still required every session.
- Support/help appears as a small footer/link where useful.
- Contractors `Collect` points and `Claim` rewards. Do not use `Redeem`.
- Visual direction: clean dense Google Pay / PhonePe-style clarity.

MCP execution notes:

- Historical legacy-project note: on 2026-06-11, `edit_screens` was run by screen family against the original `Electrical Retailer Loyalty App` project.
- In that legacy project, Stitch returned generated standardized screen variants, but `list_screens` and `get_project` still reported the original 35 visible source screens. Treat those generated variants as legacy review artifacts only.
- The current clean-project source of truth is the 36 kept screens listed below, not the older generated/superseded screen map.
- Direct design-system creation/update was attempted through `update_design_system`, `create_design_system`, and `create_design_system_from_design_md`; Stitch returned `Request contains an invalid argument.` `upload_design_md` accepted the DESIGN.md payload, but design-system creation from it failed.
- On 2026-06-11, a separate clean project was created because the original project became messy after refresh. Full-flow generation succeeded in smaller batches/single-screen calls after a one-shot full-flow prompt timed out.
- On 2026-06-12, the user manually deleted duplicate/unneeded screens in the clean project. `list_screens` now returns the current kept 36-screen inventory.
- A one-screen-at-a-time consistency pass was applied to existing kept screen IDs only. Focus areas: language toggle design, Rewards & Balance bottom-nav label/icon, rewards icon consistency, removal of bottom nav from inner/result/error screens, and helper data restrictions.
- The clean project design-system asset still includes some stale generated wording such as generic `Rewards` navigation and `Redeem` inside the design-system guidelines. Future screen prompts must explicitly override visible copy with `Rewards & Balance`, `Claim`, `Collect`, and `Scan QR`.
- MCP caveat: one Contractor History Ledger edit returned an unlisted generated variant (`df21cad0ebb64743be15909843ec93bc`). It is not part of the kept visible inventory. If it appears in Stitch UI after refresh, discard it and keep `67192c89ab914d33a0202489ff093368`.

## Usage

1. Use **Volt Rewards - Clean End User Flow** (`projects/9940539769254693568`) as the active Stitch review target.
2. Do not generate new screens for consistency work. Edit existing kept screens one at a time.
3. After every Stitch MCP edit, call `list_screens` and confirm the kept visible inventory remains 36 screens.
4. Use the **Master Prompt** only if the full kept screen set must be regenerated later.
5. Use the **Screen-Specific Prompts** to correct individual kept screens only.
6. Keep generated screens review-only until the client approves. Do not treat generated UI as locked PRD until reviewed.
7. Use **Electrical Retailer Loyalty App** (`projects/255631333562829582`) only as legacy reference unless explicitly asked to clean or compare it.

## Current Kept Stitch Screen Inventory

These are the only current frontend/end-user screens to document and review in the clean Stitch project:

1. `233175f913fa47f3a8d2fd40c6226ba5` - Splash Screen
2. `a50eec3bceba41dc89ffbcf82d1dedc6` - Language Selection
3. `39d4364f8af741e68e9bd3560e681e1f` - Entry & Login Flow
4. `80f1cd79330a428984ce1cdec062ac05` - Role Selection
5. `c4ded4437e364d2182ff25665f1f1882` - Contractor Login
6. `418f008fe4de4209802586899bec5a76` - Contractor Not Found State
7. `9b79b917c22d493b958979dcba13b590` - Forgot ID
8. `9c795eee60be467f9331d4ca36d86cf6` - Forgot MPIN - ID Entry
9. `6f2340412a224ce8a23a4f407ced04b1` - OTP Verification
10. `6b41a4cac69545c78ecb24ddc795ddbb` - Reset MPIN
11. `a0d0e96e37aa4c619605cfa056f5da84` - Helper Login Entry
12. `1a6c9b437c2445359b722074365d2887` - Helper Not Found
13. `64e34b9a986d48409487aa4e67901c2d` - Helper OTP Verification
14. `e3d20971c8f94149b590fc0b98348b88` - Contractor Dashboard & Scanning
15. `70e06b38476948e0bf677606318bb622` - Contractor Scan QR Camera
16. `585c2390ccd7431eb1975c9fca0d6c0e` - Contractor Scan Success Result
17. `47e6db70440847fab5744dd52cda0184` - Contractor Scan Error - Already Claimed
18. `aa6100d1e48a4cb18279b086d492b190` - Contractor Scan Error - Expired
19. `ee157b0e37894d68b3aa27c0c060baa2` - Contractor Scan Error - Invalid QR
20. `a371f5453edc4004b88ce415108f37fc` - Contractor Scan Error - Network Retry
21. `67192c89ab914d33a0202489ff093368` - Contractor History Ledger
22. `37c17375ab7046d7953191efd9d96a9d` - Transaction History Details
23. `efe1599ddedd47ed8e602911808b44bd` - Balance Book & Points Ledger
24. `f6b13a6e57df4632a14dc7c2882092db` - Rewards and Points Balance - Rewards Catalog
25. `7595548e8bd747acb329a4f3ad8dcfd7` - Reward Detail & Claim Confirmation
26. `4c643405679445198cc04b9facb0e56c` - Reward Claim Successful
27. `65699e65eacc4183953c1f7304c8943e` - Contractor Profile
28. `11bb12405cc64ad59c90d4e7383de67c` - About Page
29. `dca29d732c1f49c8851fb50eda02837c` - Helper Scan Home
30. `6f56f525d11d4efd850cd84e05695b31` - Helper QR Scanner
31. `81246d68b72a4cae8be08068c93a7818` - Helper Scan Success
32. `e65a6e8bba974d8abbad43dcf0fa407f` - Helper Already Claimed
33. `649b2192a11f40eab1871dd405c1e65e` - Helper QR Expired
34. `6f84fdbd961043ffbcafc7140820d111` - Helper Invalid QR
35. `63c95bd49ddf43cfb31b69e9463908d3` - Helper Network Retry
36. `5b16231d831947ffb1b3940c6952bb02` - Helper Session Expired

## Master Prompt

```text
Design a high-fidelity mobile app UI for Volt Rewards, an electrical retailer loyalty program used in India by contractors/electricians and helpers.

Product context:
- Registered contractors/electricians collect reward points by scanning secure QR labels attached to electrical products.
- Helpers can scan QR codes on behalf of one selected contractor but must not see contractor points, balance, rewards, history, tier, or ContractorID.
- Contractors are registered by the retailer/admin only. Do not show signup or self-registration.
- The app supports Android and iOS and should feel like a polished production utility app, not a marketing landing page.

Personas:
1. Contractor
- Logs in with ContractorID + 4-digit MPIN.
- Can recover ContractorID through registered mobile number.
- Can reset MPIN using OTP sent to registered mobile number.
- Has full app access.
- Bottom navigation: Home, Scan, History, Rewards & Balance.
- Home and Profile headers show contractor identity.
- Inner screens show back button + page title.
- Can see tier, points, balance book, scan history, rewards, reward expiry, and claim rewards.

2. Helper
- Chooses Helper login.
- Does not see a full contractor list or searchable contractor directory.
- Enters the registered mobile number of the contractor they are helping.
- If the number belongs to a registered contractor, OTP is sent to that contractor. Helper obtains OTP offline and enters it.
- On later helper login, sees a Recent list with no more than one contractor, populated only after successful OTP login for that contractor.
- Recent is local secure-storage convenience only; OTP is required every session.
- Helper gets scan-only access.
- After OTP, helper may see selected contractor name, photo/avatar, and full mobile number.
- Helper session resets daily.

Language:
- Every screen includes compact `EN | हिंदी` language toggle.
- Default language is English. Do not overcrowd screens with full bilingual duplication.

Design direction:
- Build for working contractors and shop-connected helpers using the app at job sites and counters.
- Use clean dense Google Pay / PhonePe-style clarity.
- Use white/off-white/light gray surfaces, charcoal text, deep teal primary, saffron accent, green success, red error, and small bronze/silver/gold tier accents.
- Avoid purple/lavender, decorative blobs, large gradients, oversized hero layouts, heavy shadows, beige-heavy themes, and dark dashboard-heavy palettes.
- Typography should be Inter-like, compact, and readable. Do not use viewport-scaled fonts or negative letter spacing.
- Use 390px mobile baseline, 16px padding, 8px spacing rhythm, 48-56px touch targets, and 8px-or-less card/button radius.
- Cards are for repeated items, ledger rows, reward tiles, profile/identity summaries, and modals only.
- Buttons must be clear, consistent in height, and field-friendly.
- Use icons for scan, gift, history, home, phone, lock, language, support, and status states.

Terminology:
- Contractors Collect points.
- Contractors Claim rewards.
- Do not use Redeem/Redeemed/Redemption.
- Use Scan QR or Scan Product QR.
- Do not use Scan Invoice.

Generate and preserve this screen set:
1. Splash Screen
2. Language Selection
3. Entry & Login Flow
4. Role Selection
5. Contractor Login
6. Contractor Not Found State
7. Forgot ID
8. Forgot MPIN - ID Entry
9. OTP Verification
10. Reset MPIN
11. Helper Login Entry
12. Helper Not Found
13. Helper OTP Verification
14. Contractor Dashboard & Scanning
15. Contractor Scan QR Camera
16. Contractor Scan Success Result
17. Contractor Scan Error - Already Claimed
18. Contractor Scan Error - Expired
19. Contractor Scan Error - Invalid QR
20. Contractor Scan Error - Network Retry
21. Contractor History Ledger
22. Transaction History Details
23. Balance Book & Points Ledger
24. Rewards and Points Balance - Rewards Catalog
25. Reward Detail & Claim Confirmation
26. Reward Claim Successful
27. Contractor Profile
28. About Page
29. Helper Scan Home
30. Helper QR Scanner
31. Helper Scan Success
32. Helper Already Claimed
33. Helper QR Expired
34. Helper Invalid QR
35. Helper Network Retry
36. Helper Session Expired

Important behavior constraints:
- No self-registration.
- No full contractor directory for Helper.
- Helper can only scan QR for the selected contractor.
- Helper Recent shows max one contractor and still requires OTP.
- Helper scan success is point-free.
- Scan result states must clearly distinguish success, already scanned, expired, invalid/replaced QR, and network retry for both personas.
- Rewards are shop-claimable vouchers/prizes. Use placeholder examples like discount voucher, professional toolkit, air fryer, and retail gift card.
- Promotion/ad banners are compact in-app offer banners, not full-screen ads.
```

## Screen-Specific Prompts

Use these prompts only for the current kept screens listed above. Do not use them to create new screens during consistency work; edit the matching existing screen ID one screen at a time.

### 1. Splash Screen

```text
Edit the kept Splash Screen for Volt Rewards. Show the app mark/name, "Rewards for registered contractors", compact `EN | हिंदी`, subtle loading/version text, and no bottom navigation or profile chrome.
```

### 2. Language Selection

```text
Edit the kept Language Selection screen. Show Volt Rewards identity, title "Choose Language", options for English and हिंदी, Continue action, small "You can change this later" note, and support footer. No bottom navigation.
```

### 3. Entry & Login Flow

```text
Edit the kept Entry & Login Flow screen as the compact entry point into login. Show Volt Rewards identity, `EN | हिंदी`, clear Continue/Login action toward role selection, registered-user-only copy, and small support link. No signup, bottom navigation, profile photo, or post-login controls.
```

### 4. Role Selection

```text
Edit the kept Role Selection screen. Ask "Log in as" and show Contractor and Helper choices. Contractor says "Use ContractorID and MPIN"; Helper says "Scan for a contractor with OTP approval". Include compact `EN | हिंदी`, registered-user-only note, and support/help link. No signup or bottom navigation.
```

### 5. Contractor Login

```text
Edit the kept Contractor Login screen. Fields: Contractor ID and 4-digit MPIN. Primary action: Login. Secondary links: Forgot ID and Forgot MPIN. Include compact `EN | हिंदी`, support footer, and inline error states. No bottom navigation, avatar, or post-login controls.
```

### 6. Contractor Not Found State

```text
Edit the kept Contractor Not Found State. Message: "This ContractorID is not registered." Supporting copy: "Please contact the retailer to get onboarded." Actions: Try Again and Call Retailer. Include compact `EN | हिंदी` and support footer. No bottom navigation.
```

### 7. Forgot ID

```text
Edit the kept Forgot ID screen. User enters registered mobile number with +91 prefix. Primary action: Send ID via SMS. Explain ContractorID is sent only to the registered mobile number. Include Back to Login, compact `EN | हिंदी`, and masked confirmation. No bottom navigation.
```

### 8. Forgot MPIN - ID Entry

```text
Edit the kept Forgot MPIN - ID Entry screen. User enters ContractorID and taps Send OTP. Explain OTP goes only to the registered contractor mobile number. Include Back to Login, compact `EN | हिंदी`, and support footer. No bottom navigation.
```

### 9. OTP Verification

```text
Edit the kept OTP Verification screen for forgot MPIN. Show masked registered mobile number, 6-digit OTP entry, resend timer, Verify & Proceed action, Back, and compact `EN | हिंदी`. Do not imply OTP is sent anywhere except the registered contractor mobile number.
```

### 10. Reset MPIN

```text
Edit the kept Reset MPIN screen. User enters and confirms a new 4-digit MPIN. Include security note that staff will never ask for MPIN, primary action Update MPIN, compact `EN | हिंदी`, and no bottom navigation.
```

### 11. Helper Login Entry

```text
Edit the kept Helper Login Entry screen. Helper enters the contractor's registered mobile number. Primary action: Send OTP to contractor. Recent Contractor appears only after previous successful OTP login and contains max one contractor with name, full mobile number, Use, and clear/remove. Choosing Recent only prefills; OTP is still required. Include compact `EN | हिंदी`. Do not show ContractorID, points, balance, history, rewards, tier, or directory.
```

### 12. Helper Not Found

```text
Edit the kept Helper Not Found screen. Message: "No registered contractor found for this number." Include Try Again, Contact Retailer, compact `EN | हिंदी`, and support footer. Do not expose other contractors, directory browsing, ContractorID, points, balance, tier, rewards, or history.
```

### 13. Helper OTP Verification

```text
Edit the kept Helper OTP Verification screen. Show selected contractor avatar/photo if available, contractor name, masked phone before verification, and "OTP sent to this contractor. Ask them for the OTP to continue." Include 6-digit OTP, resend timer, Change contractor, Verify, and compact `EN | हिंदी`. Do not show ContractorID or points.
```

### 14. Contractor Dashboard & Scanning

```text
Edit the kept Contractor Dashboard & Scanning screen. Bottom nav selected: Home, Scan, History, Rewards & Balance. Header shows contractor identity, tier chip, compact `EN | हिंदी`, and profile/avatar entry. Show promotion banner, Scan QR primary action, Balance Book and History shortcuts, total/lifetime collected points, available points, tier progress, and rewards preview with Claim action. Use `card_giftcard` for rewards objects and `workspace_premium` for tier.
```

### 15. Contractor Scan QR Camera

```text
Edit the kept Contractor Scan QR Camera screen. Header: back + "Scan QR" + compact `EN | हिंदी`. Bottom nav Scan selected. Show camera preview, QR frame, flashlight toggle, manual code entry, "Align QR code within the frame", network status, and contractor identity strip with name + ContractorID.
```

### 16. Contractor Scan Success Result

```text
Edit the kept Contractor Scan Success Result screen. Header: back + "Scan Successful" + compact `EN | हिंदी`. Show restrained green success, product/category, QR short ID, points collected, updated available balance, tier progress, and "Points credited to your account." Actions: Scan Another QR, View Scan History, Go Home. No bottom navigation on this result screen.
```

### 17. Contractor Scan Error - Already Claimed

```text
Edit the kept Contractor Scan Error - Already Claimed screen. Header: back + "QR Already Scanned" + compact `EN | हिंदी`. Copy says the QR was already scanned and rewarded. Actions: Scan Another QR and View Scan History. No bottom navigation on this result/error screen.
```

### 18. Contractor Scan Error - Expired

```text
Edit the kept Contractor Scan Error - Expired screen. Header: back + "QR Code Expired" + compact `EN | हिंदी`. Copy says the QR expired 45 days after issue and points can be collected only for valid active codes. Actions: Scan Another QR and Contact Retailer. No bottom navigation.
```

### 19. Contractor Scan Error - Invalid QR

```text
Edit the kept Contractor Scan Error - Invalid QR screen. Header: back + "Invalid QR Code" + compact `EN | हिंदी`. Copy says the QR is no longer valid or has been replaced. Actions: Scan Another QR and Contact Retailer. Include a small help note. No bottom navigation.
```

### 20. Contractor Scan Error - Network Retry

```text
Edit the kept Contractor Scan Error - Network Retry screen. Header: back + "Could Not Verify QR" + compact `EN | हिंदी`. Copy asks user to check internet and try again. Actions: Try Again and Scan QR/Scan Later, with a small network status. No bottom navigation.
```

### 21. Contractor History Ledger

```text
Edit the kept Contractor History Ledger screen. Bottom nav History selected. Header title "History", subtitle "Scans and claims", compact `EN | हिंदी`, search, filters All / Collected / Claimed / Reversed / Expired, and compact ledger rows with date, product/reward, Self Scan or Helper source, points +/- amount, and status badge. Include Load More and empty state.
```

### 22. Transaction History Details

```text
Edit the kept Transaction History Details screen. Header: back + "Transaction Detail" + compact `EN | हिंदी`. Show product/reward, QR short ID if scan, date/time, points collected or deducted, scan source, status, expiry date, and reversal info if applicable. Actions: Scan Another QR and Contact Retailer. No bottom navigation.
```

### 23. Balance Book & Points Ledger

```text
Edit the kept Balance Book & Points Ledger screen inside Rewards and Points Balance. Page title "Rewards and Points Balance". Tabs: Balance Book, Rewards, Claims, with Balance Book selected. Summary metrics: Available Points, Lifetime Collected, Total Claimed, Reversed, Current Tier. Ledger rows cover QR scan credits, reward claim debits, product return reversals, adjustments, and possible negative balance. Bottom nav Rewards & Balance selected, using `card_giftcard`.
```

### 24. Rewards and Points Balance - Rewards Catalog

```text
Edit the kept Rewards and Points Balance - Rewards Catalog screen. Tabs: Balance Book, Rewards, Claims, with Rewards selected. Show available points, tier/progress, promotion banner, filters All / Eligible / Vouchers / Prizes, and reward cards for discount voucher, professional toolkit, air fryer, and retail gift card. Card actions say Claim; locked state says not enough points. Bottom nav Rewards & Balance selected, using `card_giftcard`.
```

### 25. Reward Detail & Claim Confirmation

```text
Edit the kept Reward Detail & Claim Confirmation screen. Header: back + "Claim Reward" + compact `EN | हिंदी`. Show reward image placeholder, reward name, points required, validity, eligibility, terms, "Claim from shop" instruction, and available balance. Primary action: Claim Reward. Confirmation modal: reward name, points to deduct, remaining balance, Confirm Claim, Cancel. No bottom navigation on this detail/confirmation screen.
```

### 26. Reward Claim Successful

```text
Edit the kept Reward Claim Successful screen. Header: back + "Claim Successful" + compact `EN | हिंदी`. Show success state, reward item, Pending Pickup badge, claim ID, points used, remaining balance, and "For Retailer Use" pickup summary. Actions: Back to Rewards & Balance and View in History. Use Claim wording only, no Redeem. No bottom navigation.
```

### 27. Contractor Profile

```text
Edit the kept Contractor Profile screen. Header shows contractor identity and compact `EN | हिंदी`. Show photo/avatar, name, ContractorID, registered mobile, current tier using `workspace_premium`, language setting, support/contact retailer, About, Logout, and app version. Registration fields are read-only with "Contact retailer to update". No Profile bottom-nav item.
```

### 28. About Page

```text
Edit the kept About Page for Volt Rewards. Header: back + "About" + compact `EN | हिंदी`. Include short purpose paragraph, retailer contact placeholder, address, phone, email, Terms & Conditions, Help & Support, Privacy Policy, and app version. Keep plain and trustworthy. No bottom navigation or marketing hero.
```

### 29. Helper Scan Home

```text
Edit the kept Helper Scan Home screen. Header title "Scanning For" + compact `EN | हिंदी`. Show selected contractor photo/avatar, name, full mobile number, compact promotion banner, primary action Scan Product QR, Change Contractor, Logout, and note "Helper session resets daily." No bottom nav, points, balance, tier, rewards, history, profile, or ContractorID.
```

### 30. Helper QR Scanner

```text
Edit the kept Helper QR Scanner screen. Header: back/cancel + "Scan QR" + compact `EN | हिंदी`. Show camera preview, QR frame, flashlight, manual code entry, and selected contractor strip with name + full mobile number. Copy says scan will be recorded for the selected contractor. No bottom nav, points, balance, rewards, history, tier, profile, or ContractorID.
```

### 31. Helper Scan Success

```text
Edit the kept Helper Scan Success screen. Header: back + "Scan Successful" + compact `EN | हिंदी`. Show success state, product/category, QR short ID if useful, selected contractor name and full mobile number, and neutral copy "Scan recorded for this contractor." Do not show point amount, Points Earned, balance, tier, rewards, history, account-credit copy, Claim/Collect copy, or ContractorID. Actions: Scan Another QR and Done.
```

### 32. Helper Already Claimed

```text
Edit the kept Helper Already Claimed screen. Header: back + "QR Already Scanned" + compact `EN | हिंदी`. Copy: "This QR code has already been scanned." Show selected contractor name and full mobile number. Actions: Scan Another QR and Done. No scan history, points, balance, rewards, bottom nav, or ContractorID.
```

### 33. Helper QR Expired

```text
Edit the kept Helper QR Expired screen. Header: back + "QR Code Expired" + compact `EN | हिंदी`. Copy: "This QR expired 45 days after it was issued." Show selected contractor name and full mobile number. Actions: Scan Another QR and Contact Retailer. No points, balance, rewards, history, bottom nav, tier, or ContractorID.
```

### 34. Helper Invalid QR

```text
Edit the kept Helper Invalid QR screen. Header: back + "Invalid QR Code" + compact `EN | हिंदी`. Copy says this QR is no longer valid or has been replaced. Show selected contractor name and full mobile number. Actions: Scan Another QR and Contact Retailer. No privileged contractor data, points, rewards, history, or bottom nav.
```

### 35. Helper Network Retry

```text
Edit the kept Helper Network Retry screen. Header: back + "Could Not Verify QR" + compact `EN | हिंदी`. Copy asks user to check internet and try again. Actions: Try Again and Scan QR/Scan Later. Show selected contractor context and small network status. No bottom nav, points, balance, rewards, history, tier, or ContractorID.
```

### 36. Helper Session Expired

```text
Edit the kept Helper Session Expired screen. Header: "Helper Session Expired" + compact `EN | हिंदी`. Copy: "Please select contractor again and enter a fresh OTP." Actions: Select Contractor and Logout. Keep clear, non-alarming, and point-free. No active contractor session state, bottom nav, points, rewards, history, or ContractorID.
```

## Visual Consistency Checklist

Use this after every Stitch edit or generation pass:

- Brand visible as `Volt Rewards`, with no `Volt Pro` or `Retailer Rewards`.
- `EN | हिंदी` appears on every screen as the same compact top-right pill treatment unless the screen layout makes top-right impossible.
- Auth/recovery screens have no post-login bottom nav or profile menu.
- Contractor bottom nav is exactly Home, Scan, History, Rewards & Balance.
- Rewards/catalog/claim/nav objects use `card_giftcard`; tier/member badges use `workspace_premium`.
- Helper screens have no bottom nav, points, balance, rewards, history, tier, profile, or ContractorID.
- Helper scan success has no point amount and no account-credit language.
- Reward actions say Claim, not Redeem.
- Point scan language uses Collect/Collected.
- Scanner language says Scan QR or Scan Product QR, not Scan Invoice.
- White/off-white/light gray surfaces dominate; no lavender/purple visual theme.
- Text, buttons, headers, and bottom nav labels do not overlap at 360px and 390px mobile widths.

## Open UI Decisions To Confirm With Client

- Final app logo and production brand colors for `Volt Rewards`.
- Exact Hindi copy and whether admin/mobile surfaces also need Hindi.
- Exact profile fields shown to contractor.
- Exact tier names and thresholds.
- Whether total accumulated points and available claimable points are separate values.
- Exact reward catalog, points required, claim confirmation flow, and pickup process.
- Banner/ad placement count, dimensions, scheduling, and targeting rules.
- Exact retailer support contact details and legal copy.
