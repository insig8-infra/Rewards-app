# Pilot Cost Breakdown: Electrician Loyalty QR Platform

> **Superseded after 2026-06-08 Discovery Call 1.** This estimate was based on the earlier Android-only end-user pilot and web-admin assumptions. It is retained for background only. Regenerate cost breakdown after PRD lock because current scope now includes Android+iOS end-user apps, Android+iOS admin apps, and browser admin web portal.

**Prepared on:** 2026-06-04  
**Pilot scope:** 6 weeks, 5 electricians, 1 product category, BUSY invoice integration, QR label printing, native Android APK/internal test build  
**Currency:** INR unless mentioned otherwise  
**FX assumption:** USD services estimated at **₹96 per USD**. Final card billing may vary.

## 1. Summary

The pilot will prove the complete workflow:

1. Retailer creates an invoice in BUSY.
2. Admin selects the latest BUSY invoice in our admin panel.
3. System generates one secure QR label per invoiced product unit.
4. Staff prints labels on a separate QR label printer and sticks them on products.
5. Registered electricians scan labels in the native Android app and earn points.
6. Admin can review history, totals, and reverse points for returned products.

## 2. One-Time Development Charge

| Item | Cost | Paid To | Notes |
|------|------|---------|-------|
| Pilot application development | **₹1,00,000** | Development team | Covers pilot build for Android electrician app, admin panel, backend, QR logic, BUSY integration workflow, and pilot deployment. Taxes, if applicable, to be confirmed separately. |

## 3. Recommended Pilot Stack

| Layer | Recommended Tool / Service | Why |
|-------|----------------------------|-----|
| Electrician app | Native Android with Kotlin + Jetpack Compose | True Android APK, strong camera control, good fit for bottom navigation, scan flow, history, tier card, and PIN-protected sections. |
| QR scanning | Google ML Kit Barcode Scanning | Proven on-device barcode/QR scanner for Android; supports QR code scanning directly. |
| Admin panel | Next.js web admin | Fast to build admin screens, forms, reports, invoice selection, QR generation, and print pages. |
| Backend/API | Next.js API/server-side backend or Node.js service | Keeps admin and backend delivery simple for pilot. |
| Database | Neon PostgreSQL Launch plan, or equivalent managed PostgreSQL | Stores electricians, QR tokens, point ledger, scans, returns, redemptions, and audit logs. |
| Hosting | Vercel Pro for admin/API, or equivalent | Commercial-ready web hosting with CI/CD and HTTPS. |
| OTP/SMS | MSG91 OTP | India-focused OTP provider with public India OTP pricing. |
| Android distribution | Firebase App Distribution / direct APK sharing | Avoids Play Store delay and account dependency for pilot. |
| Push notifications | Firebase Cloud Messaging | No-cost native push channel for app updates/notifications. |
| QR label printer | TSC TE244 thermal transfer barcode printer | Reliable, cost-effective, India-available desktop barcode printer. Recommendation can be changed after vendor quote/testing. |

## 4. Client-Borne Pilot Costs

These costs are separate from our ₹1,00,000 development charge.

### 4.1 Required / Recommended For Pilot

| Item | Estimated Cost | Type | Notes |
|------|----------------|------|-------|
| TSC TE244 QR label printer | **₹8,000-₹12,000** | One-time | Ahmedabad listing shows approx. ₹7,100 incl. GST, while another India listing shows ₹11,800. Use ₹8k-₹12k as safer budget until vendor quote. |
| Thermal-transfer QR labels | **₹1,000-₹2,500** | Initial consumable | Recommend 50mm x 25mm or 50mm x 30mm adhesive labels. Final cost depends on roll quantity and material. |
| Wax-resin / wax ribbon | **₹500-₹1,500** | Initial consumable | Wax-resin preferred if labels need better handling durability. |
| OTP SMS credits | **₹1,475 approx.** | Prepaid usage | MSG91 5,000 OTP pack: ₹1,250 + 18% GST, as per public pricing. Pilot usage will be much lower, but minimum pack may apply. |
| Domain name | **₹1,000-₹2,000/year** | Annual | Optional if using a branded admin URL. Exact cost depends on `.in`, `.com`, or chosen domain. |
| Hosting for admin/API | **₹1,900-₹2,200/month** | Monthly | Vercel Pro is $20/month + usage. Pilot should fit included limits. |
| Managed PostgreSQL database | **₹1,400-₹1,800/month** | Monthly | Neon Launch typical spend is about $15/month for small intermittent load. Free tier may work for demo, but paid is safer for client pilot. |

### 4.2 Conditional Costs

| Item | Estimated Cost | When Needed |
|------|----------------|-------------|
| Local BUSY connector/on-prem bridge | Usually included in pilot development if simple | Needed if cloud backend cannot directly reach BUSY local server/API. Extra cost may apply if network/security setup is complex. |
| BUSY API/customization/vendor support | Vendor quote required | If BUSY partner charges for SQL/API access, schema support, or integration assistance. Client to bear vendor charges. |
| Static IP/VPN/network setup | Vendor/ISP quote required | Only if direct secure access to BUSY server is needed and outbound sync connector is not sufficient. |
| Extra Android test devices | Client-owned devices preferred | Needed only if pilot electricians do not have compatible Android phones. |
| Reward/redemption payout budget | Client-defined | Points liability, coupons, gifts, UPI payouts, or rewards are business costs and not included in software development. |
| SMS/WhatsApp notifications beyond OTP | Usage-based | Only needed if client wants marketing/transactional notifications outside app push notifications. |

## 5. Estimated Pilot Budget

### 5.1 Client-Borne Operational Setup Cost

| Category | Estimate |
|----------|----------|
| Hardware + initial printing consumables | ₹9,500-₹16,000 |
| OTP initial pack | ₹1,475 approx. |
| Domain | ₹1,000-₹2,000 |
| 2 months hosting + database | ₹6,600-₹8,000 |
| **Estimated client-borne pilot costs, excluding development** | **₹18,500-₹27,500 approx.** |

### 5.2 Total Pilot Budget Including Development

| Category | Estimate |
|----------|----------|
| Development charge | ₹1,00,000 |
| Client-borne pilot costs | ₹18,500-₹27,500 |
| **Estimated total pilot budget** | **₹1,18,500-₹1,27,500 approx.** |

Recommended quote buffer: present this as **₹1.2L-₹1.3L plus any BUSY vendor/customization charges and actual reward payouts**.

## 6. Costs Not Included In The Above Estimate

- BUSY vendor/partner charges, if any.
- Reward payouts, coupons, gifts, or UPI payments to electricians.
- Large-scale production infrastructure after pilot.
- Play Store publication. Pilot uses direct APK/internal testing.
- Multiple product categories beyond Wires.
- Advanced fraud analytics.
- Full automated redemption/payment processing.
- Paid WhatsApp campaign messaging.
- Client staff training beyond basic pilot handover.

## 7. Recommended Procurement Note For Printer

Recommended model: **TSC TE244 desktop thermal transfer barcode label printer**.

This is a recommendation based on market research and can be changed if the client/vendor prefers another equivalent model. The selected printer should meet these requirements:

- Available in Gujarat/India with warranty and service support.
- Supports thermal transfer printing.
- Supports QR/barcode label printing.
- USB connectivity at minimum.
- Can print batch labels reliably.
- Supports 50mm x 25mm or 50mm x 30mm labels.

Before final purchase, print and scan sample labels using the actual printer, label stock, ribbon, and pilot Android phones.

## 8. Pricing Sources Checked

- TSC TE244 India listing: https://shop.tscprintersindia.com/product/tsc-te244-barcode-printer/
- TSC TE244 Ahmedabad/Gujarat listing: https://www.easo.co.in/barcode-label-printer-tsc-te244.html
- MSG91 OTP pricing India: https://msg91.com/in/pricing/otp
- Vercel pricing: https://vercel.com/pricing
- Neon pricing: https://neon.com/pricing
- Firebase pricing / no-cost products: https://firebase.google.com/pricing
- Namecheap domain pricing reference: https://www.namecheap.com/domains.aspx

## 9. Assumptions To Confirm Before Final Quote

- BUSY data is available on a local server through SQL/API access.
- Client can provide BUSY integration key and technical contact.
- Client accepts direct APK/internal testing instead of Play Store for pilot.
- Pilot starts with Wires only.
- QR labels are printed separately from the invoice.
- Staff will select invoice and click "Print QR Labels" in admin app.
- Client will provide 5 electrician mobile numbers for pilot.
- Client will define QR expiry duration, tier thresholds, and redemption rules before build freeze.

---
*This document is a pilot estimate, not a final vendor invoice. Hardware, cloud, SMS, domain, and BUSY vendor charges should be confirmed at purchase/onboarding time.*
