# FuelEU Maritime Compliance Dashboard — Design Guidelines

## Design Approach

**Selected System**: Carbon Design System  
**Rationale**: Purpose-built for data-heavy enterprise applications requiring clarity, precision, and trust. Ideal for compliance tracking with complex tables, charts, and workflows.

## Core Design Principles

1. **Data Clarity First**: Prioritize readability and scanability of tabular data
2. **Hierarchical Information**: Clear visual hierarchy guides users through complex compliance workflows
3. **Professional Confidence**: Design conveys accuracy, reliability, and regulatory compliance
4. **Efficient Workflows**: Minimize clicks and cognitive load for frequent tasks

---

## Typography System

**Font Family**: IBM Plex Sans (via Google Fonts CDN)

**Hierarchy**:
- **Page Titles**: text-3xl, font-semibold (Routes, Compare, Banking, Pooling)
- **Section Headers**: text-xl, font-semibold (Table sections, KPI groups)
- **Subsection Labels**: text-base, font-medium (Filter labels, Chart titles)
- **Body/Data**: text-sm, font-normal (Table cells, descriptions, form labels)
- **Captions/Metadata**: text-xs, font-normal (Timestamps, helper text)
- **Numerical Data**: text-sm, font-mono (For precise alignment in tables)

---

## Layout System

**Spacing Scale**: Use Tailwind units **2, 4, 6, 8, 12, 16** consistently

**Application Structure**:
- **Container**: max-w-7xl mx-auto px-6 lg:px-8
- **Section Padding**: py-8 between major sections
- **Card Padding**: p-6 for content cards and panels
- **Component Gaps**: gap-4 for form groups, gap-6 for section separators
- **Table Cell Padding**: px-4 py-3

**Tab Navigation**:
- Full-width horizontal tabs at page top
- Active tab indicator (border-b-2 treatment)
- Spacing: px-6 py-3 per tab
- Icon + label combination using Heroicons

---

## Component Library

### Navigation
- **Top Header**: Fixed header with logo, user profile, notification icon
- **Tab Bar**: Horizontal tabs (Routes, Compare, Banking, Pooling) beneath header
- **Breadcrumbs**: Where applicable for deep navigation (text-sm with chevron separators)

### Data Display
- **Tables**: 
  - Striped rows for readability (alternating row treatment)
  - Sticky header on scroll
  - Fixed-width columns for numerical data (right-aligned)
  - Left-aligned text columns
  - Sort indicators in headers (Heroicons: chevron-up/down)
  - Row hover state for interactivity
  
- **KPI Cards**: 
  - Grid layout: grid-cols-1 md:grid-cols-3 gap-6
  - Each card: rounded-lg border with p-6
  - Large numerical value (text-3xl font-bold)
  - Label above (text-sm)
  - Change indicator below (text-xs with up/down arrow icon)

- **Charts**:
  - Use Chart.js via CDN
  - Container: aspect-video or aspect-square with border rounded-lg p-6
  - Bar charts for comparisons (baseline vs actual)
  - Consistent axis labels (text-xs)

### Forms & Controls
- **Filters Panel**: 
  - Horizontal layout on desktop (flex gap-4)
  - Dropdowns for vesselType, fuelType, year
  - "Apply Filters" button (primary action)
  - "Clear" button (secondary/ghost)

- **Input Fields**:
  - Standard height: h-10
  - Border: border rounded-md
  - Focus state with ring treatment
  - Label above field (text-sm font-medium mb-2)
  - Helper text below (text-xs)

- **Buttons**:
  - **Primary**: px-4 py-2 rounded-md font-medium
  - **Secondary**: px-4 py-2 rounded-md font-medium (border variant)
  - **Danger/Warning**: For critical actions (banking, pooling operations)
  - Icons from Heroicons placed before text with mr-2

### Status Indicators
- **Compliance Badge**: Rounded pill (rounded-full px-3 py-1 text-xs font-medium)
  - Compliant: ✅ with supporting text
  - Non-compliant: ❌ with supporting text
- **CB Balance Indicator**: Positive/negative with appropriate visual treatment
- **Pool Validation**: Sum indicator (large, prominent) showing valid/invalid state

### Modals & Overlays
- **Modal Container**: max-w-2xl mx-auto
- **Modal Content**: p-6 with rounded-lg
- **Modal Actions**: Footer with gap-3 flex justify-end
- Backdrop overlay with slight blur

### Banking Tab Specific
- **CB Display**: Large prominent card showing current balance
- **Action Buttons**: Disable when CB ≤ 0 with visual indication
- **Transaction History**: Table with columns: date, action, amount, balance_after

### Pooling Tab Specific
- **Member Selection**: Checkbox list with CB values displayed
- **Pool Preview**: Side panel showing:
  - Member list with before/after CB
  - Total sum calculation (prominent)
  - Validation messages (if rules violated)
- **Create Pool Button**: Disabled state when validation fails

---

## Accessibility

- **Keyboard Navigation**: Full tab-through support for all interactive elements
- **Focus Indicators**: Visible ring on all focusable elements
- **ARIA Labels**: Proper labeling for icons, buttons, and dynamic content
- **Table Headers**: Proper scope attributes
- **Form Labels**: Explicit label/input associations
- **Error States**: Clear error messages with icon indicators
- **Screen Reader Text**: Hidden descriptive text for context (sr-only class)

---

## Icon System

**Library**: Heroicons (via CDN)

**Common Icons**:
- Navigation: bars-3, x-mark, chevron-down
- Actions: plus, pencil, trash, check, x-mark
- Status: check-circle, x-circle, exclamation-triangle
- Data: chart-bar, table-cells, arrow-trending-up
- Filters: funnel, magnifying-glass

**Icon Sizing**: w-5 h-5 for inline, w-6 h-6 for standalone

---

## Responsive Strategy

**Breakpoints** (Tailwind defaults):
- **Mobile** (base): Single column, stacked filters, simplified tables (horizontal scroll)
- **Tablet** (md:): Two-column KPIs, side-by-side filters
- **Desktop** (lg:): Full table display, three-column KPIs, complex layouts

**Table Responsiveness**:
- Mobile: Horizontal scroll container (overflow-x-auto)
- Desktop: Full-width with fixed layout

---

## Animation Guidelines

**Minimal, Purposeful Motion Only**:
- Tab transitions: Simple opacity fade
- Modal entry: Subtle scale + fade (0.3s)
- Button loading states: Spinner icon
- **NO** scroll animations, parallax, or decorative motion
- Focus on instant feedback for user actions

---

This design creates a professional, trustworthy compliance dashboard that prioritizes data clarity and efficient workflows while maintaining visual consistency through Carbon Design System principles.