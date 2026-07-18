# Phase 25C Contract - End-User Mobile Visual Remediation

Status: Active contract  
Created: 2026-07-10  
Scope: Contractor and Team Member end-user mobile app only.

## Source Inputs

- `MOBILE_APP_MANUAL_UAT_TRIAGE.md`
- `APPROVED_STITCH_UI_CONTRACT.md`
- `FRONTEND_EXPERIENCE_STANDARD.md`
- `PRODUCT_GRADE_PLATFORM_STANDARD.md`
- `PHASE_25_MOBILE_UAT_REMEDIATION_PLAN.md`

## Design References

Primary approved references:

- `SCR-20260706-lxxg.png` and `SCR-20260706-lxtq.png` for dashboard/wallet/reward hierarchy.
- `SCR-20260706-lydn.png` for rewards, balance, claims, and activity shell.
- `SCR-20260706-lxzg.png` and `SCR-20260706-lymu.png` for scan/result/status clarity.

Background patterns reviewed conceptually:

- Indian payment-app wallet hierarchy: prominent balance, compact stats, high-frequency CTA.
- Rewards/loyalty app product tiles: stable image zone, name, cost, progress/gap, status.
- Transaction history rows: status icon, human-readable product/reference, actor, date/time, point value.
- Profile management screens: avatar, image set/change/remove, account/security actions separated.

Adopt:

- Stable zones for reward image, reward identity, cost, status, progress/gap, and Claim ID.
- Promotion copy outside the image so image legibility does not control text readability.
- Scan History rows using product/reference/site/actor labels rather than placeholder avatars or raw IDs.
- Profile photo set/change/remove as a real workflow with persistence readback.

Reject for this wave:

- Pixel-copying Stitch layouts.
- New UI framework or animation library.
- Native image-picker dependency until native-device validation is scheduled. Expo Web file input is implemented now; native picker remains an explicit residual.

## Screen Contracts

### Rewards Tab

Persona: Contractor.  
Primary job: understand available rewards, progress to unlock, active claims, and delivered rewards.  
Entry path: bottom tab `Rewards`; reward detail opens on stack screen.  
Required visible data: image, reward name, quick description when space allows, Rs/points required, tier, status, progress/gap, Claim ID for chosen rewards.  
States: loading, empty, available/locked, claim raised, delivered.  
UAT target: no essential text overflow at `360x740`, `390x844`, `430x932`, `480x900`.

### Promotion Banner

Persona: Contractor and Team Member.  
Primary job: see a retailer promotion without losing dashboard readability.  
Entry path: dashboard and Team Member landing.  
Required behavior: title/body render above/outside image; image remains visual support.  
States: no promotion hidden, promotion with image, promotion without image.

### Profile

Persona: Contractor.  
Primary job: view identity and set/change/remove profile photo.  
Entry path: dashboard profile avatar -> `Profile` stack screen.  
Required behavior: visible image picker on Expo Web, image type/size validation, preview, save, remove, API/session readback.  
Residual: native iOS/Android image-picker permission flow remains pending before store-readiness claim.

### Scan History And Scan Detail

Persona: Contractor and Team Member.  
Primary job: review scan attempts with readable references and correct point meaning.  
Entry path: bottom tab `History`; row opens `HistoryDetail`.  
Required visible data: product/reference, site, actor type, date/time, QR value, credited points, status.  
States: success, reserved, failed, already claimed, expired, invalid, permission denied, reserved cart navigation guard.

## Exit Gates

- `npm run test --workspace @volt-rewards/api`
- `npm run test --workspace @volt-rewards/mobile`
- `git diff --check`
- API/database readback for contractor photo update.
- Viewport proof for Rewards, Profile, Promotion, and Scan History at the mobile matrix where browser tooling allows it.
- Output eval and trajectory eval updated with residual native picker gaps.
