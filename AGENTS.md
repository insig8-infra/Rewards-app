# Agent Instructions - Volt Rewards V1

## Source Of Truth

For the v1 build, use these files as the authoritative starting point:

1. `app-requirementsV1.md`
2. `The New SDLC With Vibe Coding_Day_1.md`
3. `Agent Tools & Interoperability_Day_2.md`
4. `Agent Skills_Day_3.md`
5. `Vibe Coding Agent Security and Evaluation_Day_4.md`
6. `.planning/v1-agentic-build/*`

If older `.planning/` or `client-deliverables/` files conflict with `app-requirementsV1.md`, treat `app-requirementsV1.md` as the current product input and surface the conflict before implementing.

## Development Mode

This project must be built with agentic engineering discipline, not ad-hoc vibe coding.

- Start from requirements, architecture, tests, and eval gates before implementation.
- Follow the AI-Driven SDLC loop for non-trivial work: requirements -> design/spec-to-eval -> build -> output eval -> trajectory eval -> review/deploy readiness -> maintenance feedback.
- Prefer small vertical slices that can be tested end to end.
- Keep all business-critical rules in backend/domain code, not only in mobile or web UI.
- Review and verify every generated change before treating it as shippable.
- Do not silently fill ambiguous product behavior. Record assumptions in the active phase plan or open questions.
- Bring forward phase-relevant open questions before implementing the area they affect.
- Treat backend/API-only work for a user-facing workflow as foundation work, not product completion, until the visible mobile/web experience is built and validated.
- Frontend work must satisfy `.planning/v1-agentic-build/FRONTEND_EXPERIENCE_STANDARD.md`; screens should look intentionally designed, modern, and product-specific.
- UI-bearing work must also satisfy `.planning/v1-agentic-build/PRODUCT_GRADE_PLATFORM_STANDARD.md`; real app navigation, realistic data, dashboard behavior, reward media, and honest shell-vs-product completion language are required.
- End-user mobile UX should use PayTM/PhonePe-style Indian payments-app patterns as inspiration only, with Volt Rewards theme tokens and no copied branding/assets.
- Mobile apps must be built with public App Store and Play Store readiness in mind from the start.

## Required Workflow

For every non-trivial change:

1. Read the relevant requirements IDs from `.planning/v1-agentic-build/REQUIREMENTS_LEDGER.md`.
2. Read the active phase plan.
3. Review `OPEN_QUESTIONS.md` and bring forward questions that affect the current phase before deciding behavior.
4. Identify affected domain rules, data model, APIs, UI surfaces, tests, and security gates.
5. Convert requirements into explicit eval criteria before implementation: BDD/state-action-outcome scenarios, business invariants, role rules, persistence/readback checks, UI acceptance criteria, and security checks.
6. For UI-bearing work, write the UI experience contract before implementation and use the frontend experience standard plus product-grade platform standard.
7. Write or update focused tests before or alongside implementation.
8. Implement only the required behavior.
9. Run output eval: unit tests, integration tests, lint/type checks, UI checks, visible workflow UAT, persistence readback, and security checks where applicable.
10. Run trajectory eval: confirm the right docs/context were read, open questions were surfaced, assumptions were recorded, tools were appropriate, deviations/failures were diagnosed, and harness/docs were updated after surprises.
11. Update the phase notes with what was delivered, what was verified, output-eval verdict, trajectory-eval verdict, and any gaps.

For browser/UI UAT:

- Use a clean isolated/incognito-like browser profile as the default agent verification surface.
- If a user's persistent browser profile behaves differently from incognito, investigate stale cache, extensions, blocked dialogs, service-worker/session state, and profile policy before changing product code.
- File uploads must use visible native/device picker paths or an explicitly approved native-equivalent pattern; hidden input manipulation is never sufficient completion evidence.
- Upload-control UAT must verify visible/enabled state, DOM hit target, accepted file types, no overlay interception, and chooser cleanup after cancel/upload.

## Technology Documentation

When a task asks about a library, framework, SDK, API, CLI, cloud service, setup, migration, or library-specific debugging, use Context7 MCP first:

1. Resolve the library ID.
2. Query the docs with the full user question.
3. Use the fetched docs for the answer or implementation.

## Security Rules

- Never hardcode secrets, QR signing keys, OTP values, API keys, BUSY credentials, or service tokens.
- Never put authorization decisions only in client code.
- Default to least privilege for OWNER, STAFF, Contractor, and Team Member flows.
- Treat QR token, points ledger, reward redemption, cancellation, reversal, and fulfillment as high-risk flows.
- Any destructive or irreversible action must have backend validation, audit logging, and tests.
- Dependencies must be real, maintained packages. Verify new package names before adding them.
- Do not connect agents or MCP tools to production data unless explicitly approved and scoped read-only.

## Product-Specific Rules

- App working names: `Volt Rewards`, `Volt Admin`, and `Volt Admin Web Portal`.
- End-user personas are `Contractor` and `Team Member`.
- Admin personas are `OWNER` and `STAFF`.
- Contractor login uses registered mobile number plus MPIN. First login uses temporary one-time MPIN and then requires SET MPIN.
- Team Member access is scan-limited and requires OTP sent to the contractor every session.
- Contractor and Team Member scanning must require site selection before QR scan.
- QR codes are unit-level, one-time, non-guessable, expirable, cancellable, reprintable by replacement token, and reversible only after scan/claim.
- Scan History is for QR scan attempts and outcomes.
- Contractor Scan History shows full contractor scan history across all sites and Team Member scans.
- Team Member Scan History shows only scans for sites the Team Member scanned for or attempted to scan for within allowed scope.
- Team Member Recent contractor is one clearable secure local entry populated only after successful OTP login, and never replaces OTP.
- End-user mobile app must include Hindi/English toggle from day one.
- Contractor login must land on the main dashboard; Team Member landing must stay limited and scan-first as approved in the screen contract.
- Contractor human names come from `User.displayName`; do not add duplicate name fields unless a future approved identity model separates display name, legal name, and business/shop name.
- User-facing seed/mock/UAT data must use realistic human names and product/site/reward data, not Demo/Runtime Gate/UAT/Isolated labels.
- Rewards includes Balance Book and Redeem/catalog behavior, including canceling a chosen reward before physical collection.
- Reward tiles/details must include images or documented temporary assets, points/Rs required, tier, status, progress, gap copy, and Claim ID when chosen.
- Only OWNER can fulfill rewards in admin mobile and admin web.
- Admin web handles QR printing and all non-camera OWNER/STAFF admin workflows available in Admin Mobile.
- Returned-product QR status scan, cancel, and reverse are Admin Mobile only in v1 because they require mobile camera scanning and label-removed/discarded confirmation.
- Admin web must not expose returned-product QR status scan, cancel, or reverse controls in v1.

## Implementation Boundaries

- Build deterministic domain services for QR lifecycle, points ledger, rewards, roles, sites, and audit events.
- Mobile and web clients should call APIs and render state; they should not decide core business validity.
- Use the realistic mock BUSY adapter as the active invoice data source until actual BUSY API integration is ready; the full product build must continue against this adapter.
- Keep protocol use pragmatic: MCP is allowed for development tooling and controlled integrations; A2A/A2UI/AP2/UCP are extension points, not v1 dependencies unless the phase plan explicitly adopts them.
