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

```bash
npm install       # install dependencies
npm run dev       # start dev server (Vite, http://localhost:5173)
npm run build     # production build → dist/
npm run preview   # serve production build locally
```

## Architecture

```
HeathLedger/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── index.css                    # Tailwind base/components/utilities
    ├── main.jsx                     # React entry point
    ├── App.jsx                      # Root — holds expenses state, mounts layout
    ├── components/
    │   ├── AddExpenseModal.jsx      # Bottom-sheet modal: amount, category chips, note, date
    │   ├── ExpenseList.jsx          # Reverse-chronological list with emoji + date
    │   └── SummaryTable.jsx        # Monthly summary (stub — not yet implemented)
    └── utils/
        ├── storage.js               # loadExpenses() / saveExpenses() via localStorage
        └── categoryMapper.js        # inferCategory(note) → category string
```

**Data model** (stored in `localStorage` under key `heath_ledger_expenses`):
```js
{ id: string, amount: number, category: string, note: string, date: ISO string }
```

**Categories** (fixed, no nesting): `Rent/Fixed`, `Food`, `Transport`, `Social/Going Out`, `Shopping`, `Travel`, `Miscellaneous`

**Category mapping** (`categoryMapper.js` keyword → category):
- Rapido, Ola, Uber, Metro, Auto → Transport
- Zepto, Blinkit, Swiggy, Zomato, Lunch, Dinner, Breakfast → Food
- Netflix, JioFiber, Hotstar, Spotify, Rent → Rent/Fixed
- Amazon, Flipkart → Shopping
- Everything else → user picks manually

## Implementation Status

| Feature | Status |
|---|---|
| Vite + React + Tailwind scaffold | Done |
| localStorage persistence | Done |
| Floating "+" button | Done |
| Add Expense modal (bottom-sheet) | Done |
| Category chip selection | Done |
| Auto-infer category from note | Done |
| Expense list (reverse-chron) | Done |
| Monthly summary (SummaryTable) | Not started |

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
