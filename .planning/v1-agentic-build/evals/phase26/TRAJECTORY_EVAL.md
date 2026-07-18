# Phase 26 Trajectory Eval - Client Demo 2 Alignment

Status: PASS - Phase 26A/26B/26C Gates Passed
Created: 2026-07-14

## Trajectory Checks

| Check | Expected behavior | Status | Evidence |
| --- | --- | --- | --- |
| Contract-first | Read Client Demo 2 triage, Phase 26 plan, requirements, open questions, architecture/API/data docs before code. | PASS | Context read before implementation. |
| Open questions | Bring Phase 26A questions forward and avoid silently deciding Phase 26B ItemCodes rules. | PASS | Working label uses client phrase `Where they belong to`; Phase 26B questions stayed open until the user resolved them on 2026-07-15. |
| Small coherent wave | Start with Phase 26A Admin Web corrections and do not implement ItemCodes until blocking questions are answered. | PASS | Initial wave excluded ItemCodes schema/API; Phase 26B resumed after its decisions were resolved. |
| Evaluation-first | Create output/trajectory eval cases before code changes. | PASS | `evals/phase26/OUTPUT_EVAL.md` and this file created before implementation. |
| Runtime schema guard | DB-backed contractor/promotion changes include migrations and live readback/test evidence before completion. | PASS | Contractor and promotion migrations applied to the configured DB with explicit approval; PrismaService readback confirmed `belongsToNote`, `overlayFontFamily`, and `marqueeEnabled` are queryable. |
| Browser proof | UI-bearing Phase 26A changes are checked through a clean browser flow before completion. | PASS | Admin Web OWNER login and target routes were verified with Playwright. Screenshots are stored under `evals/phase26/screenshots/`; final console logs contained only React DevTools/HMR development messages. |
| Phase 26C contract-first | Read Phase 26C plan, relevant requirements, open questions, and decisions before mobile scan code changes. | PASS | Read Phase 26C plan, Phase 26 plan, triage, requirement IDs, open questions, DEC-050, and DEC-051 before implementation. |
| Phase 26C eval-first | Add pending scan-site output eval cases before implementation and keep Phase 26 status out of PASS until proof is complete. | PASS | Added `P26C-SCAN-001` through `P26C-SCAN-004` as pending output eval rows before code changes. |
| Phase 26C scope control | Implement only fresh scan-site selection and reserved-cart presentation behavior; do not implement ItemCodes or camera scope creep in the Phase 26C slice. | PASS | Code changes in the Phase 26C slice were limited to mobile scan workflow state, reserved-cart presentation helpers/tests, and Phase 26C proof harness. Native camera proof remains deferred per Phase 26C plan. |
| Phase 26B decision capture | Bring forward and resolve ItemCodes `% of Price`, exactly-one rule, BUSY field mapping, and OWNER/STAFF permission questions before coding. | PASS | User resolved Phase 26B decisions on 2026-07-15; `OPEN_QUESTIONS.md`, Phase 26 plan, triage, output eval, and `PHASE_26B_ITEMCODES_MASTER_PLAN.md` were updated before code changes. |
| Phase 26B eval-first | Add pending ItemCodes output eval rows before implementation. | PASS | Added `P26B-ITEM-001` through `P26B-ITEM-004` as pending output eval rows before code changes. |
| Phase 26B implementation scope control | Keep the ItemCodes slice to domain rules, schema, BUSY refresh, guarded Admin Web API/UI, dashboard attention, and QR print-time point freezing. | PASS | Returns allocation and broader BUSY integration were not reworked; Phase 26B changes stayed within ItemCodes and QR print point-source behavior. |
| Phase 26B output gate | Run automated tests, typecheck, Admin Web build, migration deploy, and API/authenticated route proof before completion. | PASS | Domain 43/43, API 99/99, Admin Web 14/14, all-workspace typecheck/test, Admin Web build, `git diff --check`, approved Prisma migration deploy, API refresh/list/STAFF-403 proof, and authenticated `/item-codes` route/proxy proof passed. |
| Phase 26B runtime discipline | Detect stale local runtime/schema drift and use explicit approval for remote DB migration instead of treating local code as deployed. | PASS | Fresh API started on `127.0.0.1:3010`; configured DB migration `202607150001_item_codes` was deployed with approval; first audit FK failure from a fake actor ID was diagnosed and the proof was rerun with role-only actor context. |

## Trace Log

### Phase 26A Planning Trace - 2026-07-14

- Intent: Begin Client Demo 2 alignment with Admin Web corrections that do not require unresolved ItemCodes business decisions.
- Context read: `AGENTS.md`, `apps/admin-web/AGENTS.md`, `PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`, `REQUIREMENTS_LEDGER.md`, `OPEN_QUESTIONS.md`, `architecture/DECISIONS.md`, local Next.js App Router/accessibility docs, Admin Web/API components.
- Working assumption: use the exact client phrase `Where they belong to` for the contractor association note until the user approves alternate copy.
- Boundary: do not implement `% of Price` ItemCodes behavior in this wave.
- Verdict: `PASS` for planning. Implementation pending.

### Phase 26A Continuation Trace - 2026-07-14

- Resumed after VS Code terminal crash by reconstructing context from `~/.codex` logs, Phase 26 plan/evals, and current repo state.
- Confirmed CLI config issue is not active in this desktop shell: `~/.codex/config.toml` uses `model_reasoning_effort = "xhigh"` and `codex --version` succeeds.
- Implemented remaining Phase 26A automated slice: Invoice Ledger date range, promotion font family/marquee schema/API/UI, promotion audit snapshot, mobile promotion response shape, and focused regression tests.
- Verification: API 97/97, Admin Web 13/13, Mobile 20/20, targeted typechecks, `git diff --check`, Prisma migration deploy, and DB column readbacks passed.
- Browser verification found an environment/runtime issue: the existing Admin Web dev server had an uncaught `write EPIPE`, and the running API `dist` was stale, causing Contractor Detail site analytics to show `undefined` for point fields even though TypeScript source had the mapper.
- Resolution: restarted the wedged Admin Web dev server, rebuilt and restarted API, confirmed direct API payload includes `qrValuePoints`, `creditedPoints`, and `productSummary`, added an Admin Web display fallback to avoid raw `undefined` if an older payload appears, and reran API/Admin Web tests.
- Final verdict at the Phase 26A checkpoint: `PASS` for Phase 26A output and trajectory gates; Phase 26B/26C were intentionally left for later resolved slices.

### Phase 26C Planning Trace - 2026-07-15

- Intent: tighten Contractor and Team Member Scan QR site-selection behavior from Client Demo 2 without changing backend QR calculation or ItemCodes rules.
- Context read: `PHASE_26C_SCAN_SITE_SELECTION_PLAN.md`, `PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`, `CLIENT_DEMO_2_TRIAGE.md`, `REQUIREMENTS_LEDGER.md` entries `SITE-014`, `SITE-015`, `SCAN-024`, `SCAN-013`, `SCAN-018`, `SCAN-019`, `OPEN_QUESTIONS.md`, and `architecture/DECISIONS.md` entries `DEC-050` and `DEC-051`.
- Boundary: do not implement Phase 26B ItemCodes or native camera changes in this slice.
- Eval action: added pending Phase 26C output cases before mobile code changes and downgraded the phase eval status from full `PASS` to `IN PROGRESS`.
- Verdict: planning is complete; implementation and proof are pending.

### Phase 26C Implementation Trace - 2026-07-15

- Implemented `apps/mobile/src/scanSiteWorkflow.ts` with focused tests for fresh scan entry reset and reserved-cart item filtering.
- Updated `apps/mobile/App.tsx` so Contractor Dashboard/Scan tab and Team Member Scan tab clear selected scan site only when no reserved cart is active, scanner/manual QR controls are hidden until a site is chosen, successful `Add to account` clears the scan-site selection, and committed cart rows are no longer presented as ready to add.
- Verification: mobile tests passed 23/23, API tests passed 97/97, and `git diff --check` passed.
- Browser verification: `tools/phase26c-mobile-scan-site-proof.mjs` prepared realistic demo QR tokens, exercised visible Contractor and Team Member controls, forced a technical commit failure, captured the mobile viewport matrix, checked console/runtime errors, and verified API scan-history readback.
- Tooling note: `agent-browser` CLI was unavailable in this workspace, so the project-local Chrome DevTools proof harness pattern was used instead.
- Runtime note: Expo Web initially hung in sandboxed offline validation; restarting `npm run web --workspace @volt-rewards/mobile` with approval brought `http://127.0.0.1:3002` up for proof.
- Verdict: `PASS` for Phase 26C output and trajectory gates. Phase 26B was resumed only after its recorded business questions were resolved.

### Phase 26B Implementation Trace - 2026-07-15

- Intent: implement ItemCodes as the managed BUSY `tmpItemCode` reward-rule source and freeze resolved QR points at print time.
- Context read: `SaleWithRef.txt`, `PHASE_26B_ITEMCODES_MASTER_PLAN.md`, `PHASE_26_CLIENT_DEMO_2_ALIGNMENT_PLAN.md`, `CLIENT_DEMO_2_TRIAGE.md`, `REQUIREMENTS_LEDGER.md`, `OPEN_QUESTIONS.md`, domain permissions/QR print code, BUSY import repositories, Admin Web shell/API/workspace patterns, and Phase 26 output/trajectory evals.
- Decision discipline: used the user's 2026-07-15 answers for BUSY field mapping, `% of Price = Price`, fractional percentages, exactly-one UI rule, and OWNER edit / STAFF read-only behavior.
- Implementation: added ItemCode domain helpers/tests, Prisma schema/migration, BUSY item-code sync, ItemCodes API/service/controller, QR print point resolution/freeze, dashboard attention integration, invoice point previews, Admin Web navigation/API/workspace, and focused tests.
- Verification: domain 43/43, API 99/99, Admin Web 14/14, all-workspace typecheck/test, Admin Web build, `git diff --check`, approved Prisma migration deploy, API refresh/list/STAFF-403 proof, and authenticated Admin Web route/proxy proof passed.
- Proof limitation: full interactive Playwright proof was unavailable; QR print value behavior is covered by automated API/domain tests, and Admin Web proof used authenticated route/proxy plus API probes.
- Verdict: `PASS` for Phase 26B output and trajectory gates with the documented live-fixture caveat for blank/missing ItemCode dashboard attention.

### Phase 26B Clarification Trace - 2026-07-15

- User clarified that freeze-at-print is correct and that ItemCodes should distinguish manually maintained `Absolute Points` and `% of Price` from calculated `% of Price Points` and `Final Points`.
- Adjusted code and docs without changing schema because `% of Price Points` and `Final Points` are derived read-model values.
- Preserved the QR print-time freeze behavior already covered by tests.
- Added print batch copy `Collect X points` to match the physical QR label wording.
- Verification: domain/API/Admin Web tests, Admin Web typecheck/build, stale-text scan, authenticated route/proxy proof, and refreshed API proof passed.
