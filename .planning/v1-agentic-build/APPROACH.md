# Volt Rewards V1 - Agentic Build Approach

## Purpose

This plan defines how we will build the production-grade Volt Rewards platform using Codex and GPT-5.5 while following the approach from the four white papers. It is vendor-neutral: the process adopts the SDLC, harness, skills, interoperability, security, and evaluation ideas without requiring Antigravity or Gemini models.

## Inputs

Authoritative product input:

- `app-requirementsV1.md`

Method inputs:

- `The New SDLC With Vibe Coding_Day_1.md`
- `Agent Tools & Interoperability_Day_2.md`
- `Agent Skills_Day_3.md`
- `Vibe Coding Agent Security and Evaluation_Day_4.md`
- `Day_5_v3.md`

## Core Interpretation Of The White Papers

The app must be built as agentic engineering, not casual vibe coding.

- Day 1 gives the SDLC model: formal specs, architecture, automated tests, evals, quality gates, human review, and a harness around the model.
- Day 2 gives the interoperability model: use standard protocols where they reduce integration debt, especially MCP for controlled tool access. Avoid bespoke wrappers where a vetted standard exists.
- Day 3 gives the skills model: turn repeatable domain procedures into small, owned, tested skills/runbooks loaded on demand instead of one huge prompt.
- Day 4 gives the security and evaluation model: sandbox execution, prevent supply-chain mistakes, enforce least privilege, trace actions, judge output plus trajectory, and gate releases with tests, security checks, and human review.
- Day 5 reinforces spec-driven development, BDD-style state/action/outcome scenarios, browser-based UI verification, generated test coverage, policy/guardrail thinking, and the shift from code production to verified integration.

## Product Surface

V1 has four surfaces:

- End-user mobile app: `Volt Rewards`, Android and iOS, Contractor and Team Member personas.
- Admin mobile app: `Volt Admin`, Android and iOS, OWNER and STAFF personas.
- Admin web portal: `Volt Admin Web Portal`, browser surface for QR printing and all non-camera OWNER/STAFF admin management workflows.
- Backend/API platform: source of truth for auth, users, sites, QR lifecycle, points ledger, rewards, reports, BUSY integration, audit, and exports.

The backend is the control plane. Mobile and web surfaces render state and initiate actions, but core business validity must be enforced server-side.

## Engineering Posture

Implementation is the fast part. Requirements, architecture, verification, and review are the slow parts and must stay human-controlled.

We will work in vertical slices:

1. Define the slice in requirements terms.
2. Bring forward the phase-relevant open questions for user decision.
3. Write the domain rules, API contract, and UI experience contract when the slice has a user-facing surface.
4. Write test/eval expectations.
5. Implement backend/domain behavior only to the depth needed by the visible workflow.
6. Implement the client UI or thin client shell for that behavior.
7. Run automated verification.
8. Do targeted human review.
9. Record residual risk and next slice.

## AI-Driven SDLC Iteration Cycle

Every build slice must follow the AI-Driven SDLC loop from `Agentic Engineering/SCR-20260708-jzdy.png`:

1. Requirements: identify requirement IDs, user decisions, open questions, and business invariants.
2. Design: turn requirements into domain rules, API contracts, data contracts, UI contracts, security constraints, and BDD-style state/action/outcome scenarios.
3. Build: implement only the planned slice using the approved architecture and shared controls.
4. Output eval: verify what was built through tests, visible workflow UAT, API/database readback, screenshots where relevant, and security checks.
5. Trajectory eval: verify how it was built by checking context used, assumptions made, tools used, deviations, failures, self-corrections, and whether harness/docs improved after surprises.
6. Review/deploy readiness: only after output eval and trajectory eval both pass can a slice be called complete.
7. Maintenance: feed learnings back into `AGENTS.md`, phase templates, skills, eval plans, and open questions before the next slice.

Completion language must be precise:

- `API foundation complete` means no product workflow completion claim.
- `visible shell complete` means screen shape exists but product-grade workflow is still pending.
- `product workflow complete` requires output eval and trajectory eval to both pass.
- `store-ready` requires native iOS/Android verification, not only Expo Web.

## 2026-07-01 Process Correction

The contractor photo-upload issue exposed a real methodology gap. A UI phase can no longer be marked complete from component checks, hidden-input manipulation, direct API calls, or a nearby runtime proof alone.

For every UI-bearing slice:

1. Write browser workflow scenarios in state/action/outcome form before implementation is called done.
2. Test the exact URL the user is asked to use, including `127.0.0.1` versus `localhost` when both are relevant.
3. Exercise visible controls the way a user does. File uploads must prove the visible button or label opens the file chooser; direct `setInputFiles` on a hidden input is only a lower-level supplement.
4. Inspect console and network failures during Browser UAT. Hydration, chunk-loading, CORS, and failed fetch errors block completion.
5. Verify each UI mutation through API or database readback after the browser action.
6. Include role-denied or read-only paths in the same UAT pass.
7. Capture failures as labeled process data by updating the relevant skill, eval, phase template, or forensic report.

## 2026-07-07 Reusable-Control Correction

The reward catalog image-upload failure repeated the earlier contractor photo-upload failure in another surface. The underlying issue was not one broken Browse button; it was a missing reusable-control contract.

Rules:

1. A repeated UI control must be implemented as a shared component or an explicitly documented shared pattern before being reused across Web, Admin Mobile, and end-user mobile.
2. Device image upload must be tested from the visible user-facing control, then verified through persistence readback. Hidden input manipulation cannot be the primary proof.
3. Masked PIN/MPIN fields must include reveal/hide controls from the first implementation pass, including login, set PIN, and change PIN workflows.
4. A phase status must not claim upload or secret-input completion unless the UAT evidence names each surface tested: Admin Web, Admin Mobile, and end-user mobile where applicable.
5. When a control fails manual UAT after being marked complete, update the requirement ledger and frontend standard before applying the code fix, so the harness improves instead of accumulating ad-hoc patches.

## 2026-07-08 Native Picker Harness Correction

The reward image `Browse` failure persisted after automated UAT because the test path still accepted custom picker implementations that were not equivalent to a human clicking the browser's native file control in a clean session. The Playwright session also accumulated unclosed file chooser dialogs, which made repeated automation checks less trustworthy.

Rules:

1. Web file upload controls must use a visible native `input[type=file]` unless a custom wrapper has explicit manual-equivalent evidence on the target browser. Hidden-input bridges, nested labels, and programmatic `input.click()` are not acceptable as the primary production pattern.
2. Upload UAT must start from a clean page/session, prove the exact visible native/device picker opens, cancel or complete the chooser, and confirm no modal chooser state remains queued.
3. DOM inspection is part of the gate: the file input must be enabled, visible, non-zero sized, have the approved accept list, and `document.elementFromPoint()` at the click target must resolve to the input or the intentional native picker target.
4. Console review must separate expected diagnostic/dev noise from product-path errors. A self-created diagnostic 404 is not product evidence; a page runtime error or accessibility warning on the product path blocks completion.
5. The phase status must record root cause, ruled-out causes, verification target, and harness correction before resuming feature work.

## 2026-07-10 Runtime Schema Drift Correction

Phase 25 scan-cart work exposed another harness gap: automated API/mobile tests passed against generated code, but the live Supabase-backed dev runtime failed because the new `ScanCart` tables and enum values had not been migrated. This produced a hidden UI failure where the mobile app could not load the cart after a successful QR reservation.

Rules:

1. Any DB-backed slice must include a migration file in the same implementation wave as the schema change.
2. Before visible UI UAT, run migration status/deploy against the exact dev/staging database used by the running API.
3. Restart stale dev servers after schema or route changes and verify the running server maps the new route before browser/mobile proof.
4. Output eval must include live API/database readback for the changed workflow, not only unit/integration tests.
5. If runtime schema drift is found, update the phase learning log and harness before broad feature work resumes.

## 2026-07-14 Client Demo Intake Correction

Client Demo 2 exposed a harness requirement: client demo feedback must not remain as loose notes or be implemented as scattered fixes.

Rules:

1. After any client demo or manual UAT with new requirements, create or update a normalized triage artifact before code changes.
2. Each demo change must be routed to requirement IDs, architecture decisions, API/data model contracts, and a specific future phase or phase amendment.
3. Previously completed evidence remains historical, but any behavior tightened by the demo must receive a new eval case or a clearly superseded/reopened status.
4. New domain areas, such as ItemCodes reward-rule management, must update BUSY/integration docs and open questions before UI work starts.
5. Implementation may continue only after stale references are either removed or explicitly labeled as superseded/historical.

## 2026-07-01 Trajectory Correction

The end-user mobile backend work exposed a second methodology gap. API foundations are useful, but a mobile-facing slice is not product-complete until the user-visible journey is built and validated.

Rules:

1. Backend-first is allowed for high-risk control-plane behavior, but backend-only cannot be treated as completion for a user-facing slice.
2. Mobile or web experience contracts must exist before expanding backend implementation beyond the first foundation needed for that workflow.
3. Each UI-bearing phase must define the target persona, primary job, screen states, navigation path, validation states, empty/error/denied states, and visible acceptance criteria before implementation is called done.
4. Frontend quality is a product requirement, not decoration. Screens must be modern, polished, domain-specific, and operationally sensible rather than generic dashboard layouts.
5. Sample references in `Sample_References/` may guide layout quality and polish. `Sample_References/Stitch_Admin_design.md` is a color-scheme reference only, not a full UX contract.
6. Phase status may say "API foundation complete" only when the frontend validation remains pending. It must not say the product workflow is complete until the visible experience passes UAT.
7. Open questions must be brought forward at the start of the phase they affect. The agent must not silently decide product behavior that belongs to the user/client.

## 2026-07-05 Product-Grade App Correction

The mobile shell and rewards slice exposed a third methodology gap: a visible shell can still feel like a prototype if it lacks real app navigation, human fixture data, rich reward presentation, and screen-level product thinking.

Rules:

1. A mobile slice is not product-grade unless it has a real navigation model: auth stack, authenticated app stack, top-level tabs, detail/create/edit/confirm/result screens, visible back affordances, and planned Android back behavior.
2. Contractor login must land on the main dashboard. Team Member login may land on a scan-first limited dashboard/screen only when explicitly approved in the screen contract.
3. User-facing seed/mock/UAT data must use realistic human names and product data. Labels such as `Demo Contractor`, `Runtime Gate Contractor`, `UAT Contractor`, and `Isolated Contractor` are test-only and must not appear in app UAT, screenshots, or client demos.
4. The existing schema already stores the contractor's user-facing human name in `User.displayName`. Do not add duplicate name columns unless a future approved requirement separates display name, legal name, and business name.
5. Reward catalog UI must show visual reward assets, point/Rs value, required tier, progress, status, and Claim ID where relevant. Initials-only reward tiles are acceptable only for a temporary shell.
6. Every UI-bearing phase must be checked against `PRODUCT_GRADE_PLATFORM_STANDARD.md` as well as `FRONTEND_EXPERIENCE_STANDARD.md`.
7. Before adding new feature breadth, correct the current end-user mobile app into a product-grade navigation and presentation baseline.

## 2026-07-06 Manual UAT 1 Recovery Correction

Manual UAT 1 exposed a fourth methodology gap: even when a screen has API wiring and visible-control proof, it can still fail production-grade expectations if the information architecture, dashboard purpose, list behavior, navigation, and role-specific workflows are not designed before implementation.

Rules:

1. Manual UAT findings must be triaged into product rule gaps, UX gaps, visual design gaps, bugs, documentation mismatches, and agentic process failures before code changes resume.
2. Dashboards must be operational command surfaces. Metrics, counts, and summary cards should click through to the relevant filtered list, detail screen, or workflow unless the phase contract explicitly explains why not.
3. Operational lists and histories must have the first useful set of search, filters, sorting, and detail drilldowns before the surface is marked product-grade.
4. User-facing histories must show meaningful invoice, product, site, actor, date/time, and status labels. Raw database IDs are acceptable only in developer diagnostics or secondary support detail.
5. UI-bearing phases must verify not only that controls work, but that the screen behaves like the target user would expect during repeated real use.
6. New external-business facts, such as BUSY return-voucher behavior, must immediately update decisions, open questions, integration specs, and the roadmap before implementation continues.
7. Manual UAT 1 blocks feature breadth until the recovery phases in `MANUAL_UAT1_TRIAGE.md` are handled.

## Harness We Need Before Coding

The harness for this project consists of:

- `AGENTS.md`: always-loaded project rules for Codex.
- Requirements ledger: normalized requirement IDs and source mapping.
- Phase plans: small implementation units with entry and exit gates.
- Skills/runbooks: QR lifecycle, rewards ledger, role permissions, BUSY integration, UI implementation, security/eval gate.
- Frontend experience standard: quality bar, reference usage, and UI review gates.
- Product-grade platform standard: app navigation, realistic data, dashboard, reward media, and completion gates.
- Phase question governance: open questions surfaced before affected implementation.
- Test suites: unit, integration, API contract, end-to-end, UI, and security tests.
- CI gates: type checks, lint, tests, secret scan, dependency scan, build, and later Playwright/mobile workflow checks.
- Observability plan: audit events, application logs, traces, error reporting, and release health metrics.

## Static Vs Dynamic Context

Static context should stay small:

- Root `AGENTS.md`
- Active phase plan
- Requirements ledger
- Architecture decisions relevant to the current slice

Dynamic context should load on demand:

- Domain skill/runbook for the slice
- API schemas
- Data model details
- UI design contract
- Frontend experience standard
- Product-grade platform standard
- Security/eval checklist
- Active open questions for the current phase
- External library docs via Context7

This avoids context rot and keeps Codex focused on the slice being built.

## Interoperability Strategy

MCP:

- Use MCP for development tools and controlled project integrations where useful.
- Prefer official or internal MCP servers.
- Audit public MCP servers before use.
- Keep production data access out of agent tooling by default.
- Use read-only access unless a phase explicitly requires writes and the user approves.

A2A:

- Not required for v1 app delivery.
- Consider later if we build specialist production agents, such as a BUSY reconciliation agent, report analysis agent, or support assistant.

A2UI:

- Not required for v1 fixed app/web UI.
- Consider later for agent-generated analytics dashboards, but only through a trusted component catalog and schema validation.

AP2/UCP:

- Not required for v1 because rewards are chosen in app and physically fulfilled by the retailer.
- Revisit only if future versions support autonomous external purchases or payment flows.

## Security Strategy

High-risk domains:

- Auth and MPIN setup/change
- Team Member OTP access
- Site-scoped scanning
- QR token generation and validation
- QR reprint.
- QR returned-product cancel and reverse through Admin Mobile only in v1.
- Points ledger mutation
- Reward redemption, cancellation, and fulfillment
- OWNER/STAFF permission enforcement
- Reports and exports
- BUSY invoice and return sync

Security controls:

- Server-side authorization for every mutation.
- Append-only audit trail for every high-risk action.
- Non-guessable QR tokens with token rotation on reprint.
- No point values or raw business logic encoded in QR payloads.
- Idempotency on invoice import, QR generation, scan, redemption, and reversal.
- Dependency verification before adding packages.
- Secret scanning and SCA in CI.
- No production database or BUSY write access from agent tooling.

## Evaluation Strategy

We evaluate both the product and the agentic process.

Product evaluation:

- Functional correctness: tests pass, APIs behave, workflows complete.
- Business-rule correctness: QR/points/reward state machines hold under edge cases.
- Role correctness: each persona sees and can do only what it should.
- Visual and behavioral correctness: rendered app/web flows match the screen contract.
- Experience quality: UI layout, hierarchy, control placement, copy, density, and states feel designed for the product and persona.
- Security correctness: no secrets, no client-only auth, no invalid state transitions.

Agent/process evaluation:

- Intent satisfaction: output matches the phase goal and requirement IDs.
- Trajectory quality: Codex read the right context, used the right tools, and verified.
- Self-repair: failures are diagnosed and fixed without broad unrelated changes.
- Cost/efficiency: avoid bloated context, oversized diffs, and repeated rework.

## Build Phases

Phase 0 - Product Contract And Harness

- Normalize requirements from `app-requirementsV1.md`.
- Record open questions and assumptions.
- Create root `AGENTS.md`.
- Define roadmap, security/eval gates, and skill plan.
- Decide architecture only after requirements risks are visible.

Phase 1 - Architecture And Tech Stack

- Choose cross-platform mobile stack.
- Choose backend stack, database, auth/session approach, queue/job approach, and hosting approach.
- Define domain model and API contracts.
- Define CI/CD and environment strategy.
- Use Context7 for current framework docs before finalizing implementation details.

Phase 2 - Backend Domain Core

- Implement domain services and tests for users, roles, sites, QR lifecycle, points ledger, reward ledger, and audit.
- Use mock BUSY invoice/return data through a replaceable adapter.
- No UI dependency for core correctness.

Phase 3 - Admin Web Operations Foundation And QR Printing Slice

- Establish Admin Web as the browser surface for all non-camera admin workflows.
- Invoice list/detail from mock BUSY data.
- Pre-checked line items.
- Quantity reduction with invoice max enforcement.
- Unit-level QR record creation.
- Print history and status view.
- Reprint with replacement token.
- Add Admin Web navigation/route plan for dashboard, contractor management, staff management, reward fulfillment, reports/exports, promotions, and analytics.
- Document that returned-product QR status scan, cancel, and reverse are excluded from Admin Web in v1.

Phase 4 - End-User Scan Slice

- Write the mobile experience contract before further backend expansion for this slice.
- Build a thin end-user mobile shell early so Contractor and Team Member journeys can be validated visually.
- Contractor login, first-login SET MPIN, MPIN change.
- Team Member OTP login with one recent contractor and secure storage.
- Site selection before scan.
- Site-first persistent scan cart model from `DEC-050`: select/confirm site, scan multiple valid QR units into a server-reserved cart, review items and total points, guard navigation away from Scan while reserved items exist, then credit with `Add to account`.
- QR scan success/failure recording.
- Scan History with filters and error attempts.

Phase 5 - Rewards Slice

- Reward catalog.
- Eligibility and "Collect more points" messaging.
- Redeem reward, generate Claim ID, deduct points.
- Cancel chosen reward before collection and restore points.
- Balance Book with chronological activity and post-action balance.
- Delivered/Collected status after OWNER fulfillment.

Phase 6 - Admin Mobile Operations

- OWNER and STAFF login.
- OWNER dashboard and STAFF limited dashboard.
- Return Scan status, cancel, and reverse flows that require mobile camera scanning.
- OWNER contractor management.
- STAFF contractor view-only.
- OWNER-only reward fulfillment by Claim ID plus OTP.
- Staff management.
- Non-camera admin workflows remain shared with Admin Web by role; mobile has the returned-product QR camera workflow.

Mock BUSY Principle:

- Mock BUSY data is the active development source until actual BUSY API integration exists.
- The full product build proceeds on mock BUSY.
- Actual BUSY API integration later replaces the adapter implementation, not the product workflow.

Phase 7 - Reports, Exports, Promotions

- QR printed reports.
- QR status reports.
- Contractor leaderboard and deep dives.
- Reward claims reports.
- Returns/reversals reports.
- Product/category performance.
- OWNER exports to PDF, Excel, WhatsApp.
- Promotion/banner management.

Phase 8 - Production Hardening And Launch

- Security scan, dependency scan, secret scan, penetration checklist.
- Performance checks.
- App Store and Play Store release readiness.
- Backup/restore and audit export.
- Observability and production runbooks.

## Definition Of Done

A slice is done only when:

- Requirement IDs are listed.
- Domain rules are implemented server-side.
- Tests cover happy path, edge cases, and denied actions.
- Relevant open questions were brought forward to the user before implementation, or an explicit user-approved assumption was recorded.
- UI experience contract exists for every user-facing slice.
- UI behavior is verified where applicable.
- Frontend quality review passes against `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`.
- Product-grade review passes against `.planning/v1-agentic-build/PRODUCT_GRADE_PLATFORM_STANDARD.md` for user-facing app/web work.
- Mobile app work has a documented screen map, navigation/back behavior, and dashboard impact.
- User-facing seeded/mock/UAT data uses realistic names, products, sites, and reward assets, or any temporary content is explicitly labeled as residual risk.
- Browser UAT exercises the visible user controls at the exact local/staging URL.
- Every UI mutation is verified by persisted API/database readback.
- Browser console/network errors are checked and resolved or explicitly accepted as residual risk.
- Security/eval checklist passes.
- Output eval and trajectory eval reflect both automated evidence and visible/manual UAT findings for the slice.
- Any user correction that exposes a methodology gap updates the relevant standard, open question, phase status, or future phase pointer before more feature breadth continues.
- No open high-risk assumptions remain hidden.
- A human-readable summary explains what changed and what remains.
