# Heath Ledger — Project Roadmap

Sequential log of significant changes, features, and fixes.

---

## Foundation

- **Initial scaffold** — Vite + React + Tailwind CSS project setup
- **Core expense CRUD** — add, edit, delete expenses with amount, category, note, date
- **Category manager** — create, rename, delete custom categories
- **Day separators + hover states** — visual grouping in the expense list
- **Monthly insights + color toggle** — early summary view and theme switching
- **Dark mode + docked FAB** — dark/light toggle, floating action button docked to bottom
- **Icon system** — replaced emoji categories with lucide-react icon slugs
- **Typography revamp** — introduced Plus Jakarta Sans + Space Grotesk fonts
- **Devanagari empty state** — Noto Sans Devanagari for the "no expenses" message
- **History screen** — month-by-month expense history browser
- **Radial quick-action menu** — radial popup as an alternative to the plain + button
- **Edit + delete on transaction cards** — inline swipe/tap actions per expense row

---

## UX & Navigation

- **Month filter tabs** — Today / Week / Month filter on the Expenses screen
- **Horizontal swipe navigation** — swipe left/right between Expenses / Summary / History tabs
- **Swipe jank fix** — switched from `%` to `px` units, added `touch-action` to eliminate scroll conflicts
- **Tab total display** — shows the running total in the expense list header per filter
- **Backdated expense sort** — expenses inserted with past dates now sort correctly in month view
- **Add Expense modal UX** — improved mobile keyboard handling, tap-outside-to-close, date picker
- **Back navigation fix** — browser back button and modal closing integrated with History API

---

## Visual System

- **Corner radius consistency** — standardised `--r-*` CSS variable language across all cards and modals
- **Red / Pink / Orange color themes** — added three new accent variants
- **Black dark summary card contrast fix** — heading color adjusted for readability in black+dark combo
- **Shared PageHeader component** — extracted reusable header (label + title + subtitle + right slot) used across all screens
- **Summary header title + date format** — fixed month label formatting and header copy
- **Blood color theme** — added deep crimson (`#8b0000` / `#b31616`) accent variant
- **Blood theme hero text legibility** — hero card subtext changed to white to prevent red-on-red wash
- **Settings header consistency** — CategoryManager header updated to match PageHeader font, size, weight, and "Heath Ledger ✦" label exactly

---

## Categories & Recurring

- **Add category on-demand modal** — users can create a new category inline while logging an expense
- **Settings cards overflow menu** — category list items use a `⋮` overflow menu for edit/delete to avoid layout cramping
- **Collapse categories / See All** — long category lists collapse with a "See All" toggle
- **Category rename propagation** — renaming a category updates all existing expenses via UUID-based references
- **Category edit mobile overflow fix** — icon button row no longer overflows on small screens
- **Delete confirm X button** — destructive confirm button uses muted styling instead of red to reduce accidental taps
- **Recurring expenses system** — rules (amount + category + day of month) auto-applied on app open via `syncRecurring()`

---

## Export

- **PDF export v1** — html2canvas + jsPDF dark-themed monthly summary PDF
- **PDF generator overhaul** — full theme support, Space Grotesk typography, category progress bars
- **Image export replaces PDF** — new `generateImage.js` using html2canvas PNG export; PDF kept as internal fallback
- **html2canvas text clipping fix** — explicit `line-height` + `padding-bottom` on all text elements to prevent glyph cropping
- **Amount overflow fix** — replaced `display:table` layout with `position:absolute` for right-side amounts; amounts now never overflow the card boundary
- **Image quality upgrade** — scale 2→3 (1080px→1620px output), sharper on mobile zoom
- **2-column category grid in export** — when >5 categories, export uses flex-wrap 2-column layout to reduce image height
- **Hero card spacing match** — export hero card padding and line-height matched exactly to the live Summary page
- **Blood theme text fix in export** — hero subtext opacity raised to 0.80 so it reads white on dark-red gradients
- **Stat chips replaced** — removed Entries/Categories/Avg cards; replaced with "Most Expensive Day" + "Avg Expense"
- **Export filename** — renamed from `heath-ledger-YYYY-MM.png` to `Month-YYYY-Report-Heath-Ledger.png`
- **Native share support** — `navigator.share({ files })` triggers mobile share sheet (WhatsApp, Telegram, etc.); falls back to download

---

## PWA & Identity

- **PWA scaffold** — `vite-plugin-pwa` + Workbox service worker, offline-capable, installable
- **App icon** — custom SVG icon + PNG variants for all platform sizes
- **Workbox precaching** — instant launch from cache on repeat visits
- **App naming unified** — PWA `short_name`, `apple-mobile-web-app-title` changed from "Kharcha" to "Heath Ledger" to match product identity

---

## Responsive

- **Summary breakdown responsive 2-col** — category breakdown on Summary page switches to 2-column grid at `md` (768px+); stays single column on mobile to prevent text cramping
