# Electrician Loyalty QR Platform

> **Note:** This one-pager was created before the 2026-06-08 discovery call. It is useful for background only and does not reflect the latest scope of Android+iOS end-user apps, Android+iOS admin apps, and browser admin web portal.

A loyalty app for electrical retailers to reward electricians for recommending and using their products, powered by secure product QR labels and a retailer admin panel.

## The Idea

The retailer sells many electrical products and wants electricians to actively recommend those products to customers. To encourage this behavior, the retailer will reward electricians with loyalty points whenever they scan QR labels attached to eligible products.

The system connects sales, product-level QR labels, electrician scans, points, returns, and redemption data into one controlled loyalty platform.

## Typical Workflow

1. Retailer creates invoice in BUSY accounting software.
2. Staff selects the invoice in the admin panel.
3. System prints one QR label per product unit.
4. Electrician scans QR from the Android app.
5. Points are credited, tracked, and shown in history.

Important: The QR code is not printed inside the BUSY invoice. BUSY prints the invoice normally. QR labels are printed separately on a label printer and stuck on the physical products.

## Electrician App

- Native Android app for the pilot.
- OTP login only for admin-registered mobile numbers.
- Bottom navigation: Home, Scan, History, Redeem.
- Bronze, Silver, and Gold tier display.
- PIN-style protection for redemption and total accumulated points.

## Retailer Admin Panel

- Register electricians and manage access.
- Add SKUs/categories and assign points.
- Select BUSY invoices and print QR labels.
- View electrician data, scan history, and point totals.
- Reverse points when returned material is scanned.

## Pilot Scope

The pilot will run for 6 weeks with 5 electricians and 1 product category: Wires. The Android app will be distributed as a direct APK/internal testing build, and QR labels will be printed using a separate QR label printer.

## Why It Matters

- Encourages electricians to recommend retailer products.
- Creates measurable loyalty and sales-influence data.
- Gives the retailer control over points, returns, and redemptions.
- Starts small, then scales to more categories and electricians.
