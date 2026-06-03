---
name: Scholarly Organic
colors:
  surface: '#eafef6'
  surface-dim: '#cbded7'
  surface-bright: '#eafef6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e4f8f0'
  surface-container: '#def2ea'
  surface-container-high: '#d9ede5'
  surface-container-highest: '#d3e7df'
  on-surface: '#0e1f1a'
  on-surface-variant: '#3f4944'
  inverse-surface: '#23342f'
  inverse-on-surface: '#e1f5ed'
  outline: '#6f7a74'
  outline-variant: '#bec9c3'
  surface-tint: '#086b53'
  primary: '#005440'
  on-primary: '#ffffff'
  primary-container: '#0f6e56'
  on-primary-container: '#9aedcf'
  inverse-primary: '#84d6b9'
  secondary: '#605e58'
  on-secondary: '#ffffff'
  secondary-container: '#e6e2da'
  on-secondary-container: '#66645e'
  tertiary: '#00543c'
  on-tertiary: '#ffffff'
  tertiary-container: '#006f50'
  on-tertiary-container: '#80f2c3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a0f3d4'
  primary-fixed-dim: '#84d6b9'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#00513e'
  secondary-fixed: '#e6e2da'
  secondary-fixed-dim: '#cac6bf'
  on-secondary-fixed: '#1c1c17'
  on-secondary-fixed-variant: '#484741'
  tertiary-fixed: '#86f8c9'
  tertiary-fixed-dim: '#68dbae'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#eafef6'
  on-background: '#0e1f1a'
  surface-variant: '#d3e7df'
typography:
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.05'
  display-md:
    fontFamily: Bricolage Grotesque
    fontSize: 21px
    fontWeight: '600'
    lineHeight: '1.15'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16.5px
    fontWeight: '400'
    lineHeight: '1.55'
  body-base:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  body-bold:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.04em
  display-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 26px
    fontWeight: '600'
    lineHeight: '1.1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 22px
  xxl: 24px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width-mobile-ui: 430px
  max-width-reading: 576px
  max-width-admin: 980px
---

## Brand & Style

This design system embodies a premium, academic, and humanistic visual language tailored for high-stakes healthcare education. It rejects the clinical coldness of traditional software in favor of a tactile, editorial experience that mimics the comfort of high-end stationery and physical textbooks.

The brand personality is **authoritative, focused, and calming**. It is designed to reduce cognitive load and visual fatigue during long study sessions.

### Design Style: Organic Minimalism
The aesthetic is grounded in a "Paper & Ink" philosophy:
- **Textural Warmth:** Using linen-like backgrounds instead of pure whites to soften the interface.
- **Physical Approachability:** High-radius corners and smooth "pebble" shapes make the mobile-first components feel friendly and ergonomic.
- **Editorial Contrast:** High-contrast, expressive display typography paired with clean, functional body copy to establish a clear intellectual hierarchy.
- **Atmospheric Depth:** Subtle radial gradients in corners provide a sense of "intellectual energy" without distracting from the primary task of reading and analysis.

## Colors

The palette is inspired by natural, earthy tones—moving away from synthetic neons toward a grounded "Pine & Linen" spectrum.

- **Primary (Royal Forest Teal):** Represents focus and health authority. Used for primary actions and active focus states.
- **Secondary (Warm Linen):** The foundational background color. It provides a soft, non-reflective surface that mimics premium paper.
- **Tertiary (Bright Emerald):** Used for ambient glows, pulse animations, and subtle accents to denote "fresh energy."
- **Neutral (Deep Pine Graphite):** A high-contrast charcoal with a green undertone. Used for primary typography to ensure maximum legibility without the harshness of pure black.

### Functional Roles
- **Surface:** Pure White (`#ffffff`) is reserved for the most important interactive cards to make them "pop" against the linen background.
- **Muted/Hint:** Sage tones (`#5d6b65`, `#9aa8a2`) are used for secondary metadata and placeholders.
- **Feedback:** Terracotta Red (`#b23a2e`) for errors and Mustard Gold (`#854f0b`) for warnings maintain the organic, muted warmth of the palette.

## Typography

The typographic system creates a "Dialectic" between tradition and modern utility.

- **Headlines (Bricolage Grotesque):** Expressive and literary. Its deep ink traps and wide proportions provide a distinctive academic identity.
- **Body & UI (Hanken Grotesk):** Modern, geometric-humanist, and highly legible. It is optimized for long-form reading in medical contexts.

### Editorial Standards
- **Reading Passages:** Use `body-lg` for question statements. The 1.55 line height is specifically tuned for academic reading density.
- **Labels:** Meta-information (tags, timestamps) should use `label-sm` with slight letter spacing to maintain clarity at small scales.
- **Headlines:** Keep display styles tight. The ink traps in Bricolage Grotesque perform best with minimal leading.

## Layout & Spacing

The system follows a **Mobile-First, Content-Constrained** philosophy.

### Grid & Containers
- **The Study Feed:** Restricted to a `max-width-mobile-ui` (430px) and centered. This mimics a handheld device experience even on wide monitors, keeping focus tight.
- **Reading View:** Landing pages and long-form articles are constrained to `max-width-reading` (576px) to prevent line lengths from becoming unreadable.
- **Admin Dashboard:** Uses a wider `max-width-admin` (980px) to support multi-column data and sidebars.

### Spacing Rhythm
A 4px incremental scale is used. Gaps between related interactive elements (like MCQ options) use `sm` (8px), while gaps between distinct sections or cards use `lg` (16px) or `xl` (22px). 

### Layout Adaption
- **Mobile:** 16px margins with vertical stacking of all elements.
- **Desktop:** Maintains the "card-in-center" layout for study flows, using the extra width for ambient background gradients and decorative elements rather than stretching the content.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Soft Ambient Shadows** rather than traditional heavy shadows.

- **The Foundation:** The Linen background (`#efebe3`) sits at the lowest level.
- **The Interaction Layer:** Pure White cards sit atop the background with a `1px` border in Pine Hairline (`rgba(20, 43, 38, 0.18)`).
- **Shadow Profile:** Use "Deep Olive" shadows—low-opacity, highly diffused shadows with a dark green tint (`rgba(20, 43, 38, 0.15)`). This feels more natural and integrated into the color palette than neutral gray shadows.
- **Secondary Elevation:** Used for sidebars or sub-cards, utilizing Warm Alabaster (`#f6f4ef`) with no shadow to indicate a nested or auxiliary relationship.

## Shapes

The design system uses a **Rounded** shape language to evoke comfort and approachability.

- **Standard Radius:** 18px (Default) for primary cards and containers.
- **Small Radius:** 12px for buttons and nested interactive items.
- **Large Radius:** 20px for major dashboard shells.
- **Pill (Full):** Used exclusively for status badges and subject tags to distinguish them from functional UI buttons.

Buttons and selection cards should feel like "smooth pebbles"—highly tactile and inviting to touch. Avoid sharp corners entirely to maintain the soft, humanistic academic aesthetic.

## Components

### Buttons
- **Primary:** Solid Forest Teal with white text. High-radius (12px). Includes a physical scale-down animation (`scale-98`) on click.
- **Ghost:** White background with a 1.5px Pine Solid border. Text is Graphite. Used for secondary actions like "Back" or "Skip."

### Interactive Question Cards
The "Unit of Study":
- **Shell:** White surface, 18px radius, Deep Olive shadow.
- **Options:** Vertical list of buttons. Idle state has a subtle hairline border. 
- **Selected State:** Border transitions to Teal, background to Frosted Mint (`#e1f5ee`), and text to Midnight Pine (`#04342c`).

### Feedback Banners
Post-answer indicators that slide or appear within the card:
- **Correct:** Frosted Mint background with a check icon.
- **Incorrect:** Soft Blush Pink (`#fbedeb`) background with an 'X' icon.
- **Commentary Container:** Uses Warm Alabaster secondary surface with an uppercase label in Sage Green to denote editorial "meta" content.

### Badges & Tags
- **Subject Pills:** Small, pill-shaped tags using the Frosted Mint background.
- **Status Indicator:** A "pulsing dot" component (size 9x9px) with an expanding shadow ring to show active states (e.g., a timer or live session).

### Navigation
- **Mobile Bottom Bar:** A sticky 4-column grid with a subtle top border. Icons should be paired with `label-sm` text for maximum clarity.