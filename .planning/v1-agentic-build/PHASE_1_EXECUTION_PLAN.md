# Phase 1 Execution Plan - Architecture And Domain Core Start

## Goal

Lock the architecture baseline and begin the first implementation slice with deterministic domain rules.

## Source Requirements

- PLAT-001 through PLAT-007
- AUTH-001 through AUTH-023
- SITE-001 through SITE-009
- QR-001 through QR-018
- RWD-001 through RWD-017
- MADM-001 through MADM-024
- REP-001 through REP-010

## Tasks

- [x] Draft architecture decisions.
- [x] Draft auth and permissions.
- [x] Draft CI/CD plan.
- [x] Scaffold npm workspace.
- [x] Create shared domain package.
- [x] Implement QR state machine.
- [x] Implement role permission matrix.
- [x] Implement reward ledger transition helpers.
- [x] Add unit tests for core domain behavior.
- [x] Choose Prisma for database access and migrations.
- [x] Scaffold NestJS API shell.
- [x] Wire API shell to shared domain services.
- [x] Add API shell tests.

## Out Of Scope

- Expo app implementation.
- Next.js web implementation.
- NestJS API implementation.
- Real BUSY connector.
- Real SMS/OTP provider.

## Acceptance Criteria

- Architecture baseline is documented.
- Domain package can run tests locally.
- Tests cover first QR, reward, and permission invariants.
- No UI code exists before domain rules are testable.

## Verification

- `npm test` - 17 tests passing.
- `npm run test:domain` - 14 tests passing.
- `npm run test:api` - 3 tests passing.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm --cache .npm-cache audit --omit=dev` - found 0 vulnerabilities.

Note: API HTTP listener tests were avoided because the sandbox blocks local socket binding. The API shell is tested through Nest's testing module and direct controller invocation.
