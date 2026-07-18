# CI/CD Plan Draft

Status: Draft.

## Local Quality Gates

Initial local scripts:

- `npm test`
- `npm run typecheck`
- `npm run lint`

These start with `packages/domain` and expand as apps are added.

## Required CI Gates

Before merging production code:

1. Install dependencies from lockfile.
2. Format/lint.
3. Type check.
4. Unit tests.
5. Integration tests.
6. API contract generation/check.
7. Secret scan.
8. Dependency vulnerability scan.
9. Web build.
10. Mobile build/type check.
11. E2E smoke tests for critical workflows.

## Critical Workflow Tests

- Invoice import -> QR unit print.
- QR scan -> points ledger.
- Reprint -> old token rejected.
- Admin Mobile return scan cancel.
- Admin Mobile return scan reverse.
- Admin Web denies returned-product QR status scan/cancel/reverse routes in v1.
- Contractor redeem reward.
- Contractor cancel chosen reward.
- OWNER fulfill reward.
- STAFF denied reward fulfillment.
- Team Member denied restricted data.

## Security Gates

- No hardcoded secrets.
- No new dependency without review.
- No client-only authorization for protected actions.
- Audit event exists for each high-risk mutation.
- Denied-path tests exist for each role restriction.

## Release Stages

1. Local.
2. CI.
3. Staging with mock or non-production BUSY data.
4. Production dry run.
5. Production release.

## Observability Requirements

Minimum production telemetry:

- API request logs with request id.
- Audit events for high-risk actions.
- Error reporting.
- QR scan failure metrics.
- OTP failure/rate-limit metrics.
- Export generation metrics.
- BUSY sync success/failure metrics.
