# Phase 25 Learning Log - Mobile UAT Remediation And Persistent Scan Cart

Status: Active  
Created: 2026-07-10

## Rule

If implementation exposes a mismatch between the product workflow and code, update the plan/contracts/evals before continuing feature breadth.

## Learning Entries

### L-2026-07-10-01 - Backend Contract Before Mobile Polish

Observation:

- Manual UAT changed the scan workflow from immediate credit to persistent scan cart.
- Mobile UI polish built on the old API would create rework and false confidence.

Harness change:

- Phase 25 starts with backend persistent scan cart and tests before broad mobile UI redesign.

Effect on future work:

- UI screen contracts must reference actual API state names and readback behavior.

### L-2026-07-10-02 - Mobile Screens Must Not Infer Ledger State From Scan Success

Observation:

- The mobile app still treated `POST /scan/qr` as a direct points-crediting operation after the backend contract changed to reservation-first.
- That mismatch would have produced a polished but incorrect flow: false balance updates, wrong success copy, and confusing history.

Harness change:

- Any future endpoint contract change must be followed by a typed client contract update before UI polish.
- Output eval must include a negative check for misleading user-facing copy when a backend state is pending or provisional.

Effect on future work:

- Phase 25B visual work starts from the cart contract, not from old scan success panels.
- Phase 25D Admin Mobile must use the same status vocabulary: `Ready to add` / reserved cart state distinct from printed, claimed, cancelled, and reversed states.

### L-2026-07-10-03 - Runtime Schema Must Be Part Of The Output Gate

Observation:

- Phase 25 scan-cart tests passed, but the running Supabase-backed API failed `GET /api/scan/cart` because `ScanCart` / `ScanCartItem` tables had not been migrated.
- The mobile UI silently hid the cart because the read endpoint returned `500`.
- This was not a browser-only proof issue; it was runtime schema drift between code and the actual dev database.

Harness change:

- DB-backed slices now require a migration file, `prisma migrate deploy/status` evidence, stale-server restart, and live API/database readback before visible UAT can be called complete.
- `APPROACH.md` now includes the 2026-07-10 runtime schema drift correction.
- `SECURITY_AND_EVALUATION_PLAN.md` now requires migration/readback evidence as part of output eval.

Effect on future work:

- For every future database model/enum/column change, the implementation wave must include migration creation, deployment, and runtime proof.
- A UI proof cannot pass if the backing API route is missing, stale, or failing against the live database, even when component/unit tests pass.

### L-2026-07-10-04 - Viewport Proof Must Verify Screen Identity

Observation:

- The first Phase 25C visual proof clicked by text labels and captured Home while labeling the screenshots as Rewards/History.
- The false proof did not mean the UI was broken; it meant the harness was not verifying that navigation landed on the intended screen.

Harness change:

- Mobile viewport proof must assert screen identity after navigation before checking the screen-specific UI requirement.
- Bottom-tab proof should use reliable mobile coordinates or accessibility roles, then validate visible screen text/state before recording evidence.

Effect on future work:

- Admin Mobile Phase 25D proof must include per-screen identity assertions for Dashboard, Contractors, Staff, Reports, Rewards, and any nested detail screens.
- A screenshot filename alone is not accepted as proof that the intended route rendered.

### L-2026-07-14-01 - Client Demo Deltas Need Requirement And Eval Routing

Observation:

- Client Demo 2 introduced new Admin Web, ItemCodes, and Scan QR workflow requirements after several related areas had earlier PASS evidence.
- Treating those notes as direct implementation tasks would risk mixing historical completion evidence with the latest client expectation.

Harness change:

- Created `CLIENT_DEMO_2_TRIAGE.md`.
- Updated requirements, roadmap, decisions, API/data contracts, open questions, and Phase 25 output/trajectory eval routing before implementation resumes.
- Added a new output eval case for stricter fresh scan-site selection instead of hiding it inside the older Phase 25 site-first PASS.

Effect on future work:

- Client demos and Manual UAT findings must create a normalized intake and phase route before new code.
- If a new demo tightens a behavior that was previously marked PASS, preserve old evidence as historical and add a new eval case for the new behavior.
