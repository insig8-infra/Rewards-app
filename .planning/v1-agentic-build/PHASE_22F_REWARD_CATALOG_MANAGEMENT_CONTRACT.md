# Phase 22F Contract - Reward Catalog Management

Status: Implemented and verified
Created: 2026-07-07
Completed: 2026-07-07

## Source Inputs

- User clarification on 2026-07-07 that Admin Web Rewards is also the reward-list management surface.
- `AGENTS.md`
- `REQUIREMENTS_LEDGER.md`
- `OPEN_QUESTIONS.md`
- `PHASE_22_STATUS.md`
- `PHASE_22E_UAT5_REWARD_SEMANTICS_CONTRACT.md`
- `architecture/API_CONTRACTS_DRAFT.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`

## Product Intent

Rewards is not only a claim fulfillment desk. It must also let the OWNER manage the reward catalog shown to contractors.

OWNER can create, update, bulk-upload, image-manage, stock-manage, and deactivate rewards. STAFF can view Reward History but cannot manage catalog items or fulfill claims.

Admin Mobile must eventually expose the same OWNER reward catalog management capability, optimized for mobile screens.

## Catalog Fields

Each reward catalog item must support:

- Reward code/SKU for stable CSV update matching.
- Reward name.
- Quick description.
- Multiple reward images.
- Internal reward value in INR.
- Contractor-facing reward points required to unlock/get the reward.
- Tier requirement where applicable: Silver, Gold, Platinum, Diamond, or no tier gate.
- Total quantity controlled by OWNER.
- Active/inactive/draft state.
- Derived stock summary: active Claim Raised reservations, delivered quantity, available quantity, and sold-out state.

Important display rule:

- `Reward Value in INR` and `Quantity` are internal admin metrics.
- Contractor-facing app shows reward name, description, images, tier/progress, and required points. It must not expose internal procurement/reward value or total stock unless later approved.

## Stock Semantics

Catalog availability must be derived from claims, not from client UI state.

- Available quantity = total quantity minus active `Claim Raised` claims minus `Delivered` claims.
- `Claim Raised` reserves one unit immediately.
- Contractor cancellation releases the reserved unit and restores points.
- QR reversal claim revocation releases the reserved unit.
- `Delivered` consumes the unit permanently.
- Inactive rewards do not appear in the general contractor catalog.
- Sold-out rewards do not appear in the general contractor catalog.
- Existing contractor-specific active claims and historical Balance Book/Reward History records must remain visible even if the reward later becomes inactive or sold out.
- OWNER cannot reduce total quantity below already reserved plus delivered quantity unless a future explicit over-allocation workflow is approved.

## CSV Upload

Admin Web must provide CSV upload to populate or update catalog items.

Recommended first CSV template:

```csv
rewardCode,rewardName,quickDescription,rewardValueInr,pointsRequired,tierRequired,quantity,status
RW-TOOLBOX-01,Premium Toolbox,Heavy-duty electrician toolbox,950,500,Silver,20,ACTIVE
```

CSV behavior:

- `rewardCode` is required and is the stable upsert key.
- CSV can create new catalog rows or update existing rows.
- CSV must preview validation errors before commit.
- CSV does not satisfy the image requirement unless a future approved image-import mechanism is added.
- Rows without at least one image must remain draft/incomplete and must not appear in contractor catalog.
- OWNER must upload at least one image before activating/publishing a reward.

## Required Surfaces

### Admin Web

The existing `/rewards` page should become a role-aware reward operations workspace:

- Rewards landing defaults to daily reward operations, not setup/configuration.
- OWNER landing sections:
  - Claim Desk.
  - Reward History.
  - Explicit `Manage Reward Catalog` entry action.
- Catalog Management opens as a nested workspace within Rewards and has a visible back action to return to the daily Rewards landing.
- STAFF:
  - Reward History only.

Catalog Management must support:

- Search, filter, and sort.
- Status filter: Active, Draft/Needs Image, Inactive, Sold Out.
- Create/edit drawer or detail screen.
- Multiple image upload and image ordering.
- Reward image upload must use the shared visible upload-control pattern. On Admin Web this means a visible native `input[type=file]` unless a custom wrapper has explicit manual-equivalent browser evidence. Direct hidden-input file setting, nested labels, or programmatic picker clicks are not sufficient UAT evidence.
- Reward image upload accepts PNG, JPG, or JPEG only and rejects files at or above 2 MB with a visible error before upload.
- CSV upload with preview and commit.
- Deactivate/reactivate.
- Stock and reservation summary.
- Clear validation for missing images, invalid points/value/quantity, duplicate reward code, and quantity below reserved/delivered count.

### Admin Mobile

Admin Mobile OWNER must get a mobile-optimized reward catalog management surface:

- Catalog list.
- Create/edit core fields.
- Image upload from device through the OS media picker with explicit permission/cancel/error handling.
- Deactivate/reactivate.
- Stock summary.
- CSV upload may be Admin Web-only for the first mobile slice unless a mobile file-picker flow is explicitly approved.

STAFF must not see reward catalog management controls.

### Contractor App

Contractor catalog must read from managed catalog data:

- Show only active, image-backed, available rewards in the general catalog.
- Hide inactive, draft/needs-image, and sold-out rewards from general browsing.
- Keep contractor-owned active claims and historical reward records visible through claim/history/balance-book flows.

## Data Model Direction

The current schema is insufficient because `RewardCatalogItem` only has one `imageUrl` and no stock/value/CSV identity.

Required model changes:

- Add stable `code`/SKU.
- Add `quickDescription` or align existing `description` to quick description.
- Add `cashValueInr` internal field.
- Add `totalQuantity`.
- Add `status` values that can represent draft/incomplete, active, and inactive.
- Add `RewardCatalogImage` table with reward item id, image URL/storage key, alt text, sort order, created timestamp, and optional owner actor metadata.
- Preserve existing `RewardClaim.rewardItemId` references when catalog items are updated or deactivated.

## API Contract Direction

Admin Web:

- `GET /admin-web/rewards/catalog` OWNER only.
- `POST /admin-web/rewards/catalog` OWNER only.
- `PATCH /admin-web/rewards/catalog/:rewardId` OWNER only.
- `POST /admin-web/rewards/catalog/:rewardId/images` OWNER only.
- `DELETE /admin-web/rewards/catalog/:rewardId/images/:imageId` OWNER only.
- `POST /admin-web/rewards/catalog/:rewardId/deactivate` OWNER only.
- `POST /admin-web/rewards/catalog/:rewardId/reactivate` OWNER only.
- `POST /admin-web/rewards/catalog/csv/preview` OWNER only.
- `POST /admin-web/rewards/catalog/csv/commit` OWNER only.

Admin Mobile:

- `GET /admin-mobile/rewards/catalog` OWNER only.
- `POST /admin-mobile/rewards/catalog` OWNER only.
- `PATCH /admin-mobile/rewards/catalog/:rewardId` OWNER only.
- `POST /admin-mobile/rewards/catalog/:rewardId/images` OWNER only.
- `POST /admin-mobile/rewards/catalog/:rewardId/deactivate` OWNER only.
- `POST /admin-mobile/rewards/catalog/:rewardId/reactivate` OWNER only.

Contractor:

- Existing `GET /rewards/catalog` must filter out inactive, draft/needs-image, and sold-out rewards from the general catalog.
- Existing reward detail/redeem endpoints must re-check catalog active state, image-backed readiness, and available quantity before creating `Claim Raised`.

## Seed Data

Seed data must include a realistic dummy reward catalog with multiple reward types, at least one image each, realistic points, internal INR values, and quantities.

Examples:

- Premium Toolbox.
- Wire Stripper Kit.
- Cordless Drill.
- Safety Helmet Kit.
- Electrician Tool Bag.
- Air Fryer.

Seed names and descriptions must be client-facing quality, not test labels.

## Completion Gate

- Schema migration covers catalog fields and images without breaking existing reward claims.
- Seed creates realistic active rewards with at least one image each.
- Admin Web OWNER can create/edit/deactivate/reactivate catalog items.
- Admin Web OWNER can upload at least one image per reward and cannot activate image-less rewards.
- Admin Web reward-image upload is verified through the same visible native-input path as contractor and staff photo upload, including DOM hit-target, accept-list, enabled/visible, and clean chooser-state checks.
- Admin Web OWNER can upload a CSV, preview validation, and commit valid rows.
- Admin Web STAFF cannot access catalog management controls or APIs.
- Admin Mobile OWNER can manage reward catalog core fields and images.
- Admin Mobile image upload is verified through the visible device-picker path on Expo Web and must receive native device/simulator verification before store-readiness is claimed.
- Admin Mobile STAFF cannot access catalog management.
- Contractor catalog hides inactive, image-less, and sold-out rewards.
- Claim creation reserves stock and rejects sold-out rewards.
- Claim cancellation/revocation releases stock.
- Delivered claims consume stock.
- Tests cover stock derivation, CSV validation, role guards, contractor filtering, and existing claim stability after catalog deactivation.
- Browser/mobile visible-control UAT captures OWNER catalog management, STAFF denial, CSV preview/commit, image requirement, sold-out hiding, and existing-claim visibility.

## Questions To Confirm Before Coding

Resolved on 2026-07-07:

1. Image storage: use Supabase Storage for reward images in the storage-backed path. Seeded rewards may use dummy online or generated images uploaded/stored through the reward image path. Superseded for development on 2026-07-16 by DEC-052: local UAT defaults to `MEDIA_STORAGE_MODE=local` to control Supabase egress.
2. CSV upload: Admin Web-only for v1. CSV is not required on Admin Mobile.
3. Tier behavior: no tier gate for rewards in this slice.

## Implementation Notes

- Supabase Storage bucket: `reward-images`.
- Seeded primary reward images are fetched from dummy online/generated sources once and persisted to Supabase Storage when Supabase credentials are configured.
- Development/local UAT can use `MEDIA_STORAGE_MODE=local`, which keeps image validation and image-required readiness rules but returns one shared placeholder instead of Supabase Storage URLs.
- Client Demo 2 amendment: normal Admin Web `New Reward` creation must system-populate Reward Code. CSV still uses reward code as the stable upsert key for bulk create/update.
- Admin Web CSV template is:

```csv
rewardCode,rewardName,quickDescription,rewardValueInr,pointsRequired,quantity,status
RW-TEST-01,Tool Bag,Canvas electrician tool bag,1200,900,10,ACTIVE
```

- Reward tiers are not used for gating in Phase 22F; seeded and newly written rewards default to no tier requirement.
- CSV rows can create/update catalog records, but image-less rows remain hidden from the contractor catalog until OWNER uploads at least one image.
- Admin Mobile implements core catalog management and device image upload. CSV remains Admin Web-only.

## Verification

- `npm test` passed across domain, API, Admin Web, contractor mobile, and Admin Mobile.
- `npm run prisma:migrate:deploy --workspace @volt-rewards/api` applied migration `202607070002_reward_catalog_management` to Supabase via the shared pooler.
- `npm run db:seed --workspace @volt-rewards/api` succeeded after migration.
- Browser UAT passed on Admin Web OWNER `/rewards`:
  - Rewards landing rendered Claim Desk and Reward History without directly rendering Catalog Management.
  - `Manage Reward Catalog` opened the nested catalog workspace with 5 seeded rewards.
  - `Back to Rewards` returned to the daily rewards landing.
  - Native file picker opened for reward image upload.
  - Image upload persisted through Supabase Storage under `reward-images`.
  - Smart TV image count changed from 1 to 2 after upload.
  - All seeded primary reward images resolve through Supabase Storage public object URLs.
  - CSV preview accepted a valid row and warned that image-less ACTIVE rows remain unpublished/draft.
  - Desktop overflow scan found no horizontal page overflow or element overflow offenders.
- Browser UAT passed on Admin Web STAFF `/rewards`:
  - Reward Catalog Management panel is not rendered.
  - Direct catalog API call returned `403 Actor is not permitted to perform this action.`
  - Reward History remains visible.
- Browser UAT passed on Admin Mobile web:
  - STAFF session has no Rewards tab.
  - OWNER session has Rewards tab.
  - OWNER Rewards screen loads seeded catalog items and stock/image counts.
  - Mobile viewport overflow scan found no horizontal page overflow or element overflow offenders.
- Screenshot evidence:
  - `.planning/v1-agentic-build/evidence/phase-22f-admin-web-reward-catalog-nested.png`
  - `.planning/v1-agentic-build/evidence/phase-22f-admin-mobile-reward-catalog.png`

Known UAT side effect:

- The seeded `RW-SMART-TV-01` reward now has a second uploaded image in Supabase Storage from the browser upload verification.
