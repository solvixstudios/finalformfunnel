# Solvix Dashboard AI Design System

**CRITICAL INSTRUCTION FOR AI:** This document is the absolute source of truth for all dashboard UI/UX redesigns across the Solvix application (excluding the form builder canvas itself, but including its surrounding layout). When asked to create or modify a dashboard page, you MUST adhere strictly to these principles, colors, typography, and component structures. **Do not use your default Tailwind assumptions.**

## 1. Core Philosophy
*   **Maximum Contrast & Cleanliness:** The interface relies on stark contrast between almost-black primary elements and pristine white cards set against a very light grey app background.
*   **Extreme Softness (Border Radius):** Harsh corners are strictly forbidden. Every interactive element and card must be heavily rounded. We are aiming for a friendly, modern, and highly polished "bubble/pill" aesthetic.
*   **Information Hierarchy via Typography:** Size and font-weight dictate importance, not colorful borders. Use massive, bold typography for key metrics and small, muted text for secondary details.
*   **Subtle & Meaningful Color:** Avoid flooding the screen with primary brand colors. Use color sparingly for status (Green = Good, Red = Bad) or specific isolated elements (like promo gradients).

## 2. Global Variables & Tokens (Tailwind)

### Backgrounds
*   **App Background:** `bg-slate-50` or `bg-[#F4F5F7]` (A very soft, cool off-white).
*   **Card Background:** `bg-white` (Pure white for all content containers).
*   **Subtle Highlight/Hover:** `bg-slate-100` or `bg-gray-100`.

### Typography
*   **Font Family:** Use `font-sans` (Inter or similar modern sans-serif). Highly legible.
*   **Primary Text (Headings, Key Numbers):** `text-slate-900` or `text-black`.
*   **Secondary Text (Subtitles, Labels, Table Headers):** `text-slate-500` or `text-gray-500`.
*   **Muted Text:** `text-slate-400`.

### Colors & Accents
*   **Primary Action (The "Dark Mode" Button):** `bg-slate-950` or `bg-[#111111]` with `text-white`. (Use this for the active sidebar item, primary "New Order" buttons, main CTA).
*   **Secondary Action:** Light soft grey pills `bg-slate-100 text-slate-700`.
*   **Positive/Success:** `text-emerald-500` `bg-emerald-50` (or standard `green-500`).
*   **Negative/Danger:** `text-rose-500` `bg-rose-50` (or standard `red-500`).
*   **Borders:** Use borders EXTREMELY sparingly. If needed, use `border-slate-100` or `border-slate-200`. Rely on background contrast and shadows instead.

### Shadows & Depth
*   **Cards:** `shadow-sm` or a custom extremely soft shadow. Mostly, rely on the white card vs. light grey background contrast.
*   **Floating Popovers/Tooltips:** `shadow-xl` or `shadow-2xl` for high elevation.

### Border Radius (Crucial)
*   **Cards & Modals:** `rounded-2xl` or `rounded-3xl` (e.g., `1rem` to `1.5rem`).
*   **Buttons (Primary/Secondary):** Fully rounded pills `rounded-full`.
*   **Inputs:** Fully rounded `rounded-full` or heavily rounded `rounded-xl`.
*   **Inner elements (Avatars, icons):** `rounded-full`.

## 3. Component Architecture & Rules

### 3.1 Sidebar (Left Panel)
*   **Background:** White (`bg-white`).
*   **Active Item:** Dark pill. `bg-black text-white rounded-full px-4 py-3`. Usually includes icon on left and small right arrow indicator on right.
*   **Inactive Items:** Muted text with icon. `text-slate-500 hover:text-black hover:bg-slate-50 rounded-full px-4 py-3 transition-colors`. Should also have the right arrow indicator `w-4 h-4`.
*   Layout should be extremely breathable with gaps (`gap-2`) between menu items.
*   Include a user profile card/section with `rounded-2xl`.

### 3.2 Top Navigation (Header)
*   **Background:** Transparent/light grey to blend with app background, or pure white.
*   **Search Input:** Pill-shaped `rounded-full bg-white border border-slate-200 px-4 py-2` with an understated search icon.
*   **Action Buttons (Icons):** Circular `rounded-full bg-white shadow-sm border border-slate-100 p-2`.
*   **Primary CTA Button:** Solid dark pill `bg-black text-white rounded-full px-6 py-2`.

### 3.3 Main Content Area Overview
*   **Greeting:** Large, bold hero text. E.g., `text-2xl` or `text-3xl font-bold tracking-tight text-slate-900`. Followed by a muted, softer subtitle (`text-slate-500`).
*   **Grid Layouts:** Use CSS Grid extensively for card layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3/4 gap-6`).

### 3.4 Cards (The Building Block)
*   **Structure:** Every widget, table container, or info block goes in a card.
*   **Classes:** `bg-white rounded-3xl p-6 shadow-sm` (adjust padding as needed, `p-6` or `p-8` is preferred).
*   **Kpis/Metrics inside Cards:**
    *   Large, bold dark numbers (`text-3xl font-black text-black`).
    *   Trend indicators (e.g., `+194.1 (74.18%)`) in distinct colors (Green/Red) directly below or beside the number, using small fonts (`text-xs` or `text-sm`).

### 3.5 Data Tables / Lists
*   **DO NOT build traditional strict grid tables with heavy borders.**
*   **Row-based Lists:** Treat each row as an autonomous, cleanly separated list item. You can use soft horizontal dividers (`divide-y divide-slate-100`).
*   **Headers:** Small, uppercase, muted, bold text (`text-xs font-bold text-slate-400 uppercase tracking-wider`).
*   **Status Badges (inside columns):** Simple colored text (`text-emerald-500 font-medium`) or minimal pills (`bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 text-xs`).
*   **Row Actions:** Dark pill buttons for primary actions (e.g., "Reorder" `bg-black text-white rounded-full px-4 py-1 text-sm`) or soft secondary pills (`bg-slate-200 text-slate-700`). Small icon buttons can be used.

### 3.6 Right Sidebar (Information/Action Panel)
*   Use for auxiliary info, recent activity, or tips.
*   Can feature nested cards, list items with circular avatars, and trend arrows. Incorporate elements like small floating detail cards.

### 3.7 Charts & Visuals
*   When rendering mock charts, use dark filled areas (e.g., `fill-slate-800`, `opacity-80`) with dark tooltips (`bg-black text-white rounded-xl`).
*   Rely on smooth curves over jagged lines.

## 4. UI Polish & Details

*   **Avatars:** Always `rounded-full`. Use overlapping flex layouts (`-space-x-2`) for groups of users.
*   **Icons:** Use consistent stroke-width modern icons (like `lucide-react`). Ensure they are sized appropriately relative to text (e.g., `w-5 h-5` or `w-4 h-4`).
*   **Empty States:** Must be beautifully designed with muted illustrations/icons, helpful text, and a clear primary CTA.
*   **Hover States:** Every interactive element must have a hover state for satisfying feedback (`hover:opacity-90`, `hover:scale-[1.02]`, etc).

## 5. Summary Checklist Before Submitting Code:
1.  [ ] Is every button and input heavily rounded (pill-shaped or `rounded-xl+`)?
2.  [ ] Are the primary actions almost black (`bg-slate-950`)?
3.  [ ] Are the cards pure white (`bg-white`) against a light grey background (`bg-slate-50`), with large border radii (`rounded-2xl/3xl`)?
4.  [ ] Are the typography weights highly contrasted (very bold numbers/titles, very thin/muted subtitles)?
5.  [ ] Have I avoided unnecessary borders and instead used generous whitespace and background contrast?
6.  [ ] Have I replaced standard HTML tables with modern, clean row-based list aesthetics?
