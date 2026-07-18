---
name: security-eval-gate
description: |
  Run the completion gate for a phase or high-risk change. Use before marking slices complete, adding dependencies, changing auth, QR, points, rewards, exports, or deployment config. Do NOT use for simple typo-only docs edits.
version: 0.2.0
authority: read-only
---
# Security Eval Gate

## When To Use

- Completing an implementation phase.
- Adding or changing a dependency.
- Changing auth, QR, points, rewards, reports, exports, or BUSY integration.
- Preparing staging or production release.

## When Not To Use

- Typo-only documentation edits with no behavioral impact.

## Workflow

1. List requirement IDs covered.
2. List files changed.
3. Confirm tests added or updated.
4. Confirm server-side authorization for protected actions.
5. Confirm audit events for high-risk mutations.
6. Confirm dependencies and secrets are checked.
7. For UI-bearing phases, confirm interaction-faithful Browser UAT was completed.
8. Record tests run and residual risk.

## Required Checks

- No secrets in repo.
- No client-only authorization.
- New dependencies are verified.
- High-risk actions have audit logs.
- Denied-path tests exist.
- Relevant unit/integration/UI checks passed or are explicitly documented as not run.
- UI flows are verified through visible user controls at the exact tested URL.
- Each successful UI mutation has API/database readback evidence.
- Browser console/network failures are resolved or documented as accepted residual risk.
