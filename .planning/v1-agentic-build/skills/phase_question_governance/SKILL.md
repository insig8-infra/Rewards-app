---
name: phase-question-governance
description: |
  Bring phase-relevant open questions to the user before implementation choices are made. Use when starting a phase, creating a plan, or encountering ambiguous product behavior, provider choices, data policy, UX defaults, or business rules. Do NOT use for behavior already locked in architecture decisions.
version: 0.1.0
authority: read-only
---
# Phase Question Governance

## When To Use

- Starting a new phase or slice.
- Creating or updating a phase plan.
- A product behavior is ambiguous.
- An item from `OPEN_QUESTIONS.md` now affects the current build area.
- A decision would affect user experience, business policy, provider choice, permissions, money/points, data retention, or production operations.

## When Not To Use

- Purely mechanical refactors with no user-visible or business-rule effect.
- Implementation details already locked in `architecture/DECISIONS.md`.

## Workflow

1. Read `.planning/v1-agentic-build/OPEN_QUESTIONS.md`.
2. Read the active phase plan and requirement IDs.
3. Extract only questions that affect the current phase.
4. Classify each as:
   - Blocking before implementation
   - Needed before phase completion
   - Safe to defer with an explicit assumption
5. Present blocking and completion-relevant questions to the user before implementing.
6. Record the answer in `OPEN_QUESTIONS.md` and, if durable, `architecture/DECISIONS.md`.
7. Record any temporary assumption in the phase plan and completion notes.

## Required Checks

- The agent did not silently choose a product behavior that belongs to the user/client.
- Open questions are not dumped all at once; only phase-relevant questions are brought forward.
- Deferrals name the affected future phase or slice.
- User answers are reflected in the durable docs before implementation proceeds.
- If a question remains unanswered, the phase plan states the mock boundary or assumption explicitly.
