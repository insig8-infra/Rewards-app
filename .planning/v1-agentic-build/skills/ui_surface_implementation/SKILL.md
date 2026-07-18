---
name: ui-surface-implementation
description: |
  Implement or review mobile and web UI surfaces against requirement IDs, persona restrictions, and workflow behavior. Use for screens, navigation, forms, states, and UI tests. Do NOT use for backend-only domain rules.
version: 0.2.0
authority: draft-only
---
# UI Surface Implementation

## When To Use

- Building end-user mobile screens.
- Building admin mobile screens.
- Building admin web screens.
- Writing UI workflow tests.

## When Not To Use

- Deciding QR, points, reward, or permission validity without backend rules.

## Workflow

1. Identify surface and persona.
2. Read requirement IDs for the workflow.
3. Define state/action/outcome browser scenarios for every affected workflow.
4. Confirm backend API/state contract exists or mark as blocked.
5. Build UI states: loading, success, empty, validation error, permission denied, network retry.
6. Verify text fits on mobile and Hindi/English requirements are considered.
7. For end-user mobile, include the Hindi/English toggle, persona-specific scan-history scope, Team Member Recent clear/remove behavior, and store-ready native capability constraints in the screen contract.
8. Run Browser UAT on the exact URL the user will use, or the closest available simulator/device workflow for mobile.
9. Verify every UI mutation through API or database readback.
10. Record console/network failures, screenshots, residual risk, and commands run.

## Browser UAT Contract

For web surfaces, completion evidence must use a real browser session against the exact local or staging URL. For mobile surfaces, use the closest available simulator/device workflow and record any gap.

Required browser checks:

- Page hydrates and interactive controls respond at the tested URL.
- Browser console has no unhandled errors relevant to the workflow.
- Network calls return the expected status codes.
- Visible controls are exercised directly: buttons are clicked, inputs are typed into, toggles are toggled, selects are changed.
- File uploads prove the visible browse/upload affordance opens the file chooser. Directly setting a hidden file input is allowed only as an additional low-level check.
- Create/save, edit/update, and delete/deactivate/cancel paths are tested when the section exposes them.
- Denied/read-only persona behavior is tested with scoped assertions against the relevant panel, not broad page text matches.
- At least one desktop and one mobile-width rendering check is done for new or materially changed layouts.
- Screenshots or explicit observations are recorded for visual behavior and layout fit.
- API/database readback confirms the persisted result after each successful UI mutation.

## Required Checks

- Contractor scan requires site selection.
- Team Member UI hides restricted data.
- Contractor Scan History shows full contractor history across sites and Team Member scans.
- Team Member Scan History shows only allowed site/session-attributed scans and attempts.
- Team Member Recent contractor appears only after successful OTP login, is clearable, and never bypasses OTP.
- OWNER and STAFF admin navigation differ.
- STAFF forbidden actions are absent or blocked.
- Rewards disabled state clearly explains missing points.
- End-user mobile has a Hindi/English toggle from day one.
- Mobile UI implementation does not rely on dev-only behavior that would block public App Store or Play Store launch.
- High-risk actions have confirmation states.
- No UI-bearing phase is complete while the live browser path shows failed fetches, hydration errors, blocked client chunks, or unclickable visible controls.
