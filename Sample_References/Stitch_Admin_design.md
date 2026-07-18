---
name: Volt Admin
colors:
  surface: '#f7fafa'
  surface-dim: '#d7dadb'
  surface-bright: '#f7fafa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f4'
  surface-container: '#ebeeef'
  surface-container-high: '#e6e9e9'
  surface-container-highest: '#e0e3e3'
  on-surface: '#181c1d'
  on-surface-variant: '#3e494a'
  inverse-surface: '#2d3132'
  inverse-on-surface: '#eef1f2'
  outline: '#6f797a'
  outline-variant: '#bec8ca'
  surface-tint: '#006972'
  primary: '#00535b'
  on-primary: '#ffffff'
  primary-container: '#006d77'
  on-primary-container: '#9becf7'
  inverse-primary: '#82d3de'
  secondary: '#8e4e14'
  on-secondary: '#ffffff'
  secondary-container: '#ffab69'
  on-secondary-container: '#783d01'
  tertiary: '#2f4f5c'
  on-tertiary: '#ffffff'
  tertiary-container: '#476775'
  on-tertiary-container: '#c3e4f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9ff0fb'
  primary-fixed-dim: '#82d3de'
  on-primary-fixed: '#001f23'
  on-primary-fixed-variant: '#004f56'
  secondary-fixed: '#ffdcc4'
  secondary-fixed-dim: '#ffb780'
  on-secondary-fixed: '#2f1400'
  on-secondary-fixed-variant: '#6f3800'
  tertiary-fixed: '#c6e8f8'
  tertiary-fixed-dim: '#abcbdb'
  on-tertiary-fixed: '#001f29'
  on-tertiary-fixed-variant: '#2b4b58'
  background: '#f7fafa'
  on-background: '#181c1d'
  surface-variant: '#e0e3e3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.5px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.5px
  hindi-body:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 16px
  element-gap: 12px
  touch-target-min: 48px
  touch-target-standard: 56px
  list-item-height: 64px
---

## Brand & Style

The design system is engineered for the high-utility environment of Indian electrical retail management. It prioritizes **trust, density, and immediate legibility**. The brand personality is professional yet accessible, bridging the gap between traditional bookkeeping and modern fintech.

The visual style follows a **Corporate Modern** approach with subtle hints of **Soft Minimalism**. It draws inspiration from leading Indian payment interfaces like PhonePe and Google Pay, utilizing high-contrast status indicators and a structured information hierarchy to manage complex inventory and transaction data on mobile screens. The emotional response is one of reliability and control, ensuring users feel confident managing their livelihoods through the interface.

## Colors

This design system utilizes a palette that balances professional authority with functional clarity. 

- **Primary (Deep Teal):** Used for key actions, active states, and primary navigation to establish a sense of security.
- **Accent (Saffron):** Reserved for highlights, secondary call-to-actions, and attention-grabbing data points without signaling "error" or "success."
- **Status (Emerald & Crimson):** Strictly applied to financial outcomes, inventory status, and system feedback.
- **Neutral (Charcoal):** Applied to typography to ensure maximum contrast against light surfaces.

Surface colors use a very subtle cool-tinted white (`#F8FAFA`) to reduce eye strain during long periods of administrative use, while pure white (`#FFFFFF`) is reserved for interactive cards and elevated containers.

## Typography

The typography system is built on **Inter**, chosen for its exceptional legibility and tall x-height, which is critical for reading product SKUs and price points on mobile displays.

### Language Considerations
For dual-language support (English/Hindi), the design system implements a **0.5pt to 1pt size increase** for Hindi script to maintain equivalent legibility at small sizes. Line heights are slightly more generous (approx 1.5x) for Hindi text to prevent "Matra" (vowel markers) from overlapping with adjacent lines.

### Hierarchy
- **Primary Data:** Use `headline-md` for current balances and order counts.
- **Secondary Data:** Use `body-sm` for timestamps, SKU numbers, and metadata.
- **Micro-copy:** Use `label-caps` for status badges and table headers.

## Layout & Spacing

The layout is built on a **390px baseline** with a strict **8px rhythm**. This ensures a "dense but breathable" feel suitable for data-heavy administrative tasks.

- **Grid:** Use a 4-column fluid grid for mobile with 16px side margins and 12px gutters.
- **Touch Targets:** All interactive elements (buttons, checkboxes, list chevron) must maintain a minimum hit area of 48x48px, even if the visual asset is smaller.
- **Density:** In lists, vertical padding is minimized to 12px to maximize the number of visible rows on screen, facilitating quick scanning of inventory.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to maintain a clean, professional aesthetic.

1.  **Level 0 (Base):** Background color `#F8FAFA`.
2.  **Level 1 (Cards/Containers):** Pure white `#FFFFFF` with a 1px border of `#E2E8F0`. No shadow.
3.  **Level 2 (Active/Floating):** Pure white `#FFFFFF` with a very soft, diffused shadow (Blur 12px, Y-2, 5% Opacity of Primary Color). Used for bottom navigation and floating action buttons.

Depth is primarily communicated through color-blocking (e.g., a teal header against a grey background) rather than physical layering.

## Shapes

The shape language is **Rounded**, utilizing a consistent 8px (0.5rem) radius for most UI components. This softens the "industrial" nature of electrical retail and aligns with modern fintech patterns.

- **Standard Elements (Inputs, Cards, Buttons):** 8px radius.
- **Badges/Chips:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.
- **Bottom Sheets:** 16px top-only radius to indicate they are temporary overlays.

## Components

### Buttons
- **Primary:** Solid Deep Teal with White text. Height: 48px. 8px radius.
- **Secondary:** Outlined Deep Teal. 
- **Tertiary:** Text-only for less critical actions like "Cancel" or "View Details."

### Dense List Rows
List items are 64px tall. They must include a clear title, a sub-label (e.g., SKU or Category), and a trailing element (Price or Status Badge). Use a 1px separator line between rows.

### Status Badges
Small, high-contrast pills. 
- *Success:* Emerald Green background (10% opacity) with Emerald Green text.
- *Error/Alert:* Crimson Red background (10% opacity) with Crimson Red text.

### Input Fields
Outlined style. Label sits above the field in `label-caps`. The border color changes to Primary Teal on focus. For numeric inputs (Quantity/Price), provide large "+" and "-" stepper buttons to accommodate retail environments where users might be on the move.

### Bottom Navigation
Fixed 56px height. Icons use a 2pt stroke weight. Active state uses the Primary Teal for both icon and label, while inactive states use a medium grey.