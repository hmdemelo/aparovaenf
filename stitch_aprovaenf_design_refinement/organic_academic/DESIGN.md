---
name: Organic Academic
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
  tertiary: '#78352b'
  on-tertiary: '#ffffff'
  tertiary-container: '#954c41'
  on-tertiary-container: '#ffd3cc'
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
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a8'
  on-tertiary-fixed: '#3b0804'
  on-tertiary-fixed-variant: '#743329'
  background: '#eafef6'
  on-background: '#0e1f1a'
  surface-variant: '#d3e7df'
  success-soft: '#D1FAE5'
  error-soft: '#FEE2E2'
  success-text: '#065F46'
  error-text: '#991B1B'
  surface-paper: '#F7F5F0'
  graphite-muted: '#4A5D58'
typography:
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
  display-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 28px
    fontWeight: '800'
    lineHeight: '1.1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 20px
  margin-desktop: 40px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 40px
---

## Brand & Style
The design system focuses on a **Tactile & Organic** aesthetic tailored for high-stakes nursing exam preparation. It balances the rigor of medical study with a calming, wellness-oriented interface to reduce student anxiety. 

The visual language moves away from cold, institutional clinical aesthetics in favor of a "premium-study-lounge" feel. This is achieved through wide margins, a sophisticated "Paper & Forest" color story, and soft, physical depth. The style is characterized by "squishy" high-radius components that feel comfortable to touch, emphasizing a mobile-first, thumb-friendly ergonomic flow.

## Colors
The palette is rooted in nature and high-quality stationery. 
- **Primary (Forest Green):** Used for primary actions, active navigation states, and brand-heavy components. It conveys growth and professional authority.
- **Background (Beige):** Replaces harsh whites with a warmer, eye-friendly "paper" tone to support long study sessions.
- **Text (Graphite):** A deep, desaturated green-black that maintains high legibility while feeling softer than pure black.
- **Feedback:** Success and Error states use low-saturation pastel backgrounds with high-contrast text to remain accessible and harmonious with the organic palette.

## Typography
The typography strategy pairings create a distinct "editorial" feel. 
- **Bricolage Grotesque** is used for headlines, question numbers, and brand callouts. Its expressive, slightly quirky character makes the app feel modern and approachable.
- **Hanken Grotesk** handles all functional and long-form body text. Its clean, geometric sans-serif nature ensures maximum legibility during complex medical exam reading.
- **Hierarchy Rule:** Use larger font sizes for question stems (Body LG) to ensure focus, while metadata like "Source: 2023 Exam" uses Label SM.

## Layout & Spacing
This is a **mobile-first fluid layout** that transitions to a centered fixed container on larger screens.
- **Content Density:** High whitespace is prioritized to prevent cognitive overload.
- **Vertical Rhythm:** Elements are stacked using an 8px grid system. Standard vertical spacing between question options is 12px to allow for larger hit targets.
- **Safe Areas:** Mobile layouts must respect a 20px side margin to ensure floating elements like cards do not feel "cramped" against the screen edge.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Ambient Shadows**.
- **The Ground:** The base beige background (#EFEBE3) is the lowest level.
- **Floating Layer:** Primary interaction elements (Question Cards, Bottom Nav) sit on a slightly lighter surface (#F7F5F0).
- **Shadow Signature:** Shadows are soft, diffused, and slightly tinted with the primary green hue to avoid "muddy" greys. Use `0px 10px 30px rgba(15, 110, 86, 0.08)` for a subtle, lifted effect.
- **Interactions:** On press, elements should visually "sink" by reducing shadow spread and scaling slightly (98%), mimicking a physical button press.

## Shapes
The shape language is extremely soft and welcoming. 
- **Base Components:** Standard buttons and inputs use a 16px (rounded-lg) radius.
- **Container Elements:** Question cards and major sections use a 24px (rounded-xl) to 32px (rounded-2xl) radius to emphasize the organic, friendly feel.
- **Floating Nav:** The navigation bar is fully "pill-shaped" (999px) to distinguish it as a detached, floating utility.

## Components
- **Floating Question Cards:** These are the centerpiece. Use a 1px solid border in `#1A2B26` at 5% opacity to define the edge without creating visual noise. Include a subtle shadow to lift it from the beige background.
- **Bottom Navigation Capsule:** A floating pill-shaped bar anchored 16px from the bottom. It should have a background blur effect (glassmorphism) over the beige base, with the active icon highlighted in Forest Green.
- **Badges:** 
    - *Trial:* Outline style with `graphite-muted` text. 
    - *PRO:* Solid `primary-color` background with white text and a tiny sparkle icon to denote premium value.
- **Buttons:** Large, tactile surfaces with a minimum height of 56px for mobile accessibility. Primary buttons use the Forest Green; secondary buttons use a transparent background with a 1.5px Forest Green border.
- **Selection States:** When a question option is selected, the entire card background should transition to a soft tint of the primary color, with the border becoming more pronounced.