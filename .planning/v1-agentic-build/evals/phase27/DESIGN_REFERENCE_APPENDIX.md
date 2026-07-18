# Phase 27 Design Reference Appendix

Status: Active reference gate  
Created: 2026-07-15

## Primary Reference

The primary approved visual direction remains `APPROVED_STITCH_UI_CONTRACT.md` and the Stitch screenshot set in `Sample_References/Screenshots from Stitch/`.

Phase 27 uses the external references below only as secondary pattern checks. They do not replace the approved Volt Rewards visual language and must not introduce copied branding, colors, assets, copy, or layouts.

## External Pattern Sources

Sources reviewed on 2026-07-15:

- [PhonePe](https://www.phonepe.com/) - high-frequency Indian payments patterns, broad payments surface, QR/device trust language, safety positioning.
- [Google Pay India](https://pay.google.com/intl/en_in/about/) - simple bank-account/UPI money movement, low-friction getting-started language, clean trust model.
- [Paytm](https://paytm.com/) - UPI/payments breadth, cashback/loyalty framing, trust and help/safety patterns.
- [CRED](https://cred.club/) - premium reward membership, reward/perk language, secure financial experience positioning.

## Adopted Patterns

- Keep the primary scan action easy to find, visually dominant, and operationally fast.
- Use a compact wallet/reward hierarchy: available points first, lifetime/tier progress second, activity and rewards next.
- Keep trust and safety visible through short reassuring panels, not long explanatory text blocks.
- Use icon-led controls for PIN reveal, scan, history, rewards, profile/photo, and role actions.
- Treat rewards as status-driven cards with image, points, progress/gap, claim status, and one clear primary action.
- Make role and permission boundaries visible without turning them into warnings on every screen.
- Keep bottom navigation predictable and limited to top-level app jobs.
- Keep QR/payment-like workflows clear about state transitions: ready, pending, successful, failed, retryable.

## Rejected Patterns

- Do not copy PhonePe, Google Pay, Paytm, CRED, or Stitch branding, colors, illustrations, layouts, or marketing copy.
- Do not create a super-app home with unrelated services; Volt Rewards stays focused on QR collection, rewards, sites, and admin operations.
- Do not over-gamify rewards with unrelated games, coins, or scratch-card mechanics in v1.
- Do not use dark premium visuals from CRED for the contractor app; the approved Volt direction is light, clear, and field-friendly.
- Do not hide operational controls inside marketing-style banners or decorative cards.
- Do not rely on promotional cashback language where the product rule is points collection.

## Screen Mapping

End-user mobile:

- Role/Login: use approved Stitch role/login screens plus Google Pay-style simplicity for trust and setup.
- Contractor Dashboard: use approved Stitch dashboard plus PhonePe/Google Pay-style fast primary action placement.
- Scan QR: use approved Stitch scan states plus payments-app clarity around selected context, QR state, retry, and success.
- Scan History and Balance Book: use transaction-list patterns with strong title, metadata, status, and detail drilldown.
- Rewards: use CRED/loyalty-style reward status clarity, but with Volt's points and claim language.
- Profile: use practical settings/profile patterns with visible photo picker, remove action, and readback state.
- Team Member: use limited-access scan-first structure; avoid full contractor-account affordances.

Admin Mobile:

- Login: use app-native PIN reveal and concise operator context.
- Dashboard: use operational command cards, not static metric blocks.
- Return Scan: use scan-result state grammar with cancel/reverse decision clarity.
- Contractors/Staff/Reports: use dense but tappable list/detail/action patterns.
- Rewards: use mobile sections/sub-tabs for Claim Desk, History, Catalog, and Fulfillment where role-allowed.

## Design Gate Result

Phase 27 may proceed with the approved Stitch screenshots as primary direction and the four external references above as secondary pattern checks. Any later departure from this appendix must be recorded in the active phase plan before implementation.
