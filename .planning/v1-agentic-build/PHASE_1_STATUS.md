# Phase 1 Status - Architecture And Domain Core Start

Updated: 2026-06-22

## Completed

- Architecture decisions documented.
- Auth and permissions draft documented.
- CI/CD plan draft documented.
- npm workspace scaffolded.
- `packages/domain` created.
- QR lifecycle helpers implemented.
- Reward ledger helpers implemented.
- Role permission matrix implemented.
- Audit event helper implemented.
- Domain tests added.
- Prisma selected for PostgreSQL database access and migrations.
- NestJS API shell created under `apps/api`.
- API shell uses Fastify adapter to avoid unnecessary Express/Multer dependency exposure.
- API shell wired to shared domain package through `DomainPreviewService`.
- API tests added for health, QR reprint, and OWNER-only reward fulfillment denial.

## Files Added

- `package.json`
- `tsconfig.base.json`
- `.env.example`
- `.gitignore`
- `packages/domain/package.json`
- `packages/domain/src/types.ts`
- `packages/domain/src/qr.ts`
- `packages/domain/src/rewards.ts`
- `packages/domain/src/permissions.ts`
- `packages/domain/src/audit.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/qr.test.ts`
- `packages/domain/src/rewards.test.ts`
- `packages/domain/src/permissions.test.ts`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/health/health.controller.ts`
- `apps/api/src/policies/policies.module.ts`
- `apps/api/src/policies/policies.service.ts`
- `apps/api/src/domain/domain.module.ts`
- `apps/api/src/domain/domain-preview.controller.ts`
- `apps/api/src/domain/domain-preview.service.ts`
- `apps/api/src/app.test.ts`
- `package-lock.json`

## Verification

- `npm test` passed.
- `npm run test:domain` passed.
- `npm run test:api` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm --cache .npm-cache audit --omit=dev` passed with 0 vulnerabilities.

Current test count: 17 passing.

## Important Implementation Notes

- Domain code remains framework-independent.
- Domain and API now compile with TypeScript.
- API shell is a NestJS/Fastify shell, not database-backed yet.
- API shell currently exposes domain-preview endpoints for wiring tests; production endpoints should be introduced with persistence and guards.
- Prisma is selected but schema/client integration is not implemented yet.
- HTTP listener tests are avoided because this sandbox blocks local socket binding.

## Next Slice

Persistence-backed backend slice started in `PHASE_2_EXECUTION_PLAN.md` and `PHASE_2_STATUS.md`.

Remaining next work after Phase 2:

1. Add local Postgres/migration runbook.
2. Add seed data path.
3. Add mock BUSY import service.
4. Add QR print service that creates QR units and active token hashes.
5. Add guards/policies around protected endpoints.

This still uses mock BUSY and mock SMS/OTP providers until those open questions are resolved.
