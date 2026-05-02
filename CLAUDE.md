# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HeathLedger is a fast, minimal, mobile-first expense tracking web app for a single user. It replaces a raw text workflow (`"1 Apr - 236 (Biriyani) + 45 (Rapido)"`) with a structured but equally fast UI.

**Primary goal**: Log an expense in under 5 seconds on mobile.

## Tech Stack

- **Framework**: React or Next.js
- **Styling**: Tailwind CSS
- **State**: `useState` / `useReducer` — no Redux
- **Storage**: Browser `localStorage` — no backend

## Build Commands

> Project is pre-implementation (PRD only). Once scaffolded with Vite/Next.js these will apply:

```bash
npm install       # install dependencies
npm run dev       # start dev server
npm run build     # production build
npm run lint      # lint
```

## Architecture

```
/components
  AddExpenseModal   # floating "+" → quick input form (amount, category, note, date)
  ExpenseList       # reverse-chronological transaction list
  SummaryTable      # monthly totals broken down by category
/utils
  storage.js        # localStorage read/write helpers
  categoryMapper.js # maps vendor/note strings to categories
/pages or /app
  index             # main page — mounts all three components
```

**Data model** (stored in `localStorage`):
```js
{ id: string, amount: number, category: string, note: string, date: ISO string }
```

**Categories** (fixed, no nesting): `Rent/Fixed`, `Food`, `Transport`, `Social/Going Out`, `Shopping`, `Travel`, `Miscellaneous`

**Category mapping hints**: Rapido → Transport; Zepto/Blinkit → Food; Netflix/JioFiber → Fixed; Lunch/Dinner → Food; transfers/misc → Miscellaneous.

## Product Constraints

**Do not build** (explicit non-goals):
- Authentication or multi-user support
- Bank integrations or credit/debit accounting
- AI insights or complex analytics
- Nested category systems

**Nice-to-have (only if easy)**:
- Quick-add chips (e.g. "Rapido", "Lunch")
- Auto-fill category from note text
- Export month as CSV

## Key UX Rules

- Floating "+" button must always be visible
- Large tap targets throughout — mobile is the primary device
- Minimal typing — category should be a tap, not typed
- Monthly summary is the most important output view
