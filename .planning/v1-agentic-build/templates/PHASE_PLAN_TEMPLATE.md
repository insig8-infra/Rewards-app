# Phase Plan Template

## Goal

State the user-visible and business-visible outcome.

## Source Requirements

- `REQ-ID`

## Scope

Included:

- ...

Excluded:

- ...

## Open Questions

- Relevant questions from `OPEN_QUESTIONS.md`:
- Blocking before implementation:
- Needed before phase completion:
- Safe to defer with explicit assumption:
- User decisions recorded:

## Spec-To-Eval Criteria

Write these before implementation. Requirements become eval criteria.

- BDD/state-action-outcome scenarios:
- Business invariants:
- Role/permission invariants:
- Data persistence/readback invariants:
- UI/UX acceptance criteria:
- Security acceptance criteria:
- Explicit non-goals:

## UI Experience Contract

Required for every UI-bearing phase. If not applicable, state `N/A - backend/domain only`.

- Surface:
- Persona:
- Primary job:
- Screen map:
- Entry path:
- Navigation/back behavior:
- Dashboard impact:
- Primary action:
- Secondary actions:
- Data shown:
- Data identity source:
- Asset strategy:
- Empty/loading/success/error/denied states:
- Role differences:
- Reference inputs used:
- Mobile/desktop layout expectations:
- Persistence/API readback after mutation:
- Exact UAT URL, simulator, or device target:

## Architecture Touchpoints

- Domain services:
- API routes:
- Database tables:
- UI surfaces:
- Background jobs:
- Audit events:

## Tests And Evals

- Unit:
- Integration:
- API contract:
- UI/E2E:
- Frontend experience quality:
- Product-grade platform review:
- Output eval:
  - Requirement satisfaction:
  - Functional correctness:
  - Business correctness:
  - Visual/behavioral correctness:
  - Security correctness:
- Trajectory eval:
  - Required docs/context read:
  - Open questions surfaced before decisions:
  - Tools/MCPs/skills used:
  - Assumptions recorded:
  - Deviations from plan:
  - Failures/self-corrections:
  - Harness/docs updates needed:
- Browser workflow UAT:
  - Exact URL(s):
  - Browser profile matrix:
    - Clean isolated/incognito profile:
    - User-like persistent profile, when relevant:
    - Cache/extension/stale-session hypothesis considered:
  - Persona/actor context:
  - Hydration/console/network check:
  - Visible-control interaction proof:
  - Upload controls, if any:
    - Native/device picker opened from visible control:
    - DOM hit target and enabled/visible state verified:
    - Accepted type/size validation verified:
    - File chooser/modal state cleared after test:
  - Happy path:
  - Edit/update path:
  - Delete/deactivate/cancel path:
  - Denied/read-only role path:
  - Persistence checks after each mutation:
  - Desktop/mobile layout checks:
- Security:
- Manual review:

## Implementation Tasks

- [ ] ...

## Exit Gates

- [ ] Requirement IDs satisfied.
- [ ] Phase-relevant open questions were brought forward before implementation.
- [ ] User decisions or explicit assumptions were recorded.
- [ ] UI experience contract completed for every affected UI surface, or marked N/A for backend/domain-only work.
- [ ] Spec-to-eval criteria written before implementation.
- [ ] Frontend experience quality gate completed for UI-bearing work.
- [ ] Product-grade platform gate completed for UI-bearing work.
- [ ] Mobile screen map, navigation/back behavior, and dashboard impact documented where applicable.
- [ ] User-facing seed/mock/UAT data uses realistic names/sites/products/rewards, or temporary content is explicitly recorded.
- [ ] Required visual assets/media are present, or temporary asset strategy is explicitly recorded.
- [ ] Tests pass.
- [ ] Browser workflow UAT completed for every affected UI section.
- [ ] Browser UAT exercised visible controls directly; no hidden-input or direct API shortcut was used as sole proof.
- [ ] Browser/profile conditions were recorded; clean isolated/incognito profile is the default for agent UAT, and user-profile anomalies are treated as environment hypotheses before product patches.
- [ ] Exact user-facing local/staging URL was tested.
- [ ] Browser console/network/hydration failures were checked.
- [ ] Each UI mutation verified through persisted API/database readback.
- [ ] Denied paths tested.
- [ ] Audit events added for high-risk actions.
- [ ] Output eval completed.
- [ ] Trajectory eval completed.
- [ ] Security/eval gate completed.
- [ ] Residual risks documented.
