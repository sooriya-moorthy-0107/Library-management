---
name: Enterprise Library Management System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#444651'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#4b1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e2c00'
  on-tertiary-container: '#f39461'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#773205'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  surface-primary: '#FFFFFF'
  surface-secondary: '#F1F5F9'
  border-subtle: '#E2E8F0'
  text-main: '#0F172A'
  text-muted: '#475569'
  status-success: '#10B981'
  status-warning: '#F59E0B'
  status-error: '#EF4444'
  accent-info: '#3B82F6'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '450'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base-unit: 4px
  container-max-width: 1440px
  grid-columns: '12'
  gutter: 16px
  margin-desktop: 32px
  margin-tablet: 24px
  margin-mobile: 16px
---

## Brand & Style
The design system is engineered for a high-stakes academic and administrative environment. It prioritizes **Institutional Trust**, **Operational Efficiency**, and **Information Density**. The brand personality is authoritative yet accessible, functioning as a silent partner to librarians and administrators handling vast datasets.

The visual style follows a **Modern Corporate** aesthetic. It utilizes a structured grid, purposeful whitespace, and a refined color theory to minimize cognitive load during long working sessions. By balancing high-density data displays with a clean, airy interface, the design system ensures that critical information—such as procurement statuses, audit logs, and circulation metrics—is instantly scannable and actionable.

## Colors
The palette is anchored by **Deep Navy (#1E3A8A)** to evoke stability and institutional authority. This is complemented by a sophisticated range of **Slate Grays** that define the structural hierarchy without competing for the user's attention.

- **Primary:** Reserved for primary actions, active navigation states, and key branding moments.
- **Secondary:** Used for supporting icons, secondary buttons, and metadata labels.
- **Surface & Neutrals:** A "Crisp White" base is layered with subtle gray tints to differentiate between navigation rails, header sections, and content cards.
- **Status Tints:** Semantic colors (Success, Warning, Error) are used with high intentionality in data tables to signal book availability, overdue fines, or system alerts.

## Typography
Typography in this design system is optimized for **legibility at scale**. We utilize **Hanken Grotesk** for headlines to provide a sharp, contemporary professional feel, while **Inter** serves as the workhorse for body text and interface elements due to its exceptional performance in high-density UI.

- **Data-Heavy Contexts:** For ISBNs, QR codes, and tracking IDs, a monospaced font (JetBrains Mono) is introduced to ensure character distinction.
- **Hierarchical Scale:** We use a tight scale where `body-md` (14px) is the standard for most interface text, allowing for more data rows per screen.
- **Mobile Adjustments:** Headlines scale down by 15-20% on mobile devices to prevent excessive line wrapping in narrow viewports.

## Layout & Spacing
The design system employs a **Fluid Grid** with a 12-column structure, optimized for desktop-first enterprise workflows. 

- **Density:** We utilize a 4px base-unit spacing system. In management tables and dashboards, padding is condensed to "Compact" (8px) to maximize the "above-the-fold" visibility of records.
- **Structure:** A persistent side navigation (240px) provides quick access to core modules like Procurement, Audit Logs, and User Management. 
- **Responsive Behavior:** On tablet, the sidebar collapses into an icon-only rail or a hamburger menu. Content cards reflow from multi-column to single-column stacks on mobile devices.

## Elevation & Depth
To maintain a professional, flat aesthetic that emphasizes content over decoration, the design system uses **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** The primary application canvas uses `#F8FAFC`.
- **Level 1 (Cards/Containers):** Surfaces like data tables or form groups use `#FFFFFF` with a 1px border of `#E2E8F0`.
- **Level 2 (Popovers/Modals):** These elements use a subtle, highly diffused ambient shadow (10% opacity, 12px blur) to indicate they are floating above the main interface.
- **Interaction:** Hover states are indicated by a subtle shift in background color (e.g., from White to Slate-50) rather than a change in elevation.

## Shapes
The shape language is **Soft and Precise**. A 4px (0.25rem) radius is the standard for almost all components—buttons, input fields, and cards. This slight rounding takes the edge off the "brutalist" enterprise look while maintaining a rigid, efficient grid.

- **Standard (4px):** Used for buttons, text fields, and list items.
- **Large (8px):** Used for main content cards and modal containers.
- **Full (Pill):** Reserved exclusively for status badges (e.g., "Available", "Overdue") to distinguish them from actionable buttons.

## Components
Consistent component patterns ensure the system remains intuitive across its diverse feature set.

- **Data Tables:** The core of the system. Features include sticky headers, zebra-striping on hover, and inline actions. Columns for "Status" use pill-shaped chips with semantic background tints.
- **Buttons:**
  - *Primary:* Solid Deep Blue with white text.
  - *Secondary:* Ghost style with Slate Gray borders.
  - *Actionable Icons:* Used within table rows for "Edit" or "View Receipt" to save space.
- **Input Fields:** Standardized with clear label-top alignment. Focused states use a 2px Deep Blue ring. Error states include a red icon and helper text.
- **Dashboards:** Use "Metric Cards" with large Hanken Grotesk display numbers and small Sparkline charts to show trends in book circulation or fine collection.
- **Search & Filters:** A persistent filter bar above tables allows for multi-parameter filtering (by Department, Role, or Date Range), essential for the Super Admin and Librarian roles.
- **Feedback:** Toast notifications for "PDF Receipt Generated" or "Fine Paid" appear in the top-right corner, staying out of the way of the main workflow.