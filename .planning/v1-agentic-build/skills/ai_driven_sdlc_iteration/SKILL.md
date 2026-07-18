# Skill: AI-Driven SDLC Iteration

## Purpose

Enforce the AI-Driven SDLC loop for Volt Rewards phases:

Requirements -> Design/spec-to-eval -> Build -> Output Eval -> Trajectory Eval -> Review/Deploy Readiness -> Maintenance feedback.

Use this before starting or completing any non-trivial phase, and whenever UAT exposes a process gap.

## Inputs To Read

- `AGENTS.md`
- `.planning/v1-agentic-build/APPROACH.md`
- `.planning/v1-agentic-build/REQUIREMENTS_LEDGER.md`
- `.planning/v1-agentic-build/OPEN_QUESTIONS.md`
- Active phase plan/status/contract.
- Relevant standards:
  - `.planning/v1-agentic-build/SECURITY_AND_EVALUATION_PLAN.md`
  - `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`
  - `.planning/v1-agentic-build/PRODUCT_GRADE_PLATFORM_STANDARD.md`

## Start-Of-Phase Checklist

1. Name the requirement IDs.
2. Bring forward phase-relevant open questions.
3. Write spec-to-eval criteria:
   - BDD/state-action-outcome scenarios.
   - Business invariants.
   - Role and permission invariants.
   - Data persistence/readback invariants.
   - UI/UX acceptance criteria.
   - Security acceptance criteria.
4. Identify affected domain, API, data, UI, tests, and audit surfaces.
5. Define exact UAT target:
   - URL/device/simulator.
   - Persona/actor.
   - Browser profile expectation.
   - Clean isolated/incognito-like browser by default for web UAT.

## Output Eval Checklist

Verify what was built:

- Automated tests pass.
- Domain/business rules pass positive and negative cases.
- UI workflows work at the exact target URL/device.
- Mutations are verified through API/database readback.
- Role-denied/read-only paths are tested.
- Console/network/hydration/accessibility issues are reviewed.
- High-risk actions have backend authorization, validation, audit, and tests.

## Trajectory Eval Checklist

Verify how it got there:

- Correct docs/context were read.
- Open questions were surfaced before decisions.
- Assumptions and deferrals were recorded.
- Tools/MCPs/skills were appropriate.
- Deviations from the phase plan were named.
- Failures were diagnosed by root cause.
- Surprises updated harness/docs before feature breadth resumed.

## Browser/Profile Rule

For web UI:

- Agent UAT should use a clean isolated/incognito-like browser profile by default.
- If the user's persistent Chrome profile behaves differently from incognito, investigate:
  - stale cache,
  - extensions,
  - blocked dialogs or file pickers,
  - service-worker/session state,
  - browser profile policy.
- Do not patch product code until the app path has been distinguished from profile/environment state.

## Upload-Control Rule

For uploads:

- Prefer visible native `input[type=file]` on web.
- Mobile must use the OS/device media picker with permission/cancel/error handling.
- Hidden-input manipulation is only a low-level supplement, never completion evidence.
- UAT must verify:
  - visible/enabled state,
  - DOM hit target,
  - accepted file types,
  - no overlay interception,
  - chooser cleanup after cancel/upload,
  - persistence/readback after successful upload.

## Completion Verdict

Record:

- Output eval: `PASS`, `PARTIAL`, or `FAIL`.
- Trajectory eval: `PASS`, `PARTIAL`, or `FAIL`.
- Completion language:
  - `API foundation complete`
  - `visible shell complete`
  - `product workflow complete`
  - `store-ready`

A slice cannot be called product-workflow complete unless both eval verdicts are `PASS`.

