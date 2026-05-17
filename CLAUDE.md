# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Heath Ledger** is a fast, minimal, mobile-first PWA expense tracker for a single user. It replaces a raw text workflow (`"1 Apr - 236 (Biriyani) + 45 (Rapido)"`) with a structured but equally fast UI.

**Primary goal**: Log an expense in under 5 seconds on mobile.

**Deployed as a PWA** — installable on Android/iOS home screen, works offline via Workbox service worker.

## Tech Stack

- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS v3
- **State**: `useState` / `useMemo` — no Redux
- **Storage**: Browser `localStorage` — no backend, no auth
- **Icons**: `lucide-react`
- **Image export**: `html2canvas` (PNG generation)
- **PDF export**: `jspdf` + `html2canvas` (kept as internal fallback, not exposed in UI)
- **PWA**: `vite-plugin-pwa` + Workbox

## Build Commands

```bash
npm install           # install dependencies
npm run dev           # start dev server (Vite, http://localhost:5173)
npm run build         # production build → dist/
npm run preview       # serve production build locally
npm run generate:icons  # regenerate PWA icons via sharp
```

## Architecture

```
HeathLedger/
├── index.html                       # PWA meta, font preconnects, theme flash-prevention script
├── public/manifest.json             # PWA manifest — name: "Heath Ledger", short_name: "Heath Ledger"
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── index.css                    # Tailwind base + custom animations (icon-spin, header-animate)
    ├── main.jsx                     # React entry point
    ├── App.jsx                      # Root — holds expenses state, 3-tab nav, swipe gestures, modals
    ├── context/
    │   └── ThemeContext.jsx         # Theme + dark mode state, CSS variable injection
    ├── components/
    │   ├── PageHeader.jsx           # Shared header: "Heath Ledger ✦" label + display title + subtitle
    │   ├── AddExpenseModal.jsx      # Bottom-sheet: amount, category chips, note, date picker
    │   ├── AddCategoryModal.jsx     # Modal to create a new category with icon picker
    │   ├── AddRecurringModal.jsx    # Modal to add a recurring expense rule
    │   ├── ExpenseList.jsx          # Reverse-chronological expense list; Today/Week/Month filter tabs
    │   ├── SummaryScreen.jsx        # Monthly summary: hero card, 2 stat chips, category breakdown
    │   ├── SummaryTable.jsx         # (stub — unused)
    │   ├── HistoryScreen.jsx        # Month-by-month history browser
    │   ├── CategoryManager.jsx      # Settings modal: theme picker, dark mode, category CRUD, backup
    │   ├── RecurringManager.jsx     # View/delete recurring expense rules
    │   ├── BackupSection.jsx        # JSON export + import for full data backup
    │   └── RadialMenu.jsx           # Radial quick-action menu (alternative to floating + button)
    └── utils/
        ├── storage.js               # loadExpenses/saveExpenses, loadCategories/saveCategories,
        │                            #   loadRecurring/saveRecurring, backup export/import
        ├── categoryMapper.js        # inferCategory(note) → category string (keyword matching)
        ├── dateFormat.js            # monthYearLabel, dayMonthLabel, fullDateLabel helpers
        ├── theme.js                 # buildTheme(), THEME_META, ACCENT_VARIANTS, PAGE_BGS
        ├── icons.jsx                # getIcon(name, props) — maps icon slug → lucide component
        ├── recurringExpenses.js     # syncRecurring() — auto-applies recurring rules on app open
        ├── generateImage.js         # PNG export: html2canvas-based dedicated off-screen canvas
        └── generatePDF.js           # PDF export: html2canvas + jsPDF (internal fallback only)
```

## Data Models (localStorage)

**Expenses** — key `heath_ledger_expenses`:
```js
{
  id: string,           // uuid
  amount: number,
  categoryId: string,   // uuid ref to category — primary key for grouping
  category: string,     // legacy string name (still present on old entries)
  note: string,
  date: ISO string,
}
```
> Always group by `exp.categoryId ?? exp.category` to handle both migrated and legacy entries.

**Categories** — key `categories`:
```js
{ id: string, name: string, icon: string }  // icon is a lucide slug e.g. "utensils"
```

Default categories (with UUIDs on first load): Food, Commute, Zepto/Blinkit/Instamart, Transport, Rent/Fixed, Social/Going Out, Shopping, Travel, Miscellaneous.

**Recurring rules** — key `heath_ledger_recurring`:
```js
{ id: string, amount: number, categoryId: string, note: string, dayOfMonth: number }
```
Auto-applied each time the app opens via `syncRecurring()`.

## Theme System

`src/utils/theme.js` — `buildTheme(themeName, isDark)` merges base + accent variant:

**7 accent variants**: `blue`, `green`, `black`, `red`, `blood`, `pink`, `orange`

Each variant has `light` and `dark` modes — 14 total combinations.

Key theme tokens: `pageBg`, `cardBg`, `surface`, `inputBg`, `primary`, `accent`, `secondary`, `gradEnd`, `gradientBg`, `mutedText`, `heading`, `shadowRgb`, `heroShadow`, `border`, `text`, `textMuted`, `textFaint`.

CSS variables set on `document.root`: `--card-bg`, `--input-bg`, `--border`, `--text`, `--text-muted`, `--danger-surface`.

localStorage keys: `heath_ledger_theme` (default `blue`), `heath_ledger_dark` (default: system preference).

## Navigation

- **3 tabs**: Expenses (index 0), Summary (index 1), History (index 2)
- **Horizontal swipe** between tabs (touch gesture in App.jsx)
- **Filter tabs** on Expenses: Today / Week / Month
- **Settings** opens as a full-screen modal from the gear icon
- Back button / history API integration for modals (`window.history.pushState`)

## Image Export (`generateImage.js`)

The primary export action on the Summary page. Generates a shareable PNG via html2canvas:

- **Hidden off-screen canvas**: 540px DOM width, captured at `scale: 3` → **1620px PNG output**
- **Layout**: Header → divider → hero total card → 2 stat chips → category breakdown → footer
- **Stat chips**: "Most Expensive Day" (date + amount) + "Avg Expense"
- **Category layout**: single column (≤5 categories) or 2-column flex-wrap (>5 categories)
- **Theme-aware**: respects current dark/light mode + all 7 accent colors
- **Share**: `navigator.share({ files })` on mobile, direct download fallback on desktop
- **Filename**: `{Month}-{Year}-Report-Heath-Ledger.png` (e.g. `May-2026-Report-Heath-Ledger.png`)
- **html2canvas gotchas**: all text needs `line-height` + `padding-bottom: 4px` to prevent glyph clipping; `overflow:hidden` for truncation must be on a wrapper div, not the text element itself; use `position:absolute` for the amount column, NOT flexbox/table (html2canvas has layout bugs with both)

## Key html2canvas Rules (IMPORTANT)

Violating these causes clipping, overflow, or broken layout in the exported image:

1. Every `<p>` / `<span>` needs explicit `line-height` (≥1.2) AND `padding-bottom: 4–6px`
2. Text truncation (`overflow:hidden; white-space:nowrap; text-overflow:ellipsis`) must be on a **wrapper div**, not the text element itself
3. For left-value / right-value rows: use `position:relative` on container + `position:absolute; right:Xpx` for the right value — flexbox column widths and `display:table` are unreliable
4. Use `display:block` on all text elements explicitly
5. Add a `setTimeout(80ms)` before calling `html2canvas` so off-screen layout settles

## SummaryScreen Category Layout

`src/components/SummaryScreen.jsx` — breakdown list is responsive:
- **Mobile (< 768px)**: always single column (`flex flex-col gap-3`)
- **Tablet / PC (≥ 768px)**: 2-column grid when `breakdown.length > 5` (`md:grid md:grid-cols-2`)

## PageHeader Component

`src/components/PageHeader.jsx` — used by all three main screens (Expenses, Summary, History) and Settings:

```jsx
<PageHeader label="Heath Ledger ✦" title="Phirse Kharcha?" subtitle={monthYearLabel(new Date())} right={<button>} />
```

- `label`: `text-xs font-semibold uppercase`, `letterSpacing: 0.13em`, color `theme.accent`
- `title`: `font-display`, `fontSize: 2.35rem`, `fontWeight: 800`, `lineHeight: 1.0`, `letterSpacing: -0.035em`

Settings header in `CategoryManager.jsx` uses identical styles — keep them in sync.

## Product Constraints

**Do not build**:
- Authentication or multi-user support
- Bank integrations or credit/debit accounting
- AI insights or complex analytics
- Nested category systems

**Intentional non-goals**:
- Backend / cloud sync
- CSV export (JSON backup exists)

## Implementation Status

| Feature | Status |
|---|---|
| Vite + React + Tailwind scaffold | Done |
| localStorage persistence | Done |
| Add Expense modal (bottom-sheet) | Done |
| Category chip selection | Done |
| Expense list (Today/Week/Month filters) | Done |
| Monthly summary screen | Done |
| History screen (month browser) | Done |
| Radial quick-action menu | Done |
| Dark mode | Done |
| 7 color themes (blue/green/black/red/blood/pink/orange) | Done |
| Custom category CRUD with icon picker | Done |
| Recurring expenses system | Done |
| JSON backup export + import | Done |
| PWA (installable, offline-capable) | Done |
| Image export (PNG, shareable) | Done |
| PDF export | Done (internal fallback only) |
| Swipe navigation between tabs | Done |
| Horizontal scroll filter tabs | Done |
| Settings header consistency | Done |
| Responsive 2-col summary breakdown (tablet+) | Done |
