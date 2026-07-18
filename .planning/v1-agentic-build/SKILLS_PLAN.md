# Skills Plan

This plan applies `Agent Skills_Day_3.md` to the project. The goal is not to install a large skill library immediately. The goal is to make repeated domain work small, owned, testable, and loaded only when needed.

## Skill Governance

Rules:

- One skill, one job.
- Keep `SKILL.md` short.
- Move detailed examples, schemas, and edge cases to references.
- Include positive and negative trigger examples.
- Add eval cases before promoting a skill from draft to relied-upon.
- Treat skills as code.

Authority levels:

- Read-only: can explain, inspect, or derive a plan.
- Draft-only: can produce code/docs for review.
- Action-allowed: can change code or run workflows only after tests and human review gates exist.

## Planned Project Skills

### `qr-lifecycle`

Purpose: Guide implementation and review of QR unit creation, print, scan, expiry, cancel, reprint, and reverse rules.

Use when:

- Implementing QR state machine.
- Writing QR tests.
- Reviewing QR cancel/reverse/reprint behavior.

Do not use for:

- Reward catalog UI.
- General admin dashboard layout.

Initial authority: Draft-only.

Required eval cases:

- Printed/Unclaimed non-expired QR can be cancelled.
- Scanned/Claimed QR can be reversed.
- Reprinted old token is invalid.
- Expired unscanned QR cannot be cancelled unless future override exists.

### `reward-ledger`

Purpose: Guide reward catalog, redeem, cancellation, fulfillment, points restoration, negative balance, and Balance Book behavior.

Use when:

- Implementing rewards and Balance Book.
- Writing ledger tests.
- Reviewing reward cancellation or fulfillment logic.

Do not use for:

- QR print UI.
- BUSY invoice import.

Initial authority: Draft-only.

Required eval cases:

- Redeem deducts points and creates Claim ID.
- Cancel before collection restores points.
- OWNER fulfillment marks Delivered/Collected.
- QR reversal after fulfillment can create negative balance.

### `role-permissions`

Purpose: Guide access rules for Contractor, Team Member, OWNER, and STAFF.

Use when:

- Implementing auth.
- Implementing server authorization.
- Reviewing UI permissions.

Do not use for:

- Styling.
- Report calculations unrelated to access.

Initial authority: Draft-only.

Required eval cases:

- Team Member must OTP every session even with Recent contractor.
- Team Member cannot create/edit/delete sites.
- STAFF cannot export/share reports.
- Only OWNER can fulfill rewards in admin mobile and admin web.
- Admin Web exposes all non-camera OWNER/STAFF workflows but not returned-product QR scan/cancel/reverse in v1.

### `busy-integration`

Purpose: Guide BUSY invoice/return integration and mock adapter behavior.

Use when:

- Mapping BUSY fields.
- Implementing invoice import.
- Implementing return status checks for Not Printed units.
- Implementing ItemCodes item-master sync, reward-rule refresh, or QR print-time point resolution.

Do not use for:

- Mobile UI layout.
- Reward catalog content.

Initial authority: Read-only until real sample data exists.

Required eval cases:

- Duplicate invoice import does not duplicate QR units.
- Partial return blocks later printing for returned quantity.
- Missing required BUSY fields surfaces a clear integration error.
- ItemCodes refresh imports/updates TempItemCode, item name, category, price, and BUSY active/missing status without mutating already printed QR point values.
- ItemCodes with blank fixed Points and blank `% of Price` Points are flagged for owner attention.

### `ui-surface-implementation`

Purpose: Guide implementation of mobile/web surfaces against requirement IDs, persona restrictions, and visual behavior.

Use when:

- Building screens.
- Writing navigation.
- Testing rendered workflows.

Do not use for:

- Domain rule decisions that belong to backend.

Initial authority: Draft-only.

Required eval cases:

- Contractor scan requires site selection.
- Contractor and Team Member Scan QR require fresh site selection on every Scan visit, scanner controls stay hidden until selection, and `Add to account` clears active scan-site selection for the next batch.
- Team Member UI hides restricted data.
- OWNER and STAFF admin nav differ.
- Rewards disabled state communicates missing points.
- Mobile app work defines auth stack, authenticated stack, top-level tabs, detail/create/edit/confirm/result screens, back behavior, and post-success destinations before implementation.
- Contractor login lands on the main dashboard unless a phase has an explicit approved exception.
- Team Member landing stays limited and scan-first without exposing Contractor-only rewards/profile/site-management capabilities.
- Visible upload/browse controls open the native file chooser; direct hidden-input uploads are not sufficient completion evidence.
- Browser UAT runs against the exact URL the user will use, including `127.0.0.1` versus `localhost` differences during local development.
- Browser UAT uses a clean isolated/incognito-like profile by default; if a user's persistent Chrome profile differs, stale cache, extensions, blocked dialogs, service-worker/session state, or profile policy are investigated before app-code changes.
- Upload-control UAT verifies DOM hit target, visible/enabled state, accept list, no overlay interception, and chooser cleanup after cancel/upload.
- Browser console/network failures block phase completion unless explicitly documented as accepted residual risk.
- Create/save, edit/update, deactivate/delete/cancel, and denied/read-only paths are exercised for every management section that exposes them.
- Every successful UI mutation is verified through API or database readback.

### `ai-driven-sdlc-iteration`

Purpose: Enforce the AI-Driven SDLC loop from requirements to design, build, output eval, trajectory eval, review/deploy readiness, and maintenance feedback.

Use when:

- Starting any non-trivial phase.
- Completing any phase.
- A manual UAT finding exposes a gap in either product output or the agent's process.
- Deciding whether a slice can be called complete.

Do not use for:

- One-line mechanical fixes that do not affect requirements, UI, security, data, or behavior.

Initial authority: Read-only gate until codified as a local skill.

Required eval cases:

- Requirements are converted into explicit eval criteria before implementation.
- Output eval verifies requirements, business rules, UI behavior, persistence/readback, and security.
- Trajectory eval verifies context used, open questions surfaced, assumptions recorded, tools chosen, deviations, failures, and self-corrections.
- A phase cannot be called product-workflow complete unless output eval and trajectory eval both pass.
- Surprises from UAT or production-like testing update the harness before new feature breadth resumes.

### `frontend-experience-quality`

Purpose: Review and guide frontend UX, layout, control placement, visual hierarchy, screen states, and polish against the product persona and `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`.

Use when:

- Planning or building any new screen.
- Reviewing Admin Web, Admin Mobile, or end-user mobile UI.
- Deciding whether a UI phase feels production-grade.
- Interpreting `Sample_References/`, especially the client-approved `Sample_References/Screenshots from Stitch/` mobile UI direction.
- Reviewing whether the current UI matches `.planning/v1-agentic-build/PRODUCT_GRADE_PLATFORM_STANDARD.md`.

Do not use for:

- Backend-only domain rules.
- QR/points/reward state-machine validity.
- Adding visual libraries without a phase-specific reason.

Initial authority: Draft-only.

Required eval cases:

- Admin Web operations screens are dense, calm, and task-focused rather than marketing-style or generic.
- Mobile scan flows keep site context visible and make success/failure states unmistakable.
- End-user mobile follows `APPROVED_STITCH_UI_CONTRACT.md` as the primary visual direction; PayTM/PhonePe-style patterns are secondary background context only.
- Phase plans cite the applicable approved Stitch screenshots for role selection, login, dashboard, scan result, Balance Book/Rewards, Team Member entry, and helper scan states.
- UI review explicitly rejects copying the Stitch editor chrome: black dotted canvas, purple selection frame, or browser/editor labels.
- Form actions, destructive actions, and secondary actions are placed near the data they affect.
- Empty/loading/error/denied states are designed, not left as generic browser or framework defaults.
- Screen copy and layout survive Hindi/English expansion without overflow.
- Hindi/English toggle exists from the first end-user mobile shell.
- Contractor and Team Member scan-history visibility differ correctly by persona.
- Team Member Recent contractor appears only after successful OTP login, has clear/remove control, and never bypasses OTP.
- Mobile implementation choices remain compatible with public App Store and Play Store launch.
- References from `Sample_References/` are used deliberately; `Screenshots from Stitch/` is the approved mobile target, and `Stitch_Admin_design.md` remains color/admin-web direction only.
- User-facing seed/UAT data uses human names and realistic product/site/reward content, not demo/runtime/UAT labels.
- Reward tiles/details show image/media, required points, tier, status, progress, gap copy, and Claim ID when chosen.
- Mobile workflows use real navigation and back behavior rather than a single long panel shell when product completion is claimed.

### `product-grade-platform-review`

Purpose: Review whether a slice meets `PRODUCT_GRADE_PLATFORM_STANDARD.md`, including app navigation, dashboard structure, realistic data, reward media, and product-completion language.

Use when:

- Starting or completing any UI-bearing mobile/web phase.
- Deciding whether a visible shell can graduate to product-grade workflow completion.
- Reviewing seed/UAT data before screenshots, demos, or client validation.
- Reviewing reward catalog, dashboard, profile, scan, site, or admin management screens.

Do not use for:

- Backend-only domain tests with no user-facing surface.
- Pure database migrations unless they affect user identity/media/data contracts.

Initial authority: Read-only gate until its eval cases are automated.

Required eval cases:

- `User.displayName` is the source for contractor human names across app/web/API responses.
- User-facing seed data avoids `Demo`, `Runtime Gate`, `UAT`, and `Isolated` labels.
- Contractor login lands on a dashboard with identity, points, tier, primary scan action, selected-site context, recent activity, and reward prompts.
- Team Member landing remains scan-first and limited while showing contractor identity and site context.
- Top-level tabs and stack/detail screens are documented and implemented for mobile product-complete work.
- Back/cancel/unsaved-form behavior is defined for create/edit/detail/confirm/result screens.
- Reward tiles and detail screens include images or documented temporary assets plus progress/status/action metadata.
- Phase status honestly labels any remaining shell, mock, placeholder, or temporary content.

### `phase-question-governance`

Purpose: Ensure phase-relevant open questions are brought forward to the user before implementation decisions are made.

Use when:

- Starting a phase or slice.
- Creating or updating a phase plan.
- A product behavior, data policy, provider choice, UI behavior, or business rule is ambiguous.
- A previous open question becomes relevant to the current implementation area.

Do not use for:

- Purely mechanical refactors with no behavior change.
- Implementation details already locked in `architecture/DECISIONS.md`.

Initial authority: Read-only gate.

Required eval cases:

- Rewards questions are brought forward before reward catalog, tier, redemption, or Balance Book implementation.
- QR/BUSY questions are brought forward before cancellation, return, line matching, or production connector work.
- OTP/SMS provider and lockout questions are brought forward before production auth hardening.
- Media storage questions are brought forward before production photo upload/storage work.
- UI default behavior questions are brought forward before mobile screen implementation rather than silently decided.

### `security-eval-gate`

Purpose: Guide phase completion review using security and evaluation gates.

Use when:

- Completing a phase.
- Preparing release.
- Adding dependencies.
- Changing auth, QR, points, rewards, or exports.

Do not use for:

- Pure copy edits or local docs with no behavior impact.

Initial authority: Read-only gate.

Required eval cases:

- New dependency verified.
- Server-side authorization test exists.
- Audit event exists for high-risk action.
- Secret scan and relevant tests run.

## Cold Start Plan

Do not install all skills as active runtime dependencies yet. First:

1. Build phase 1 architecture docs.
2. Create draft skill folders for `qr-lifecycle`, `reward-ledger`, and `role-permissions`.
3. Add 3 positive and 3 negative trigger cases for each.
4. Add JSON eval cases for key workflows.
5. Use the skills during implementation and revise after real failures.

## Frontend Tooling And MCP Plan

Required tools by phase:

- Library/framework docs: use Context7 MCP before setup, migration, or library-specific implementation for Next.js, React, Expo, React Native, NestJS, Prisma, Supabase, or UI libraries.
- Web UI validation: use Browser plugin or Playwright against the exact local/staging URL.
- Mobile UI validation: use Expo simulator/device workflow once mobile implementation begins. Expo Web can supplement but cannot be the only proof for camera/contacts/secure-storage behavior.
- Visual review: capture screenshots for desktop and mobile-width layouts and compare against the active screen contract and `FRONTEND_EXPERIENCE_STANDARD.md`.
- Mobile design research: before a major mobile recovery/redesign slice, review the approved Stitch references plus 3-5 production-grade rewards, loyalty, payment, or high-engagement app patterns/templates; record what is adopted/rejected before implementation.
- Persistence review: verify successful UI mutations through API/database readback; DB-backed schema changes also require migration deploy/status evidence against the same runtime database.
- Output/trajectory eval: mobile slices must update phase eval artifacts with visible-control evidence, workflow-match checks, missed-defect learnings, and residual native-device gaps.

Dependency rule:

- Do not add a component library, animation library, icon pack, MCP server, or visual tooling dependency without documenting why the existing stack is insufficient, what risk the dependency introduces, and how it will be verified.
