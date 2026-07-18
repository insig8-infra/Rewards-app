# Phase 23 Learning Log - End-User Mobile Product-Grade Recovery

Status: Active  
Created: 2026-07-09  
Purpose: Capture self-learning and harness improvements before Phase 23 expands.

## Rule

If a defect, UAT issue, tool failure, confusing product behavior, or methodology gap appears during Phase 23, we do not only fix code. We also decide whether to update:

- Phase 23 plan/status.
- Output eval cases.
- Trajectory eval checks.
- Frontend/product-grade standards.
- Open questions.
- Reusable control patterns.
- Future skills/runbooks.

## Learning Entries

### L-2026-07-09-01 - Eval Artifacts Must Be Concrete

Observation:

- The project already had Output Eval and Trajectory Eval principles, but Phase 23 needed wave-specific state/action/outcome cases and a trajectory scoreboard before implementation could continue confidently.

Harness change:

- Added `evals/phase23/OUTPUT_EVAL.md`.
- Added `evals/phase23/TRAJECTORY_EVAL.md`.
- Added this learning log.

Effect on future work:

- Every remaining Phase 23 wave must update output and trajectory evals before it is treated as complete.

### L-2026-07-09-02 - Store-Ready Claims Need Native Evidence

Observation:

- Expo Web and automated tests are useful but cannot prove App Store / Play Store readiness.

Harness change:

- Phase 23 plan/status and output eval now distinguish automated proof, visible fallback proof, and native iOS/Android proof.

Effect on future work:

- Phase 23 may be functionally implemented before user UAT, but no store-ready claim is allowed without native-device validation.

### L-2026-07-09-03 - Dev Fallbacks Need Shared Gates

Observation:

- Manual QR token entry and mock OTP are useful during development but dangerous if scattered or visible in production.

Harness change:

- Added shared mobile dev-feature gating and tests.

Effect on future work:

- Any future mobile fallback must use a shared gate and be covered by production-hidden tests.

### L-2026-07-10-01 - Manual Mobile UAT Must Change The Contract, Not Just The Code

Observation:

- Manual UAT found that both mobile apps still felt clunky and basic despite passing automated checks.
- End-user scan behavior needs a site-first batch/cart model rather than a nearby immediate-scan flow.
- Reward tile readability, promotion banner layout, profile photo management, scan details, and points math surfaced as product-grade blockers.
- Admin Mobile dashboard and tabs need information architecture recovery, not just component spacing.

Harness change:

- Added `MOBILE_APP_MANUAL_UAT_TRIAGE.md`.
- Added Mobile Manual UAT open questions to `OPEN_QUESTIONS.md`.
- Added new traceable requirements in `REQUIREMENTS_LEDGER.md`.
- Updated Phase 23/24 status and contracts so both remain `PARTIAL`.
- Updated frontend/product-grade standards so future mobile slices require design-reference mapping, visible evidence, workflow match checks, and points reconciliation.

Effect on future work:

- Mobile feature breadth must pause until the next recovery phase resolves the open scan-batch questions and writes screen contracts.
- Output eval cannot pass from automated tests alone when manual UAT identifies visible workflow or correctness blockers.
- Trajectory eval must explicitly check whether the implementation matches the user's intended workflow, not merely an adjacent UI flow.

Follow-up on 2026-07-10:

- Core scan-batch questions were resolved and recorded in `DEC-050`.
- The remaining implementation-time question is reserved-cart invalidation if a reserved QR becomes invalid before `Add to account`.

## Candidate Future Skill

Candidate: `volt-phase-eval-gate`

Purpose:

- Given a phase plan/status, generate or update output eval, trajectory eval, and learning-log entries before a phase is called complete.

Promotion criteria:

- It should not become a relied-upon skill until it has at least three eval cases:
  1. UI phase with visible UAT residual.
  2. Backend-only phase with API/readback evidence.
  3. Phase with a user-correction learning that updates standards before code.
