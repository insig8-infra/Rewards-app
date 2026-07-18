---
name: Volt Rewards
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#3e494a'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#6f797a'
  outline-variant: '#bec8ca'
  surface-tint: '#006972'
  primary: '#00535b'
  on-primary: '#ffffff'
  primary-container: '#006d77'
  on-primary-container: '#9becf7'
  inverse-primary: '#82d3de'
  secondary: '#8f4e00'
  on-secondary: '#ffffff'
  secondary-container: '#fe9832'
  on-secondary-container: '#683700'
  tertiary: '#713d10'
  on-tertiary: '#ffffff'
  tertiary-container: '#8e5426'
  on-tertiary-container: '#ffd7bd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9ff0fb'
  primary-fixed-dim: '#82d3de'
  on-primary-fixed: '#001f23'
  on-primary-fixed-variant: '#004f56'
  secondary-fixed: '#ffdcc2'
  secondary-fixed-dim: '#ffb77a'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#6d3a00'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#6d390c'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  page-title:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: '0'
  section-header:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-md-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: '0'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: '0'
  metadata:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 16px
  gutter: 12px
  touch-target-min: 48px
  touch-target-standard: 56px
---

## Brand & Style
The brand personality is **utilitarian, reliable, and high-trust**. Designed specifically for Indian electrical contractors and helpers, the visual language avoids decorative flourishes in favor of speed and clarity. 

The design style is **Corporate / Modern**, leaning into a dense, functional "Fintech" aesthetic. It prioritizes information density and legibility, mirroring the efficiency of a digital ledger. The interface is characterized by flat surfaces, thin borders, and clear typographic hierarchy, ensuring it feels professional and "site-ready" for use in varied lighting conditions on a construction or renovation site.

## Colors
The palette is rooted in a **Deep Teal** primary color to project stability and professionalism, paired with a **Saffron** accent for secondary actions and highlights, reflecting a familiar local industrial palette. 

- **Primary Teal:** Used for core navigation, primary buttons, and brand headers.
- **Accent Saffron:** Used sparingly for "Earn" or "Redeem" actions to draw the eye without overwhelming.
- **Tiers:** Specific accents for Bronze, Silver, and Gold are used as small badges or border-tops on cards to denote contractor status.
- **Backgrounds:** A tiered system of whites and off-whites helps separate dense content blocks without requiring heavy shadows.

## Typography
The system uses **Inter** for its exceptional legibility at small sizes and high information density. 

- **Hierarchy:** Page titles are prominent to provide immediate context upon app launch. 
- **Ledger Style:** Body text at 14px is the workhorse size for lists and transaction history. 
- **Readability:** High contrast (Charcoal on White) is maintained at all times. All letter spacing is set to 0 or slightly tight for labels to keep the UI compact.
- **Bilingual Support:** The system assumes a 1:1 scaling for Hindi script, ensuring line heights are generous enough to prevent character clipping.

## Layout & Spacing
The system uses a **mobile-first 390px baseline** with a strict **8px spacing rhythm**. 

- **Margins:** A standard 16px horizontal safe area is maintained for all screens.
- **Density:** To mimic financial apps, vertical spacing between list items is kept to 8px or 12px, allowing more data to be visible above the fold.
- **Touch Targets:** Despite the visual density, all interactive elements (buttons, inputs, navigation items) maintain a minimum height of 48px to accommodate use in outdoor or busy environments.

## Elevation & Depth
Depth is communicated through **Tonal Layers** rather than shadows. 

- **Surface Level 0:** Light Gray (#f1f5f9) background for the app body.
- **Surface Level 1:** White (#ffffff) cards and containers.
- **Borders:** 1px solid borders (#e2e8f0) are preferred over shadows to define card boundaries. 
- **Active State:** A very soft, low-blur shadow (4px blur, 5% opacity) may be used only for the primary "Scan" floating action or active bottom navigation to indicate it sits above the content.

## Shapes
The system uses a **Soft** shape language. 

- **Standard Radius:** 8px for cards, primary buttons, and input fields.
- **Small Radius:** 4px for tags, badges, and the language toggle.
- **Strictness:** Avoid "pill" shapes for buttons to maintain a more structured, professional tool-like appearance.

## Components

- **Navigation:** 
  - **Bottom Bar:** 4 fixed icons (Home, Scan, History, Rewards). The "Scan" icon uses the Primary Teal as a filled circle background.
  - **Language Toggle:** A compact segmented control (EN | हिंदी) placed in the top-right or profile section.

- **Buttons:** 
  - **Primary:** Deep Teal background, White text.
  - **Secondary:** Saffron background, Charcoal text (for high-urgency reward actions).
  - **Outline:** 1px Teal border, Teal text for secondary navigation.

- **Cards (Ledger Style):** 
  - White background with a 1px #e2e8f0 border. 
  - Left side: Icon/Logo; Center: Transaction Name/Date; Right side: Points (+/-) in Teal or Red.

- **Inputs:** 
  - **Mobile Input:** Prefix "+91" in a grayed-out sub-section within the 48px input field.
  - **MPIN:** 4 discrete square boxes (48x48px) with centered bold numbers.

- **Header:** 
  - Top-aligned "Contractor Identity" block. Includes a small circular avatar and the Tier badge (e.g., "Gold Member") next to the name.

- **Banners:** 
  - Rectangular blocks with a subtle background tint of Primary Teal (10% opacity) and a sharp 8px radius for announcements.