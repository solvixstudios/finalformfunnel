# Final Form — UI/UX Design Principles

> This document is the **single source of truth** for all styling decisions in the app.
> Every page, component, sheet, and modal **must** follow these rules without exception.

---

## 1. Color System

### Primary Palette
| Token            | Value                | Usage                                    |
|------------------|----------------------|------------------------------------------|
| `--surface`      | `#FFFFFF`            | Cards, modals, table backgrounds         |
| `--canvas`       | `#FAFAFA`            | Page / layout background                 |
| `--accent`       | `slate-900`          | Primary buttons, active pills, selection |
| `--accent-hover` | `slate-800`          | Hover for primary buttons                |

### Semantic Colors
| Token         | Value            | Usage                                    |
|---------------|------------------|------------------------------------------|
| Success       | `emerald-500/50` | Active states, synced, product forms     |
| Warning       | `amber-500/50`   | Warnings, sync-required                  |
| Danger        | `red-500`        | Destructive actions, logout              |
| Info          | `indigo-500`     | Accent in integrations (Shopify etc.)    |

### Text Hierarchy
| Level     | Class                                           |
|-----------|--------------------------------------------------|
| Title     | `text-lg font-bold text-slate-900 tracking-tight`|
| Subtitle  | `text-sm text-slate-500`                         |
| Body      | `text-sm text-slate-700`                         |
| Caption   | `text-xs text-slate-400`                         |
| Micro     | `text-[10px] text-slate-400`                     |
| Label     | `text-xs font-bold text-slate-500 uppercase tracking-wider` |

---

## 2. Border Radius

| Element                     | Class            |
|-----------------------------|------------------|
| Page-level containers       | `rounded-2xl`    |
| Cards, tables, modals       | `rounded-2xl`    |
| Inner panels, inputs, chips | `rounded-xl`     |
| Pills, tags, badges         | `rounded-full`   |
| Buttons (primary)           | `rounded-full`   |
| Buttons (contextual/small)  | `rounded-lg`     |
| Images, avatars             | `rounded-xl`     |

> ⚠ **NEVER** use `rounded-md` or `rounded-sm`. The design MUST feel soft and modern.

---

## 3. Spacing & Layout

| Property            | Rule                                              |
|---------------------|----------------------------------------------------|
| Page max-width      | `max-w-[1600px] mx-auto`                          |
| Page padding-top    | `pt-2`                                             |
| Section gap         | `space-y-6` between major sections                 |
| Card padding        | `p-5` for standard cards                           |
| Internal gap        | `gap-4` for grid layouts                           |
| Compact gap         | `gap-2` for inline groups                          |

---

## 4. Shadows & Borders

| Element               | Rule                                               |
|------------------------|----------------------------------------------------|
| Cards at rest          | `border border-slate-200/80 shadow-sm`             |
| Cards on hover         | `hover:border-slate-300 hover:shadow-lg`           |
| Elevated panels        | `shadow-lg`                                        |
| Inputs at rest         | `border-slate-200/80 shadow-sm`                    |
| Inputs focus           | `focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300` |

> **No raw `border-slate-200`** — always use `/80` or `/60` opacity for subtlety.

---

## 5. Buttons

### Primary (Call-to-action)
```
bg-slate-900 hover:bg-slate-800 text-white rounded-full h-8/h-9 px-4/px-5 text-xs font-semibold shadow-sm
```

### Secondary / Outline
```
variant="outline" rounded-lg text-xs font-medium border-slate-200/80
```

### Ghost / Icon
```
variant="ghost" h-8 w-8 rounded-full text-slate-400 hover:text-slate-600
```

### Destructive (in menus/dialogs only)
```
text-red-600 hover:bg-red-50
```

---

## 6. Interactive Patterns

### Pills / Filter Tabs
```
Container: bg-slate-100 p-1 rounded-full border border-slate-200/60
Active:    bg-white text-slate-900 shadow-sm rounded-full
Inactive:  text-slate-500 hover:text-slate-700
```

### View Toggle (list/grid)
Same as pill pattern, using `p-1.5 rounded-full` buttons inside.

### Cards — Hover
```
group-hover:opacity-100  (reveal actions)
group-hover:scale-105    (images only, in grid view)
transition-all duration-300
```

### Selection (radio-like cards)
```
Selected: border-2 border-slate-900 bg-slate-50
Default:  border-2 border-slate-200/80 hover:border-slate-300
```

---

## 7. Empty States

```
Centered layout, py-20
Icon: w-14/w-16 h-14/h-16 bg-slate-100 rounded-2xl + slate-300 icon
Title: text-base font-bold text-slate-900
Description: text-sm text-slate-400 max-w-xs
CTA button: Primary style (rounded-full, slate-900)
```

---

## 8. Tables

```
Container:  bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden
Header row: bg-slate-50/80 border-b border-slate-100
Header text: text-xs font-bold text-slate-500 uppercase tracking-wider py-3
Body row:   hover:bg-slate-50/50 transition-colors
Actions:    opacity-0 group-hover:opacity-100 (reveal on row hover)
```

---

## 9. Sheets / Modals

```
Header:     px-6 pt-6 pb-5 border-b border-slate-100
Title:      text-lg font-bold tracking-tight
Step Pills: bg-slate-900 text-white (active), bg-slate-100 text-slate-500 (inactive)
Footer:     sticky bottom-0 px-6 py-4 border-t border-slate-100 bg-white
```

---

## 10. Sidebar (Dark)

```
Background: bg-[#0F172A]/95 backdrop-blur-2xl
Nav item:   rounded-2xl text-slate-400
Active nav: bg-white/10 text-white + orange-400 icon accent
Logo icon:  gradient from-orange-500 to-amber-500 rounded-xl
```

---

## 11. Typography Rules

- **Font stack**: System font (`font-sans`) — Inter via globals or Tailwind default
- **No `font-black`** inside the dashboard — use `font-bold` or `font-extrabold` sparingly
- **`tracking-tight`** on headings, `tracking-wider` on uppercase labels only
- **`line-clamp-1`** or `truncate` for long text in cards and tables

---

## 12. Animation Guidelines

| Animation          | Rule                                        |
|--------------------|----------------------------------------------|
| Hover transitions  | `transition-all duration-300`                |
| Image scale        | `group-hover:scale-105 duration-500 ease-out`|
| Fade-in            | `animate-in fade-in duration-300`            |
| Status dot pulse   | `animate-ping` on status indicators only     |
| Framer Motion      | Sidebar nav only — `spring` stiffness 500    |

> **No `animate-fade-up`** or custom keyframes unless globally defined in `index.css`.

---

## 13. Responsive Rules

| Breakpoint | Target                                                |
|------------|-------------------------------------------------------|
| `sm:`      | Stack → row for toolbars, 2-col grids                |
| `md:`      | Show sidebar tabs for settings, 3-col grids          |
| `lg:`      | Desktop sidebar visible, 4-5 col grids               |
| `xl:`      | 6-col product grid                                   |

- **Mobile-first**: All layouts start single-column
- **Touch targets**: Minimum `h-10 w-10` (44px) for interactive elements on mobile
- **Scrollable areas**: Use `overflow-y-auto min-h-0` inside flex columns

---

## 14. Component-Specific Rules

### PageHeader
Every dashboard page **must** use the `<PageHeader>` component with:
- `title`, `breadcrumbs`, `icon` (from lucide-react)
- `actions` slot for page-level controls

### Status Indicators
- Green dot + "Synced" or "Active" → `bg-emerald-500`
- Amber text + "Required" → `bg-amber-50 text-amber-700`  
- Inline dot: `w-1.5 h-1.5 rounded-full`

### Form Assignment Badges
- Product-specific: `bg-emerald-50 text-emerald-700 border-emerald-200/60 rounded-full`
- Global/store-wide: `bg-slate-100 text-slate-600 border-slate-200/60 rounded-full`

---

## 15. Anti-Patterns (NEVER DO)

| ❌ Don't                                   | ✅ Do Instead                              |
|--------------------------------------------|--------------------------------------------|
| Use `bg-indigo-600` for primary buttons    | Use `bg-slate-900`                         |
| `rounded-md` or `rounded-sm`              | `rounded-xl`, `rounded-2xl`, `rounded-full`|
| Raw `border-slate-200`                     | `border-slate-200/80` or `/60`             |
| Hard color badges for status               | Soft bg + text with `/50` border           |
| Placeholder images or broken `<img>`       | Fallback icon in styled container          |
| `font-black` in dashboard                  | `font-bold` or `font-extrabold`            |
| Inline `style={{ color }}` for theming     | Tailwind classes with `cn()` helper        |
| `text-muted-foreground` (shadcn default)   | `text-slate-400` or `text-slate-500`       |
