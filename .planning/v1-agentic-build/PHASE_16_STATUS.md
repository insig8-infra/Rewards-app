# Phase 16 Status - Product-Grade Mobile App Baseline

Status: Complete for the Phase 16 product-grade baseline scope.

## Summary

Phase 16 corrected the end-user mobile app from a single-panel visible shell into a route-based app baseline:

- React Navigation auth stack, app stack, Contractor bottom tabs, Team Member limited tabs, and stack detail screens.
- Contractor login lands on Dashboard/Home.
- Contractor top-level tabs are Home, Scan, History, and Rewards.
- Sites, Profile, Reward Detail, and Balance Book are stack screens with visible back behavior.
- Team Member lands on a scan-first limited experience with only Scan and History tabs.
- Contractor human name is shown from `User.displayName`.
- Seeded client-facing data now uses `Ramesh Sharma`, `Pratik Shah`, `Neha Kulkarni`, `Joshi Residence`, and realistic electric-shop invoice products.
- Reward catalog seed rows now include replaceable temporary image data URLs through `RewardCatalogItem.imageUrl`.
- Reward tiles and detail screen render image-backed visuals instead of initials-only cards.

## Decisions Applied

- Contractor tabs: Home, Scan, History, Rewards.
- Sites/Profile/Help are reached from dashboard/profile actions, not permanent bottom-tab slots.
- Team Member: scan-first limited route with contractor identity and selected-site context.
- Reward image source: replaceable temporary generated/catalog images through `RewardCatalogItem.imageUrl`.
- Contractor human name source: `User.displayName`; no duplicate `Contractor.name` field.

## Implemented Files

- `apps/mobile/App.tsx`
- `apps/mobile/src/i18n.ts`
- `apps/mobile/package.json`
- `package-lock.json`
- `apps/api/prisma/seed.ts`
- `AGENTS.md`
- `.planning/v1-agentic-build/OPEN_QUESTIONS.md`
- `.planning/v1-agentic-build/architecture/DECISIONS.md`
- `.planning/v1-agentic-build/PHASE_16_EXECUTION_PLAN.md`
- `.planning/v1-agentic-build/runbooks/LOCAL_DATABASE.md`

## Verification

Automated:

- `npm run typecheck --workspace @volt-rewards/mobile` passed.
- `npm run typecheck --workspace @volt-rewards/api` passed.
- `npm run test:mobile` passed.
- `npm run test:api` passed.
- `npm run lint` passed.
- `npm test` passed: 95 tests.
- `git diff --check` passed.
- Post-cleanup rerun: `npm run typecheck --workspace @volt-rewards/api`, `npm run test:api`, `npm run lint`, and `git diff --check` passed.

Seed/runtime:

- `npm run db:seed --workspace @volt-rewards/api` passed with elevated local permissions.
- Post-cleanup seed readback through `GET /api/admin-web/contractors` returned 18 contractors, 0 old placeholder-label matches, and seeded contractor `9000001001` as `Ramesh Sharma`.
- API restarted at `http://127.0.0.1:3000`.
- Expo Web restarted at `http://127.0.0.1:3002`.
- API health returned `{"status":"ok","service":"volt-rewards-api"}`.

Security/dependency:

- `npm --cache .npm-cache audit --omit=dev` still reports the known Expo `uuid -> xcode` moderate advisory chain.
- `npm audit fix --force` would downgrade Expo to `46.0.21`, so no forced fix was applied.

Browser UAT:

- Auth screen opened at `http://127.0.0.1:3002`.
- OWNER reset generated temporary MPIN for seeded contractor `Ramesh Sharma`.
- Visible Contractor login with temporary MPIN reached SET MPIN.
- Visible SET MPIN saved `1234` and landed on Dashboard.
- Dashboard showed `Ramesh Sharma`, `Gold`, `1800` available points, selected-site context, Home/Scan/History/Rewards tabs, and dashboard quick actions.
- Rewards tab showed image-backed reward tiles with eligible/locked/fulfilled states.
- Reward Detail opened as a stack screen with visible `Go back`.
- Balance Book opened as a stack screen with visible `Go back`.
- Team Member OTP request/verify used visible controls and landed on scan-first limited route.
- Team Member had only Scan and History tabs; no Rewards/Profile/Sites management tabs were exposed.
- Team Member selected-site context loaded as `Joshi Residence, B-1202, Gulmohar Heights, Andheri West, Mumbai`.
- Fresh browser tab showed 0 console errors and 1 known React Native Web `props.pointerEvents` warning.

Screenshots:

- `.planning/v1-agentic-build/evidence/phase16-mobile-auth.png`
- `.planning/v1-agentic-build/evidence/phase16-mobile-dashboard.png`
- `.planning/v1-agentic-build/evidence/phase16-mobile-rewards.png`
- `.planning/v1-agentic-build/evidence/phase16-mobile-reward-detail.png`
- `.planning/v1-agentic-build/evidence/phase16-mobile-balance-book.png`
- `.planning/v1-agentic-build/evidence/phase16-mobile-team-member-scan.png`
- `.planning/v1-agentic-build/evidence/phase16-mobile-team-member-history.png`

## Residual Risks

- Native iOS/Android simulator/device validation is still required before claiming native hardware-back, keyboard, image rendering, and store-build behavior as fully proven.
- QR scan result remains toast/status based while QR camera scanning is still a later native slice.
- Site create/edit still lives inside the Sites stack screen rather than separate create/edit screens; acceptable for this baseline but should be revisited in deeper site-management polish.
- The development seed now renames known historical placeholder contractor labels such as `Demo`, `Runtime Gate`, `UAT`, `Isolated`, `Browser Upload`, and `UI Path Probe` to human names. Future ad-hoc UAT scripts must continue to avoid placeholder labels.
- React Navigation 8 packages are alpha/next releases because the project is already on a future React/React Native/Expo stack. Re-check stable React Navigation compatibility before production release.
- Final client reward images remain a content replacement task.
