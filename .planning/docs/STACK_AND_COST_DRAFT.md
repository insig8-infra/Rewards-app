# Stack And Cost Draft

**Date:** 2026-06-04
**Status:** Superseded draft after 2026-06-08 Discovery Call 1

> **Do not use this as current build/cost baseline.** This draft was based on an Android-only end-user pilot and web admin scope. Discovery Call 1 expanded scope to Android+iOS end-user apps, Android+iOS admin apps, and browser admin web portal. Regenerate stack and cost after PRD lock.

## Recommended Pilot Architecture

Selected cost direction:

- Native Android app distributed through APK/internal testing.
- Next.js admin panel and backend/API.
- Managed PostgreSQL, with Neon Launch as the working cost assumption.
- Vercel Pro as the working hosting cost assumption.
- MSG91 OTP as the working India OTP provider.
- Firebase App Distribution / FCM for APK distribution and push notifications.
- TSC TE244 for QR label printing, subject to vendor quote and sample print validation.

### Electrician App

Required pilot target: native Android app.

Reason: client explicitly requires native Android. This gives stronger camera control for QR scanning and a familiar installable app experience for electricians.

Pilot distribution: direct APK/internal testing build. Play Store publication is outside pilot scope unless explicitly added later.

### Admin Panel

Recommended: responsive web admin panel.

Core modules:

- Electrician registration.
- SKU/category and point setup.
- BUSY invoice lookup.
- QR label generation.
- QR label printing.
- Return scan/reversal.
- Electrician data and point reports.
- Notification management.

### Backend

Recommended: API backend with application-owned database.

Responsibilities:

- OTP authentication.
- Role-based access.
- QR token generation.
- QR validation and redemption.
- Points ledger.
- Return reversals.
- BUSY invoice import/sync.
- Notifications.
- Audit logs.

### Database

Recommended: managed PostgreSQL for app-owned data.

BUSY remains invoice source of truth. Our database stores loyalty users, QR labels, scan events, point ledger, tiers, redemption requests, and admin audit logs.

### BUSY Integration

Recommended pilot flow:

- Admin selects latest invoice.
- Backend or local connector reads BUSY invoice and line item data.
- App generates QR labels only once per invoice unless admin reprints existing labels.

Working assumption: BUSY data is on a local server with SQL/API access available.

Recommended implementation stance:

- If backend can safely access BUSY data on the local server, read invoice data directly.
- If backend is cloud-hosted and cannot reach the local server, install a small local connector in the shop network to read BUSY invoice data and sync only required invoice metadata and line items.
- Use read-only BUSY access wherever possible.

Final integration design still depends on verified BUSY version, schema/API, network access, and client security policy.

### QR Printing

Recommended pilot printer:

- **TSC TE244 desktop thermal transfer barcode label printer**.
- Treat this as a research-based recommendation, not a locked purchase decision.
- It is a mid-range, cost-effective desktop model, not a top-of-line industrial printer.
- It supports both thermal transfer and direct thermal printing; use thermal transfer for product QR labels.
- It supports 203 DPI, QR/2D barcodes, approx. 4-inch print width, 5-inch label roll capacity, 300m ribbon, and 5-6 inches/second batch printing depending on source/spec sheet.
- It appears available in India and has Ahmedabad/Gujarat supplier listings.

Recommended pilot labels:

- Start with 50 mm x 25 mm or 50 mm x 30 mm adhesive thermal-transfer labels.
- Print QR code plus short human-readable code, SKU/category, and optional expiry date.
- Keep QR payload short through a short URL/token format so 203 DPI remains scan-safe.
- Use wax-resin ribbon if labels need better resistance to handling than plain wax.

Fallback options:

- **Zebra ZD230t**: stronger global brand and support ecosystem, usually higher cost.
- **Argox CP-2140**: viable alternative with QR support, but pricing/availability should be checked against local support.
- **TSC TE344 / 300 DPI model**: use only if client needs very small labels or dense QR codes.

Implementation approach:

- Generate label PDFs/browser print layouts first.
- Validate test prints with the exact printer, label stock, ribbon, and Android scanner before bulk label purchase.
- Printer-specific commands can be added only if browser/PDF printing is unreliable.

### OTP / SMS

Working recommendation:

- MSG91

Alternatives if delivery, onboarding, or pricing becomes a problem:

- Twilio
- Exotel
- 2Factor
- Firebase Authentication phone OTP

Final onboarding still depends on India SMS deliverability, DLT compliance, sender/template approval, and client account preference.

### Hosting

Recommended working assumption:

- Vercel Pro for admin/API hosting.
- Neon Launch for managed PostgreSQL.

Alternatives if client prefers:

- Supabase Pro can replace Neon if we want a broader backend platform at $25/month.
- AWS Lightsail/EC2/RDS can be used if client wants AWS ownership, but it adds more DevOps overhead.

Final choice should balance pilot speed, Indian client billing preference, operational simplicity, and production path.

## Cost Items To Verify

| Item | Needed For | Pricing Status |
|------|------------|----------------|
| App hosting | Admin panel and API | Vercel Pro $20/month + usage; approx. ₹1,900-₹2,200/month at ₹96/USD |
| Database | Loyalty data, QR labels, point ledger | Neon Launch typical spend $15/month; approx. ₹1,400-₹1,800/month |
| OTP/SMS | Login OTP | MSG91 5,000 OTP pack ₹1,250 + 18% GST = approx. ₹1,475 |
| Android build/distribution | Native electrician app | Direct APK/internal testing selected; no Play Store fee assumed for pilot |
| Domain | Client URL | Approx. ₹1,000-₹2,000/year depending on domain |
| Label printer | QR label printing | Recommend TSC TE244; budget ₹8,000-₹12,000 pending quote |
| QR labels/stickers | Physical labels | Recommend 50x25 mm or 50x30 mm thermal-transfer adhesive labels; budget ₹1,000-₹2,500 starter stock |
| Ribbon | Durable QR label print | Budget ₹500-₹1,500 starter stock |
| Monitoring/logging | Production support | Firebase Crashlytics/no-cost tools for Android; server monitoring can start with provider logs |
| WhatsApp/SMS notifications | Optional notifications | Not included; usage-based if client wants messages beyond OTP |
| BUSY integration/customization | Invoice data access | Local server SQL/API assumed; connector effort may be needed |
| Local connector/on-prem bridge | BUSY local server access if cloud backend cannot connect directly | Conditional; cost depends on hosting/network setup |

## Cost Document Rule

Do not send final pricing to client until:

- Vendor quotes are received for printer, labels, ribbon, and any BUSY support.
- Pilot scale assumptions are known.
- MSG91 onboarding/account feasibility is confirmed.
- Hosting model is selected.
- Label printer vendor quote is received.
- BUSY integration method is verified.
