# Phase 60 - Railway Client Demo Deployment

Status: Source Prepared / Railway Link Verification Pending
Started: 2026-07-24

## Objective

Prepare and deploy public Railway links for Admin Web Portal, End-User Mobile, and Admin Mobile so the client can show the product to their team from a laptop.

## Requirements Trace

- `PLAT-002`: End-user app available on Android and iOS.
- `PLAT-003`: Admin app available on Android and iOS.
- `PLAT-004`: Mobile apps use a cross-platform stack.
- `PLAT-005`: Admin web portal available in browser.
- `WEB-015`: Admin Web supports management workflows by role.
- Phase 34: Railway Test API is already live on public HTTPS.

## Open-Question Review

| Question | Phase 60 handling |
| --- | --- |
| Production hosting architecture | This phase is a client-demo Railway deployment using the already selected Railway + Neon UAT path. Final production hardening remains a later launch gate. |
| Native App Store / Play Store release | Not in scope for this phase. Mobile links are Expo web exports for laptop demo; native builds remain the store-ready path. |
| Railway authentication | Agent has no Railway CLI/API token. Source packaging and GitHub push can be completed here; Railway service-domain generation may require Railway UI confirmation unless a Railway token is provided. |

## Eval Criteria

- Each frontend has a deterministic Railway Dockerfile.
- Mobile web exports bake the public Railway API base URL at build time.
- Admin Web binds to Railway's `PORT` and uses the public Railway API base.
- Local production builds pass for Admin Web, End-User Mobile web export, and Admin Mobile web export.
- Deployment runbook lists exact service variables, Dockerfile paths, and verification gates.
- Public links are verified before being sent to the client, or the remaining Railway auth/domain blocker is stated clearly.

## Implementation Checklist

- [x] Review current Railway/API setup and prior deployment phase.
- [x] Add frontend Railway Dockerfiles and static Expo web server.
- [x] Document Railway service setup and variables.
- [x] Run local output eval builds.
- [ ] Push deployable source for Railway GitHub integration.
- [ ] Verify Railway public links.

## Trajectory Eval

- Started from requirements, open questions, and prior Railway status.
- Scoped this slice to deployment packaging and demo readiness, not product behavior changes.
- Used Context7 Railway docs for Dockerfile/service variable behavior.
- Output eval includes Admin Web production build, both Expo web exports, static server smokes, mobile typechecks, and live API health.
