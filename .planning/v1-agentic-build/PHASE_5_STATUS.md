# Phase 5 Status - Admin Web QR Print Shell

Updated: 2026-06-22

## Completed

- Added `apps/admin-web` Next.js App Router workspace.
- Added Admin Web QR print workflow as the first screen.
- Added central development actor API client:
  - Sends guarded actor headers.
  - Keeps actor role/user id out of protected request bodies.
- Added API client test for actor header/body separation.
- Added operational UI:
  - BUSY mock invoice list.
  - Import action.
  - Line item selection.
  - Quantity controls with max clamping.
  - Print action.
  - Latest printed unit/token display.
  - Desktop and mobile responsive layout.
- Added lucide-react icons for navigation and controls.
- Added Admin Web workspace to root `test`, `typecheck`, and `lint` scripts.
- Added app icon to avoid favicon 404.
- Ran Playwright smoke checks for desktop and mobile.

## Files Added

- `apps/admin-web/package.json`
- `apps/admin-web/tsconfig.json`
- `apps/admin-web/next.config.ts`
- `apps/admin-web/next-env.d.ts`
- `apps/admin-web/app/layout.tsx`
- `apps/admin-web/app/page.tsx`
- `apps/admin-web/app/globals.css`
- `apps/admin-web/app/icon.svg`
- `apps/admin-web/src/api/adminApi.ts`
- `apps/admin-web/src/api/adminApi.test.ts`
- `apps/admin-web/src/components/QrPrintWorkspace.tsx`
- `apps/admin-web/AGENTS.md`
- `apps/admin-web/CLAUDE.md`

## Files Updated

- `package.json`
- `package-lock.json`
- `.gitignore`

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed.
- `npm run build --workspace @volt-rewards/admin-web` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.

Current test count: 36 passing.

## Post-Audit Update - Mock BUSY Invoice Realism

- Added realistic electric-shop mock invoice fixture requirements as `WEB-018`.
- Expanded mock BUSY invoices with Havells, Atomberg, Wipro, Finolex, Legrand, Philips, Polycab, and Anchor product lines.
- Mock invoices now carry invoice number, date/time, seller/customer GST details, taxable totals, GST totals, round-off, final total, HSN/unit/rate/tax line metadata, and points per unit.
- Persisted mock invoice and line metadata into existing `rawSource` fields without a schema migration.
- Updated the Admin Web shell's mock invoice display data to use the richer product names and invoice summaries.

Verification after update:

- `npm run prisma:validate --workspace @volt-rewards/api` passed.
- `npm run typecheck` passed.
- `npm test` passed with 36 tests.
- `npm run lint` passed.
- `npm run build --workspace @volt-rewards/admin-web` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.

## Important Implementation Notes

- Admin Web scope has been clarified after this phase: future web slices must support all non-camera OWNER/STAFF admin workflows available in Admin Mobile.
- Returned-product QR status scan, cancel, and reverse remain Admin Mobile only in v1 because they require mobile camera scanning and label-removed/discarded confirmation.
- Mock BUSY invoice data must stay realistic until actual BUSY API integration is available, including electric-shop product lines and invoice tax/totals metadata.
- The UI currently uses mock line templates after import because backend invoice detail endpoints do not exist yet.
- Import and print actions call guarded backend endpoints and require the API server plus local database to be available for live end-to-end operation.
- The dev actor selector is temporary and feeds the centralized API client only.
- Next.js is pinned to `16.3.0-canary.60` because stable `16.2.9` still pins vulnerable `postcss@8.4.31`; canary currently uses `postcss@8.5.10` and keeps audit green.
- Return to stable Next once the PostCSS fix is available in a stable release.

## Next Slice

Database-backed Admin Web invoice list/detail endpoints and UI removal of mock line templates were completed in `PHASE_6_EXECUTION_PLAN.md` and `PHASE_6_STATUS.md`.

The full product build proceeds on mock BUSY. Admin Web remains the full browser admin portal and must implement all non-camera Admin Mobile workflows in subsequent slices.
