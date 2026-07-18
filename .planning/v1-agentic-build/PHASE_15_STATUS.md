# Phase 15 Status - Rewards, Balance Book, And OWNER Fulfillment

Status: Complete for the Phase 15 functional slice. Product-grade reward presentation and mobile navigation remain follow-up work.

## Summary

Phase 15 implements the ledger-backed Rewards slice across API, end-user mobile, and Admin Web:

- Contractor Rewards catalog with Silver/Gold/Platinum/Diamond tier eligibility.
- Reward progress and locked/eligible/chosen/fulfilled states.
- Reward redeem with Claim ID and available-point deduction.
- Contractor cancellation before fulfillment with point restoration and eligibility recalculation.
- Balance Book with chronological reward and scan-credit entries plus filters.
- Admin Web OWNER Claim ID lookup, mock OTP send, OTP verification, and Delivered/Collected fulfillment.
- STAFF denial in UI and server-side API guard.

This status does not claim final product-grade mobile rewards UX. Current mobile reward tiles are functional and API-connected, but product completion requires image-backed reward tiles/details, real navigation, and review against `PRODUCT_GRADE_PLATFORM_STANDARD.md`.

## Decisions Applied

- Rewards use configurable physical catalog seed data, including toolbox and air fryer examples.
- Tiers are Silver, Gold, Platinum, and Diamond.
- Total accumulated points are lifetime gross and do not decrease on reversal.
- Points Available is current redeemable balance.
- Contractor cancellation cutoff is OWNER Fulfilled/Delivered marking, not OTP initiation.
- Fulfilled rewards stay fulfilled if later returns create negative balance.
- QR earning rule is documented as configurable BUSY `tmpItemCode` points table for the Phase 15 historical slice.
- Supersession note: Client Demo 2 / Phase 26 updates this into the Admin Web ItemCodes master, supporting fixed points now and `% of Price` points after Phase 26B clarifies price base and rounding.

## Implemented Files

- `apps/api/src/rewards/rewards.module.ts`
- `apps/api/src/rewards/rewards.controller.ts`
- `apps/api/src/rewards/admin-web-rewards.controller.ts`
- `apps/api/src/rewards/rewards.service.ts`
- `apps/api/src/rewards/rewards.service.test.ts`
- `apps/mobile/App.tsx`
- `apps/mobile/src/api.ts`
- `apps/mobile/src/i18n.ts`
- `apps/mobile/src/i18n.test.ts`
- `apps/admin-web/app/rewards/page.tsx`
- `apps/admin-web/src/components/AdminRewardsWorkspace.tsx`
- `apps/admin-web/src/api/adminApi.ts`
- `apps/admin-web/src/api/adminApi.test.ts`
- `apps/api/prisma/seed.ts`
- `packages/domain/src/permissions.ts`
- `packages/domain/src/permissions.test.ts`

## Verification

Automated:

- `npm test` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `git diff --check` passed.
- API test count after this slice: 51 API tests.
- Root test count after this slice: 95 tests.

Runtime:

- API health verified at `http://127.0.0.1:3000/api/health`.
- Admin Web verified at `http://127.0.0.1:3001/rewards`.
- Mobile Expo Web verified at `http://127.0.0.1:3002`.
- Supabase/Postgres seed executed successfully for reward catalog data.

Browser UAT:

- Mobile Contractor login with demo contractor.
- Mobile Rewards catalog rendered with eligible, locked, chosen, and fulfilled states.
- Mobile redeem created Claim ID and deducted 500 points.
- Mobile Balance Book showed `-500` redeem and `+500` cancel restore rows.
- Mobile cancel restored available points and removed stale active Claim ID display.
- Admin Web OWNER lookup loaded active Claim ID `CLM-3F8632`.
- Admin Web mock OTP send displayed dev OTP.
- Admin Web fulfillment marked claim `FULFILLED`.
- Admin Web buttons disabled after fulfillment.
- STAFF UI showed blocked panel.
- STAFF API lookup returned HTTP 403.
- Mobile reload after Admin fulfillment showed `Delivered` with no cancel control.

Screenshots:

- `.planning/v1-agentic-build/evidence/rewards-mobile-catalog.png`
- `.planning/v1-agentic-build/evidence/rewards-mobile-claimed.png`
- `.planning/v1-agentic-build/evidence/rewards-mobile-balance-book.png`
- `.planning/v1-agentic-build/evidence/rewards-admin-fulfilled.png`
- `.planning/v1-agentic-build/evidence/rewards-mobile-fulfilled.png`

Console:

- Mobile: 0 errors, 1 known React Native Web deprecation warning for `props.pointerEvents`.
- Admin Web: 0 errors, 0 warnings.

## Residual Risks

- Seeded demo contractor points are configurable demo data. Older demo scan ledger rows may not replay exactly to the seeded balance because the seed adjusted the demo balance for reward testing. Product reward mutations themselves write ledger rows atomically.
- Production SMS/WhatsApp provider remains open; Phase 15 uses mock OTP delivery.
- Final client reward catalog, reward images, point costs, tier thresholds, and full `tmpItemCode` points mapping remain configurable business content.
- Mobile reward catalog presentation still needs product-grade images/media, richer tile/detail layout, and real app navigation/back behavior.
- Admin Mobile reward fulfillment is not included in this slice.
- Returned-product QR reversal and post-fulfillment negative balance are preserved in rules/contracts but remain for the Admin Mobile return/reversal slice.
