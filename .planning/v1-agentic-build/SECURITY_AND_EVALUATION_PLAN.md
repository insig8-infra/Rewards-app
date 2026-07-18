# Security And Evaluation Plan

This plan applies `Vibe Coding Agent Security and Evaluation_Day_4.md` to Volt Rewards V1.

## High-Risk Business Actions

Treat these actions as high risk:

- Generate QR unit records.
- Reprint QR and invalidate earlier token.
- Scan QR and credit points.
- Cancel QR through Admin Mobile returned-product handling.
- Reverse QR points through Admin Mobile returned-product handling.
- Redeem reward and deduct points.
- Cancel chosen reward and restore points.
- Mark reward `Fulfilled`.
- Create/edit/deactivate contractor.
- Create/deactivate staff.
- Export reports.
- Import or reconcile BUSY invoice/return data.
- Edit ItemCode reward rules that determine future QR point values.

Each high-risk action requires:

- Server-side permission check.
- Input validation.
- Idempotency key or duplicate prevention where applicable.
- Append-only audit event.
- Tests for allowed and denied paths.
- Human-readable log context.

## Security Controls

### Infrastructure And Runtime

- Use separate dev, staging, and production environments.
- Agents and local tooling must not connect to production data by default.
- Any future automation that runs generated scripts must run in sandboxed, ephemeral environments.
- Keep production credentials outside prompts, repo files, and generated scripts.
- Database liveness must not be treated as application readiness; production health checks must include a database readiness probe for write-critical surfaces.
- Production PostgreSQL connections must use verified TLS with a trusted CA bundle or an approved managed-provider TLS configuration. Local/dev compatibility flags such as `SUPABASE_DATABASE_USE_LIBPQ_COMPAT=true` are not sufficient for launch.

### Data

- QR tokens must be non-guessable and must not expose point value or raw invoice logic.
- Store only needed mobile/contact data.
- Team Member Recent contractor must use secure device storage.
- Audit logs must preserve actor, role, action, target, timestamp, source surface, and before/after state reference where needed.

### Model/Harness

- Root `AGENTS.md` is treated as code.
- Skill/runbook files are treated as code.
- Changes to planning, skills, and evals should be reviewed like implementation.
- Do not grow one giant prompt. Use dynamic skill context for domain procedures.

### Application And Runtime

- No client-only role checks for protected actions.
- No API keys in mobile/web clients except intentionally public publishable keys.
- Backend denies by default and grants by explicit role/action/scope.
- STAFF and Team Member restrictions need dedicated negative tests.

### IAM

- OWNER, STAFF, Contractor, and Team Member sessions must have distinct scopes.
- Team Member session is bound to selected contractor and expires daily.
- OWNER-only reward fulfillment must be enforced server-side.
- STAFF cannot export/share reports or modify contractor/staff/points master data.
- Admin Web must enforce the same non-camera OWNER/STAFF permissions as Admin Mobile.
- Admin Web must not expose returned-product QR status scan, cancel, or reverse in v1.

### Supply Chain

- Before adding dependencies, verify package name, maintainer reputation, activity, and purpose.
- Pin dependency versions where the ecosystem supports it.
- CI should include dependency vulnerability scanning.
- CI should include secret scanning.

## Evaluation Dimensions

Each slice is evaluated across these dimensions:

- Intent satisfaction: Does the delivered slice match the requirement IDs?
- Functional correctness: Do build, tests, APIs, and workflows pass?
- Business correctness: Do QR, points, rewards, sites, and permissions behave correctly?
- Visual/behavioral correctness: Do mobile/web screens render and behave as intended?
- Interaction fidelity: Did Browser UAT exercise the same visible controls and URL that a real user uses?
- Experience quality: Does the frontend meet the product-specific design bar in `FRONTEND_EXPERIENCE_STANDARD.md`?
- Product-grade app quality: Does the workflow meet `PRODUCT_GRADE_PLATFORM_STANDARD.md` for navigation, dashboard behavior, realistic data, reward media, screen structure, and honest completion language?
- Localization correctness: Does Hindi/English switching exist and preserve layout/flow for required end-user screens?
- Store readiness: Do mobile implementation choices avoid App Store / Play Store launch blockers?
- Code quality: Does implementation match project architecture and conventions?
- Trajectory quality: Did the agent read the right docs, use the right tools, and verify?
- Self-repair: Were failures diagnosed without broad unrelated changes?
- Security: Are secrets, dependency risks, authorization gaps, and audit gaps addressed?

## AI-Driven SDLC Evaluation Gate

Every phase must complete both evals before it is called a completed product workflow:

### Output Eval

Verifies what was built:

- Requirement IDs are satisfied or explicitly deferred.
- Domain/business invariants hold under positive and negative tests.
- DB-backed schema changes include migration status/deploy evidence against the exact runtime database used for UAT.
- UI workflows complete at the exact target URL/device.
- Mutations are verified through API/database readback.
- Role-denied and read-only paths are exercised.
- Security controls and audit events exist for high-risk actions.
- Browser/mobile console, network, hydration, and accessibility issues are reviewed.

### Trajectory Eval

Verifies how it got there:

- Relevant requirements, architecture, open questions, phase plan, and standards were read before implementation.
- Requirements were converted into BDD/state-action-outcome eval criteria before or alongside implementation.
- The agent did not silently decide ambiguous product behavior.
- Tools, MCPs, skills, and browser/device targets were appropriate and recorded.
- Failures were diagnosed by root cause, not patched around blindly.
- Browser-profile, cache, extension, stale-session, and environment hypotheses were considered before app-code changes when symptoms are profile-specific.
- Any surprise caused a harness/documentation improvement before feature work resumed.

Output eval `PASS` with trajectory eval `PARTIAL` is not enough for product-workflow completion. It can only be recorded as a corrected/partial slice with explicit follow-up.

## Operational Eval Artifacts

For active implementation phases, the evaluation gate should be concrete, not only described in prose.

Each significant phase should maintain phase-local artifacts when the phase has multiple waves or user-facing workflows:

- `OUTPUT_EVAL.md`: state/action/outcome cases, evidence table, current verdict.
- `TRAJECTORY_EVAL.md`: expected trajectory, actual trace entries, deviations, self-corrections, current verdict.
- `LEARNING_LOG.md`: surprises, repeated defect patterns, tool failures, user corrections, and harness improvements.

Minimum artifact behavior:

- Requirements become eval criteria before the phase is called complete.
- Automated tests can satisfy only the deterministic part of output eval.
- DB-backed phases require migration evidence and live readback; tests against generated clients are not enough.
- Visible UI, native mobile, and workflow quality need visible-control or device evidence, or an explicit `PARTIAL/BLOCKED` residual.
- Trajectory eval must record whether the agent read the right context, surfaced open questions, kept the slice small, avoided unrelated changes, and updated the harness after surprises.
- Learning entries must be written before broad new feature work resumes after a repeated or structural failure.

## Minimum Test Matrix

### QR Lifecycle

- Print creates unit records.
- Over-quantity print is rejected.
- Duplicate print is idempotent or rejected according to contract.
- Not Printed units can be printed later only if return check passes.
- Expired unscanned QR cannot be scanned.
- Reprint invalidates old token.
- Old token scan after reprint fails.
- Cancel allowed only for active unscanned non-expired QR (`PRINTED_UNCLAIMED` or `REPRINTED`).
- Reverse allowed only for Scanned/Claimed QR.

### Points And Rewards

- Successful scan reservation does not credit points yet.
- `Add to account` credits each reserved QR once.
- Repeat scan does not credit points again.
- Site-first scan batch flow preserves site context across multiple successful scans and credits points only after `Add to account`.
- Failed, invalid, expired, duplicate, and already-claimed scans never enter the reserved cart and show `0 credited points`.
- If `Add to account` fails due a technical/network issue, reserved cart items remain retryable and no duplicate points ledger credit is created.
- Reserved cart has no v1 point-value cap; a valid high-value QR above 1000 points reserves and commits successfully when normal rules pass.
- Reserved cart navigation guard prompts the user to `Add to account` or stay/go back to Scan before leaving the selected site's Scan flow with reserved items.
- Reward redeem deducts points and creates Claim ID.
- Ineligible reward cannot be redeemed.
- Reward catalog eligibility respects Points Available and any Silver/Gold/Platinum/Diamond tier requirement.
- Reward tiles show the points/tier gap for locked or near-eligible rewards.
- Reward cancellation before collection restores points.
- Reward cancellation remains allowed after OTP initiation but before OWNER marks Fulfilled/Delivered.
- Fulfillment marks reward Delivered/Collected.
- STAFF cannot fulfill rewards.
- Reversal before fulfillment revokes claim.
- Reversal after fulfillment keeps the reward fulfilled, can create negative available balance, and records it.
- QR scan reward points come from the persisted item-code points value resolved from BUSY `tmpItemCode`; printed QR points do not change when the mapping later changes.
- ItemCode rule updates require permission checks, audit events, and proof that old printed QR units retain their stored points while future QR units use the new rule.
- ItemCodes with both fixed Points and `% of Price` Points blank are flagged before future QR printing relies on them.
- Available points, lifetime points, QR value, credited points, reward claim debits, reward cancellation credits, return reversals, stale claim revocations, and negative balances reconcile from ledger events in API/database readback.

### Roles

- Contractor cannot self-register.
- Team Member cannot see full contractor list.
- Team Member cannot authenticate via Recent without OTP.
- Team Member cannot create/edit/delete sites.
- Contractor can see full contractor Scan History across sites and Team Member scans.
- Team Member cannot see full contractor Scan History and only sees allowed site/session-attributed scan attempts.
- STAFF cannot add/edit/deactivate contractors.
- STAFF cannot manage staff.
- STAFF cannot export/share reports.
- STAFF cannot fulfill rewards if requirement remains OWNER-only.
- Admin Web denies returned-product QR status scan/cancel/reverse routes in v1.

### UI Interaction Fidelity

- Browser UAT uses the exact local/staging URL given to the user.
- Agent browser UAT should run in a clean isolated/incognito-like profile by default, matching the whitepaper's isolated-browser guidance.
- When a user's persistent browser profile behaves differently from incognito, treat stale cache, extensions, blocked popups/file dialogs, profile policy, and service-worker/session state as explicit environment hypotheses before changing product code.
- Page hydration and client-side interactivity are verified before workflow assertions.
- Visible buttons, labels, inputs, toggles, selects, and upload affordances are exercised directly.
- Web file uploads verify that a visible native `input[type=file]` or approved native-equivalent control opens the file chooser.
- Directly setting a hidden file input is allowed only as an additional low-level check, not as the sole user-flow proof.
- File upload tests must clear/cancel/complete the file chooser so modal state does not leak into later UAT.
- Upload-control DOM checks must verify visible/enabled state, accepted file types, hit target, and lack of overlay interception.
- Browser console and network failures are captured and block completion unless explicitly accepted as residual risk.
- Successful create/save/edit/deactivate/cancel workflows are verified through API or database readback.
- Denied/read-only role behavior is tested with scoped assertions against the actual workflow panel.

### Frontend Experience Quality

- UI-bearing phase plans include a screen contract before implementation.
- New or materially changed screens are reviewed against `FRONTEND_EXPERIENCE_STANDARD.md`.
- New or materially changed app workflows are reviewed against `PRODUCT_GRADE_PLATFORM_STANDARD.md`.
- Reference usage from `Sample_References/` is documented.
- Major mobile recovery/redesign phases document the approved Stitch references plus 3-5 external production-grade rewards, loyalty, payment, or high-engagement app patterns/templates reviewed.
- Admin Web layouts are operational, scan-friendly, and not generic marketing dashboards.
- Mobile layouts support the persona's real job, one-handed use where relevant, and clear scan/auth/site context.
- Mobile product-complete work uses real navigation: auth stack, app stack, top-level tabs, detail/create/edit/confirm/result screens, visible back affordances, and planned Android back behavior.
- Contractor login lands on the dashboard; Team Member landing remains limited and scan-first as approved in the screen contract.
- End-user mobile uses `APPROVED_STITCH_UI_CONTRACT.md` as the primary visual direction. PayTM/PhonePe-style UX patterns are secondary context only and must not override the approved Stitch screenshots.
- Hindi/English toggle is present from day one for end-user mobile screens and text expansion does not break layout.
- Empty, loading, success, validation-error, permission-denied, and network-error states are designed and tested.
- User-facing UAT data uses human names and realistic sites/products/rewards; demo/runtime/UAT placeholder labels stay in test-only fixtures.
- Reward tiles/details include images or documented temporary assets plus required points, tier, status, progress, gap copy, and Claim ID when chosen.
- Reward tiles/details preserve essential meaning at supported mobile viewport widths and do not hide critical labels through line clamps or overflow.
- Phase status distinguishes API foundation completion from product workflow completion when frontend validation is still pending.
- Phase status distinguishes visible shell completion from product-grade workflow completion when real navigation, media, or realistic fixture data is still pending.

### Mobile Store Readiness

- Native permissions are declared only when needed and have user-understandable purpose copy.
- Sensitive local convenience state uses secure storage where required.
- Camera, contacts, and storage behavior does not rely on dev-only assumptions.
- Release-build compatibility is considered before adding native modules or Expo plugins.
- Public launch blockers are tracked before Phase 8 instead of deferred blindly to the end.

### Auth

- Contractor first login with temporary MPIN requires SET MPIN.
- Contractor MPIN change requires old MPIN.
- Failed MPIN and OTP attempts are rate-limited once rules are confirmed.
- OWNER and STAFF session expires after access removed, PIN changed, or app not opened for 4 days.

## CI Gates

Target gates once implementation starts:

- Format/lint.
- Type check.
- Unit tests.
- Integration tests.
- API contract tests.
- Secret scan.
- Dependency/SCA scan.
- Build web.
- Build mobile targets or at least compile/check per stack.
- E2E smoke tests for critical flows.
- Browser workflow UAT for every UI-bearing slice until automated Playwright coverage exists in CI.

## Human Review Gates

Human review is required for:

- Architecture and stack choices.
- QR state machine.
- Points and rewards ledger rules.
- Auth/session model.
- Role permissions.
- BUSY integration contract.
- Any dependency added to the production app.
- Release to staging or production.

## Agentic Process Evaluation

For each phase, record:

- Starting intent and acceptance criteria.
- Phase-relevant open questions brought forward and decisions recorded.
- Files changed.
- Tests run.
- Failures observed and fixes made.
- Browser UAT URL, actor/persona, console/network observations, and persistence readback evidence for UI-bearing phases.
- Any user corrections or changed assumptions.
- Remaining risks.

Use these records to improve `AGENTS.md`, skills, and future phase plans.
