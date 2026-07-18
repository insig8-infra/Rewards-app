# Phase 14 Status - Mobile Experience Contract And Thin End-User Shell

## Verdict

Complete for the Phase 14 visible-shell/API-validation scope. Not complete as the final product-grade mobile navigation baseline.

Phase 14 corrects the backend-only drift by adding an Expo/React Native end-user mobile app shell for Contractor and Team Member journeys, wired to the existing persisted auth, site, scan, and scan-history APIs.

Follow-up product-grade correction is required before treating the mobile app as production UX: real navigation stack, dashboard landing, back behavior, product-like seed data, and richer screen structure.

## Requirements Covered

- `AUTH-002` through `AUTH-014`: Contractor MPIN and Team Member OTP flows are visible and API-connected.
- `AUTH-019`: Team Member Recent contractor is local convenience state only, appears after successful OTP login, and can be cleared.
- `AUTH-021` through `AUTH-026`: Mobile bearer sessions are used for protected end-user flows; OWNER reset MPIN was used during UAT.
- `PLAT-006` through `PLAT-008`: Mobile app workspace, store-ready config baseline, secure native storage path, environment-driven API base URL, and Expo build config are in place.
- `SITE-001` through `SITE-010`: Contractor site create/edit/archive and Team Member read-only site selection are visible and API-connected.
- `SCAN-001` through `SCAN-012`: Site-scoped scan entry, success history, Team Member attribution, Contractor full history, and Team Member scoped history are visible and API-connected.

## Delivered

- New `@volt-rewards/mobile` Expo/React Native workspace.
- `apps/mobile/app.json`, `eas.json`, `tsconfig.json`, Expo Web script, iOS/Android package identifiers, and release-build profiles.
- Theme tokens and PayTM/PhonePe-inspired mobile UX patterns without copied branding/assets.
- Hindi/English localization resources and visible language toggle from app launch.
- Contractor flows:
  - temporary MPIN login
  - first-login SET MPIN
  - normal MPIN login
  - change MPIN panel
  - site create/edit/archive
  - site selection
  - QR token scan placeholder
  - full scan history
- Team Member flows:
  - contractor mobile + team member mobile OTP request
  - mock dev OTP verify
  - one recent contractor after successful login
  - clear/remove recent contractor
  - active site selection
  - QR token scan placeholder
  - Team Member-scoped scan history
- Mobile storage:
  - native `expo-secure-store`
  - web-only localStorage fallback for Expo Web UAT
- Backend fixes exposed by Phase 14 UAT:
  - `GET /scan/history` now scopes Team Member history by actor mobile.
  - `POST /admin-web/contractors/:contractorId/reset-mpin` accepts an empty POST body.
  - Mock BUSY import batches QR placeholder creation to avoid Prisma transaction timeout on larger invoices.
- Scan result now updates the mobile session balance from the API response.
- UI polish pass based on `Sample_References/Stitch_EndUserFlow_design.md`:
  - shifted mobile theme to deep teal/saffron ledger-style tokens
  - upgraded login hero, identity summary, balance metrics, action tiles, bottom navigation, input shells, site rows, and scan-history ledger rows
  - added explicit accessibility labels where decorative tab/action symbols would otherwise concatenate with labels

## Visible UAT

Test target:

- Mobile viewport Expo Web: `http://127.0.0.1:3002`
- API: `http://127.0.0.1:3000/api`

Screenshots captured:

- `/tmp/rewards-mobile-01-login.png`
- `/tmp/rewards-mobile-02-contractor-home.png`
- `/tmp/rewards-mobile-03-sites-created.png`
- `/tmp/rewards-mobile-04-sites-archived.png`
- `/tmp/rewards-mobile-05-contractor-history.png`
- `/tmp/rewards-mobile-06-team-history.png`
- `/tmp/rewards-mobile-07-team-recent.png`
- `/tmp/rewards-mobile-08-contractor-full-history.png`

UAT paths passed:

- Hindi -> English language toggle on launch.
- Contractor temporary MPIN login -> SET MPIN -> authenticated shell.
- Contractor site create -> edit -> archive through visible controls and API responses.
- Mock BUSY invoice import -> QR print -> Contractor scan -> history success.
- Scan success updates displayed balance.
- Team Member login shows no recent contractor before first successful OTP login.
- Team Member OTP request/verify through visible controls.
- Team Member QR scan and scoped history show only Team Member-attributed history.
- Team Member recent contractor appears after successful OTP login and clear/remove hides it.
- Contractor re-login shows full history including Team Member mobile attribution.
- Console check had no app errors; only Expo dev information and browser verbose password-field messages.
- UI polish screenshots captured:
  - `/tmp/rewards-mobile-redesign-01-login.png`
  - `/tmp/rewards-mobile-redesign-02-hindi.png`
  - `/tmp/rewards-mobile-redesign-03-home-settled.png`
  - `/tmp/rewards-mobile-redesign-04-scan.png`
  - `/tmp/rewards-mobile-redesign-05-history.png`
  - `/tmp/rewards-mobile-redesign-06-team-login.png`

## Verification

- Context7 docs checked before implementation:
  - React Native website docs for TypeScript, TextInput, StatusBar, StyleSheet, and core component behavior.
  - Expo docs for TypeScript config, app config, EAS build profiles, and SecureStore.
- `npm run test --workspace @volt-rewards/api`: pass, 48 tests.
- `npm run test --workspace @volt-rewards/mobile`: pass, 5 tests.
- `npm test`: pass, 91 tests total.
- `npm run lint`: pass.
- `git diff --check`: pass.
- `npm ls uuid xcode --all`: confirms remaining `expo -> @expo/config-plugins -> xcode -> uuid@7.0.3` chain.
- `npm --cache .npm-cache audit --omit=dev`: fails with 10 moderate advisories from the Expo tooling chain above; npm's automated fix would force a breaking downgrade to `expo@46.0.21`.

## Security And Evaluation Notes

- Raw MPIN and OTP values remain form-entry state only.
- Bearer sessions are stored through SecureStore on native platforms.
- Web localStorage is limited to Expo Web development/UAT fallback.
- Team Member Recent contractor is non-authoritative, local-only, and never bypasses OTP.
- Team Member scan history is server-scoped by authenticated actor mobile, not client filter logic.
- Mobile camera/contacts permissions are not requested in Phase 14; app config includes purpose-copy groundwork for later native flows.

## Residual Risks

- Native iOS/Android simulator/device validation is still required before claiming camera, keyboard, SecureStore, and store-build readiness as fully proven.
- QR scanning is token-entry placeholder only; camera scan implementation remains a future mobile slice.
- Production SMS/WhatsApp provider, OTP/MPIN throttling, and lockout policies remain open before launch hardening.
- Expo's current dependency chain reports a moderate `uuid` advisory through `xcode`; no safe npm audit fix is available without downgrading Expo.
- Rewards, Balance Book, catalog, redemption, and fulfillment remain future slices.
