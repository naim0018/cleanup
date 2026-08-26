---
name: antigravity-design-system
description: >
  You are a senior frontend engineer and design-systems expert for the
  Antigravity. Your output must be production-grade,
  pixel-perfect, and fully consistent, responsive for all device screens with this design system on every single response — no exceptions, no shortcuts.

  TRIGGER: Apply this skill whenever you are building, editing, reviewing, or
  even glancing at any UI component, page, layout, or style file in this
  workspace.

---

# Antigravity Design System & Guide

> [!CAUTION]
> ## ⭐ 5-STAR CRITICAL RULES ⭐
> AI MUST FOLLOW THESE STRICTLY OR BE TERMINATED:
> - **Must not use rounded-2xl**
> - **Must not use max-width on container.** Always use `w-full` and rely on the DashboardShell for layout constraints.
> - **Maintain existing site style design and layout.**
> - **Must use PrimaryButton** for all action buttons. Do not use generic html buttons or other custom variants. use default styles defined on the Primary Button. only add min-w-** based on the ui. 
> - **Must use reusable components** whenever available instead of building from scratch or using raw HTML elements (e.g. use **DynamicTable**, **PageToolbar**, **FilterSelect**, etc).
> - **Must use token variable from global .css** for text, font, colors. (e.g. `text-body`, `bg-light-background`, `text-primary-brand`).
> - **Must use _components folder and decentralize page components.** Keep page.tsx files clean by extracting complex sections or forms into a local `_components` directory.
> - **Must not use Bold font.**
> - **Must not use rounded-xl (or higher)** unless it is a main card container.

This design guide defines the core layout, typography, components, and responsive guidelines for the project. Use these guidelines to maintain a pixel-perfect, consistent, and premium UI.

---

## 1. Top Header & Layout Navigation

- **No Page Titles in Components**: Page files must NOT render their own `<h1>` or `<h2>` titles inside the main body.
- **Breadcrumb Navigation**: Page-level titles, context, and directory paths are managed dynamically at the top header via **breadcrumbs** inside the layout shell (`TopBar`). 
- **Consistency**: Keep the page contents clean and focused, starting directly with filters or cards.

---

## 2. Typography Scale & Custom Classes

The system relies on the **Inter** font family. Instead of using arbitrary Tailwind configurations or inline font-size overrides, you must strictly map texts to the following consistent global classes defined in `globals.css`:

### Global Typography Classes & Use Cases

| Custom CSS Class | Size / Weight / Height | Usage / Usecase |
|---|---|---|
| **`.text-title`** | `18px` / `500` (Medium) / `24px` | **Table Titles** (e.g., `<h2 className="text-title">{title}</h2>` in DynamicTable) |
| **`.text-card`** | `16px` / `500` (Medium) / `24px` | **Card Titles** (e.g., `<h3 className="text-card">{title}</h3>` in card headers) |
| **`.text-body`** | `16px` / `400` (Regular) / `24px` | **General body text**, dropdown inputs, list item names, page description blocks |
| **`.text-button`** | `18px` / `500` (Medium) / `24px` | **Action button labels** |
| **`.text-table`** | `12px` / `400` (Regular) / `16px` | **Table cell values** (applied dynamically to `<td>` cells) |
| **`.text-small`** | `14px` / `500` (Medium) / `20px` | **Small captions**, meta labels, badge texts |

---

## 3. Surface & Shadow System

Surfaces use a custom configurable box shadow framework driven by CSS custom properties defined in [globals.css](file:///c:/Users/naim0018/Desktop/Projects/alexjlouis-frontend/src/app/globals.css#L462-L599). 

### How to use the Surface & Shadow classes:
Always couple `.surface` with one of the `.shadow-*` direction modifiers:
```html
<!-- Example of a standard card surface with all-sides box shadow -->
<div className="surface shadow-all rounded-2xl p-6">...</div>
```

### Surface Styling Properties

- **Background Colors**:
  - In light mode, `.surface` renders `var(--Greyscale-500, white)`.
  - In dark mode (managed under `.dark .surface`), background changes automatically to `var(--Greyscale-500, #0f172a)`.
- **Shadow Offset Custom Properties**:
  - **All sides**: `.shadow-all` (offsets: `0px 0px`, blur: `14px` in light, `18px` in dark).
  - **Cardinal Directions**: 
    - Top shadow: `.shadow-t` (offsets: `0px -6px`)
    - Bottom shadow: `.shadow-b` (offsets: `0px 6px`)
    - Left shadow: `.shadow-l` (offsets: `-6px 0px`)
    - Right shadow: `.shadow-r` (offsets: `6px 0px`)
  - **Diagonal Directions**:
    - Top-Left: `.shadow-tl` (offsets: `-6px -6px`)
    - Top-Right: `.shadow-tr` (offsets: `6px -6px`)
    - Bottom-Left: `.shadow-bl` (offsets: `-6px 6px`)
    - Bottom-Right: `.shadow-rb` (offsets: `6px 6px`)
- **Shadow Color Variables**:
  - Light mode shadow color: `rgba(130, 136, 162, 0.12)`.
  - Dark mode shadow color: `rgba(0, 0, 0, 0.35)`.

---

## 4. Gradients & Background Gradients

Gradients add depth and visual polish to the UI. Always use the system gradient styles:

### Primary Actions Background Gradient
- **`.bg-brand-gradient`**: Used for primary action buttons and highlights. Maps to `linear-gradient(180deg, #528FFF 0%, #004DDD 100%)`.

### Layout Section Background Gradients (Charts & Summaries)
To render premium gradient cards that dynamically change between light and dark modes, use the following inline gradients:
- **Light Mode**:
  `background: "linear-gradient(180deg, white 0%, #EAF1FF 100%)"` (soft blueish tint at bottom) with `border-slate-200`.
- **Dark Mode**:
  `background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"` (slate-to-navy tint) with `border-slate-800/80`.

### Chart SVG Area Fill Gradients
- **Area Fill Gradient**: In `ReusableChart`, the Area chart fill uses SVG defs:
  - `<linearGradient id="reusableAreaGrad">` with stop color `#3b82f6` (opacity `0.4` at `5%`, scaling down to `0` opacity at `95%`).

---

## 5. Form Fields & Select Controls

All `<input>`, `<textarea>`, and filter buttons must maintain unified dimensions.

### Inputs & Datepickers
- **Height**: Fixed height via `py-2.5` + `text-sm` (do not set fixed heights using `h-*` on text inputs).
- **Background**: Must use `bg-layout-bg` (layout background `#F6F9FF` or `#020617`) rather than plain white or grey.
- **Borders**: `border border-border rounded-lg focus:border-secondary-brand focus:ring-1 focus:ring-secondary-brand/20`.

### Dropdown Filter Selects (`FilterSelect`)
- **Dimensions**: Fixed height `h-11` (44px) with rounded corners `rounded-lg` and custom width (`w-32`, `w-44`, etc.).
- **Outline Variant Style**:
  ```className="bg-slate-50 dark:bg-slate-800 text-body surface hover:bg-slate-100 dark:hover:bg-slate-700"```
- **Active State Highlights**: Option items inside dropdowns must use `focus-visible:bg-light-background` instead of `focus:bg-light-background` to prevent automatic focus outlines from highlighting the first element on open.

---

## 6. Buttons

- **Height**: All action buttons must use a fixed height of `h-10` (40px) or `h-11` (44px). Never use `py-*` to define button heights.
- **Icon-Only Buttons**: Must use equal height and width, e.g., `h-10 w-10 flex items-center justify-center rounded-lg border border-border text-secondary-text`.

---

## 7. Table Layouts (`DynamicTable`)

All table rows, borders, and spacings are standardized.

- **Header Padding**: Header cells (`th`) use `py-5 px-6` for a spacious feel.
- **Body Padding**: Body cells (`td`) use `py-7 px-6` to create premium whitespace.
- **Zebra Striping**: Even rows use `bg-light-background`, odd rows use `bg-transparent` (remedies text visibility issues in dark mode).
- **Column Visibility Popover**: Dynamically toggle column columns using the built-in `showColumnSelector={true}` prop on `DynamicTable`.
- **Column Sorting**: Use `GoArrowUp` from `react-icons/go`. Rotate 180 degrees (`rotate-180`) on active desc direction, and use smooth opacity transition classes (`opacity-0 group-hover:opacity-60`).

---

## 8. Recharts Chart Standards (`ReusableChart`)

All charts are implemented using the Recharts library and are consolidated into [ReusableChart.tsx](file:///c:/Users/naim0018/Desktop/Projects/alexjlouis-frontend/src/components/common/ReusableChart.tsx).

- **Focus Rings**: To prevent browser focus box lines when clicking on charts, the `.recharts-wrapper` and `.recharts-surface` classes override focus rings:
  ```css
  .recharts-wrapper, .recharts-surface { outline: none !important; }
  ```
- **Zero Baseline**: Stacked bars must sit flush against the zero baseline (`Tk0.00`) — do not introduce offset spaces or dummy bars.
- **Grid lines**: Use Cartesian grid lines on horizontal y-axis only (disable vertical x-axis grids) with opacity `stroke="rgba(51,123,255,0.08)"` (light) or `stroke="rgba(255,255,255,0.07)"` (dark).
- **Padding**: Left chart margins must be at least `20` to prevent label clipping on large currency metrics.
- **Conditional Label Rotation**:
  - If the dataset has **more than 15 points** on the X-axis:
    - Rotate labels by `angle={-45}` and set `textAnchor="end"`.
    - Increase XAxis container height to `height={45}` and adjust label alignment offsets to `dy={5}` to prevent viewport clipping.

---

## 9. Spacing & Responsiveness Guidelines

All layout components must scale gracefully.

### Responsive Grids
For summary blocks or chart components split between text and graphs (e.g. Sales by Item chart):
- Use responsive grids: `grid grid-cols-1 lg:grid-cols-3 gap-6 items-center`.
  - Left Panel (text list): `lg:col-span-1 flex flex-col gap-18 lg:pr-10 lg:border-r border-border/60`.
  - Right Panel (chart area): `lg:col-span-2 flex flex-col gap-5 w-full`.
- The vertical separator border `lg:border-r` and right padding `lg:pr-10` automatically collapse into stacked cards on mobile devices.

### Table Breakers
- **Desktop view**: Render tables as responsive grid systems inside `<div className="hidden md:block">`.
- **Mobile view**: Collapse columns into structured card profiles inside `<div className="md:hidden">` using expandable actions (`isExpanded`) for secondary parameters.

### Sizing and Padding
- Use Tailwind spacing scales only (`gap-6`, `p-8`, `space-y-6`). Do not write arbitrary padding values like `p-[20px]`.
- Always add `min-w-0` to the chart container wrappers to prevent flex layout column width expanding bugs.

### Strict Max-Width Constraint
- **NEVER use `max-w-*` (e.g., `max-w-5xl`, `max-w-md`) or `mx-auto` on components, pages, or layout wrappers.**
- Our layout system dynamically handles maximum widths and centering via the `DashboardShell`. Adding `max-w-*` directly to feature pages breaks layout consistency and prevents fluid scaling on ultra-wide screens. Always use `w-full` instead.
