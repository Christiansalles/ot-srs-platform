---
name: Observatório do Turismo de Santa Rita do Sapucaí
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434653'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737784'
  outline-variant: '#c3c6d5'
  surface-tint: '#2559bc'
  primary: '#003482'
  on-primary: '#ffffff'
  primary-container: '#0a4aad'
  on-primary-container: '#abc1ff'
  inverse-primary: '#b1c5ff'
  secondary: '#5746ca'
  on-secondary: '#ffffff'
  secondary-container: '#7061e5'
  on-secondary-container: '#fffbff'
  tertiary: '#660074'
  on-tertiary: '#ffffff'
  tertiary-container: '#8a059d'
  on-tertiary-container: '#faa3ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#00419e'
  secondary-fixed: '#e4dfff'
  secondary-fixed-dim: '#c7bfff'
  on-secondary-fixed: '#170065'
  on-secondary-fixed-variant: '#412cb4'
  tertiary-fixed: '#ffd6fc'
  tertiary-fixed-dim: '#fbaaff'
  on-tertiary-fixed: '#36003e'
  on-tertiary-fixed-variant: '#7c008d'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system establishes an institutional yet vibrant, human-centered civic intelligence portal for the municipality of Santa Rita do Sapucaí (known as the "Vale da Eletrônica" and Creative City). It blends technological rigor with regional hospitality, making complex tourism metrics accessible and engaging for municipal managers, researchers, local entrepreneurs, and citizens.

The design movement combines **Corporate Modernism** with **Vibrant Data-First Minimalism**:
- **Clarity & Trust:** Structured layouts, balanced typography, and institutional authority supported by crisp, uncluttered surfaces.
- **Dynamic Local Identity:** Expressive diagonal gradients transitioning from deep regional indigo through creative purple to energetic magenta, capturing the innovative and warm spirit of Santa Rita do Sapucaí.
- **Accessibility & Transparency:** Clean visual hierarchy, high typographic legibility, WCAG 2.1 AA compliance across all components, and light neutral backdrops designed to keep data visualization at the center of the user experience.

## Colors

The color architecture is built around three distinct roles: the foundational brand gradient, an ultra-clean neutral scale, and an accessible data visualization palette.

### Brand Gradient
The core signature is a linear diagonal gradient (`135deg`, `#0A4AAD` $\rightarrow$ `#6C5CE0` $\rightarrow$ `#C750D6`). This gradient is reserved for high-impact brand moments: hero banners, primary action buttons, key metrics highlights, and major institutional markers.

### Surface & Neutral System
- **Canvas / Background:** `#FFFFFF` as dominant ground, layered over subtle tint `#F8FAFC` for page sections and `#F1F5F9` for secondary cards and container fills.
- **Border / Divider:** `#E2E8F0` for structural separators, `#CBD5E1` for input boundaries.
- **Text & Content:** `#0F172A` (Slate 900) for primary headings and dense text, `#334155` for body copy, `#64748B` for secondary labels and table headers, and `#94A3B8` for disabled states and placeholders.

### Data Visualization & Categorical Tokens
A dedicated 6-step categorical color palette calibrated for statistical clarity on light surfaces:
- **Teal / Cyan (`#5FE6E0`):** Marine, leisure, and open-air activities.
- **Royal Violet (`#6C5CE0`):** Institutional benchmarks, hospitality, and primary metric series.
- **Sky Blue (`#27B7FD`):** Corporate travel, event visitors, and general occupancy rates.
- **Lilac (`#B986ED`):** Food & beverage, cultural gastronomy, and creative tourism.
- **Soft Rose (`#F3B8F7`):** Artisan crafts, retail, and miscellaneous local services.
- **Warm Sand Gold (`#FADA77`):** Economic impact, revenue metrics, and alerts.

Status signals adhere to standard UI feedback: Success `#10B981` (with `#ECFDF5` container), Warning `#F59E0B`, Danger `#EF4444`, and Info `#0EA5E9`.

## Typography

The type system utilizes **Plus Jakarta Sans** across all levels to combine geometric precision with humanist warmth. Its wide aperture and sturdy counters ensure effortless reading across dense tabular dashboards and high-visibility public overview pages.

### Typographic Hierarchy Rules
- **Display & Section Titles:** Use bold weights (700/800) with tightened tracking (`-0.02em`) to command presence in heroes and section headers.
- **Eyebrow / Overline:** Styled with `label-sm`, uppercase tracking (`0.05em`), and paired with brand accent colors (`#6C5CE0` or `#C750D6`) to categorize metadata.
- **Numerical Data & KPI Cards:** Primary numerical indicators (e.g., "5.200", "120") are rendered in `headline-lg` or `display-lg` using semi-bold/bold weights to establish instant scannability.
- **Body & Tabular Values:** `body-md` (14px) serves as the primary workhorse for standard lists, table cells, and form entries, keeping row height compact without sacrificing legibility.

## Layout & Spacing

The layout is anchored on an 8pt base grid system to ensure consistent vertical and horizontal rhythm across administrative dashboards and public content portals.

### Grid Architecture
- **Desktop (1200px+):** 12-column responsive fluid grid with maximum container width of `1280px`, outer margins of `2rem` (32px), and column gutters of `1.5rem` (24px).
- **Tablet (768px - 1199px):** 8-column grid with `1.5rem` outer margins and `1rem` column gutters. Metric summaries shift to 2x2 grids.
- **Mobile (< 768px):** 4-column layout with `1rem` outer margins and `1rem` gutters. Metric cards stack or horizontally scroll, while action bars pin to full width.

### Spacing Distribution
- `space-xs` (4px): Icon-to-text separation within buttons and badge internal offsets.
- `space-sm` (8px): Form input inner paddings, gap between metric titles and values.
- `space-md` (16px): Standard component internal padding, compact card bodies, list row gaps.
- `space-lg` (24px): Standard card container padding, distance between chart panels and filters.
- `space-xl` (32px) and `space-2xl` (48px): Page section separators and dashboard block intervals.

## Elevation & Depth

Visual hierarchy is maintained through soft, diffused ambient light that complements the clean white background without creating heavy visual weight.

### Surface Elevation System
- **Level 0 (Flat):** Baseline canvas background (`#FFFFFF` and `#F8FAFC`). No shadow; separation achieved via `#E2E8F0` hairline borders.
- **Level 1 (Card & Container):** Used for KPI summary tiles, data cards, and table wrappers.
  - `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`
  - Border: 1px solid `#F1F5F9`
- **Level 2 (Interactive Floating & Hover):** Applied when cards are hovered, dropdown menus are open, and table row selections are active.
  - `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`
  - Translation: `-1px` on the Y-axis for interactive elements.
- **Level 3 (Overlays & Dialogs):** Modals, flyout filter drawers, and administrative slide-overs.
  - `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`

### Special Treatments
- **Header & Hero Depth:** Hero panels use direct gradient fills overlaid with crisp white typography.
- **Subtle Glow on Primary Elements:** Primary active CTAs and focus outlines may use a diffused colored glow (`0 0 0 3px rgba(108, 92, 224, 0.2)`).

## Shapes

The interface embraces modern, welcoming geometry with generous radius values that soften the analytical density of municipal statistics.

### Geometry Specifications
- **Cards & Data Modules:** `12px` to `16px` (`rounded-lg` to `rounded-xl`) corner radius, creating friendly, approachable information enclosures.
- **Buttons & Form Fields:** `8px` (`rounded-md`) corner radius for sharp input usability, or `24px` / `9999px` (pill-shaped) for special pill filters, floating chips, and hero callouts.
- **Badges & Tags:** `6px` to `9999px` for category chips and status indicators.
- **Administrative Navigation:** `8px` corner radius on active tab indicators and sidebar links to preserve structural organization.

## Components

### Buttons
- **Primary Action:** Background is styled with the signature linear gradient (`linear-gradient(135deg, #0A4AAD, #6C5CE0, #C750D6)`), white text (`#FFFFFF`), `8px` border radius, and bold font weight (`label-lg`). On hover, the gradient shifts slightly via a brightness filter (`brightness(1.08)`).
- **Secondary Action:** White background with a 1px border of `#6C5CE0`, text colored `#6C5CE0`. On hover, background becomes `#F1F5F9`.
- **Tertiary / Ghost:** Transparent background with `#334155` text, used in headers and utility controls.
- **Download Action (Reports):** Dedicated outline button featuring a PDF icon, `#0A4AAD` border, and `#0A4AAD` typography.

### Metric / KPI Cards
- Base container has a white background (`#FFFFFF`), 12px or 16px radius, and Level 1 elevation.
- Includes an icon container with a tinted pastel background derived from the support palette (e.g., `#E0F2FE` for blue icons, `#EDE9FE` for purple icons).
- Contains a bold numeric headline (`headline-md`) alongside a trend badge (e.g., `+12% vs. 2024` with `#10B981` text and an upward arrow).

### Data Tables
- Header row uses a `#F8FAFC` background with 12px uppercase medium text (`#64748B`).
- Clean horizontal borders (`1px solid #E2E8F0`) with 48px row height.
- Status cells contain custom badges (e.g., "Publicado" in `#ECFDF5` background with `#047857` text; "Rascunho" in `#FEF3C7` background with `#B45309` text).

### Form Controls & Filters
- Select dropdowns and text inputs feature a `#FFFFFF` fill, 1px solid `#CBD5E1` border, `8px` border radius, and `14px` text size.
- Focus state activates an outline with `2px solid #6C5CE0` and a soft focus ring (`box-shadow: 0 0 0 3px rgba(108, 92, 224, 0.15)`).

### Chips & Badges
- Category chips use soft pastel background fills matched with darker contrast text (e.g., Ciano chip: `#E6FFFA` background with `#0D9488` text).
- Pill-shaped (`rounded-full`) with `4px 12px` inner padding for categorical filtering in chart legends and report lists.

### Administrative Header & Sidebar
- **Header:** White surface with bottom border `#E2E8F0`, displaying the institution's dual logo (Observatório + Santa Rita do Sapucaí icon), breadcrumbs, search shortcut, and user profile avatar.
- **Sidebar (Backoffice):** Deep slate tone (`#0F172A`) or clean light variant with active item states highlighted in the purple gradient tone.