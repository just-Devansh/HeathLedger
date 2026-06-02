// All app persistence — reads and writes go through IndexedDB via Dexie.
// localStorage is no longer used for app data (only theme/dark retain a localStorage
// copy for the flash-prevention script in index.html).

import { db } from './db'
import { syncRecurringExpenses } from './recurringExpenses'

const DEFAULT_CATEGORIES = [
  { name: 'Food',                   icon: 'utensils'     },
  { name: 'Commute',                icon: 'bike'         },
  { name: 'Zepto/Blinkit/Instamart',icon: 'shopping-bag' },
  { name: 'Transport',              icon: 'car'          },
  { name: 'Rent/Fixed',             icon: 'home'         },
  { name: 'Social/Going Out',       icon: 'users'        },
  { name: 'Shopping',               icon: 'tag'          },
  { name: 'Travel',                 icon: 'plane'        },
  { name: 'Miscellaneous',          icon: 'box'          },
]

function normName(n) {
  return (n || '').toLowerCase().replace(/\s*\/\s*/g, '/').trim()
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function loadExpenses() {
  const exps = await db.expenses.toArray()
  return exps.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function saveExpense(expense) {
  return db.expenses.put(expense)
}

export function deleteExpense(id) {
  return db.expenses.delete(id)
}

export function bulkAddExpenses(expenses) {
  return db.expenses.bulkPut(expenses)
}

// ── Trips ─────────────────────────────────────────────────────────────────────

export async function loadTrips() {
  const trips = await db.trips.toArray()
  return trips.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
}

export function saveTrip(trip) {
  return db.trips.put(trip)
}

export function deleteTrip(id) {
  return db.trips.delete(id)
}

export async function replaceAllTrips(trips) {
  await db.transaction('rw', db.trips, async () => {
    await db.trips.clear()
    if (trips.length) await db.trips.bulkPut(trips)
  })
}

export async function replaceAllExpenses(expenses) {
  await db.transaction('rw', db.expenses, async () => {
    await db.expenses.clear()
    if (expenses.length) await db.expenses.bulkPut(expenses)
  })
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function loadCategories() {
  // Fast path: categories already exist.
  const cats = await db.categories.toArray()
  if (cats.length) return cats

  // Slow path: seed defaults inside a transaction so concurrent callers (e.g.
  // React StrictMode double-invoking effects) don't each insert a full set.
  // IndexedDB transactions on a single page are serialized, so only the first
  // caller that gets inside the tx will see count === 0 and actually seed.
  return db.transaction('rw', db.categories, async () => {
    const count = await db.categories.count()
    if (count > 0) return db.categories.toArray()
    const seed = DEFAULT_CATEGORIES.map(c => ({ id: crypto.randomUUID(), ...c }))
    await db.categories.bulkPut(seed)
    return seed
  })
}

export function saveCategory(cat) {
  return db.categories.put(cat)
}

export function deleteCategory(id) {
  return db.categories.delete(id)
}

export async function replaceAllCategories(cats) {
  await db.transaction('rw', db.categories, async () => {
    await db.categories.clear()
    if (cats.length) await db.categories.bulkPut(cats)
  })
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

export async function loadQuickActions() {
  const row = await db.settings.get('quickActions')
  const raw = row?.value ?? []
  return raw.map(item =>
    typeof item === 'string' ? { name: null, categoryId: item } : item
  )
}

export function saveQuickActions(actions) {
  return db.settings.put({ key: 'quickActions', value: actions.slice(0, 4) })
}

// ── Recurring Rules ───────────────────────────────────────────────────────────

export async function loadRecurringRules() {
  return db.recurringRules.toArray()
}

export async function saveRecurringRules(rules) {
  await db.transaction('rw', db.recurringRules, async () => {
    await db.recurringRules.clear()
    if (rules.length) await db.recurringRules.bulkPut(rules)
  })
}

// ── Palette ───────────────────────────────────────────────────────────────────

export async function loadPalette() {
  const row = await db.settings.get('palette')
  return row?.value ?? null
}

export function savePalette(id) {
  if (id === null) {
    return db.settings.delete('palette')
  }
  return db.settings.put({ key: 'palette', value: id })
}

// ── Category migration helper (still pure — no DB side-effects) ────────────────

export function migrateExpensesToCategoryIds(expenses, categories) {
  const nameToId = Object.fromEntries(categories.map(c => [normName(c.name), c.id]))
  let changed = false
  const migrated = expenses.map(exp => {
    if (exp.categoryId != null) return exp
    changed = true
    return { ...exp, categoryId: nameToId[normName(exp.category ?? '')] ?? null }
  })
  return { expenses: migrated, changed }
}

// ── Backup export / import ────────────────────────────────────────────────────

export async function exportBackup() {
  const [expenses, categories, recurringRules, quickActions, trips, themeRow, darkRow] = await Promise.all([
    loadExpenses(),
    loadCategories(),
    loadRecurringRules(),
    loadQuickActions(),
    loadTrips(),
    db.settings.get('theme'),
    db.settings.get('darkMode'),
  ])
  return JSON.stringify({
    version: 3,
    exportedAt: new Date().toISOString(),
    appName: 'HeathLedger',
    expenses,
    categories,
    recurringRules,
    quickActions,
    trips,
    settings: {
      theme:    themeRow?.value ?? 'blue',
      darkMode: darkRow?.value  ?? null,
    },
  }, null, 2)
}

export function validateBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid')
  if (typeof data.version !== 'number')   throw new Error('invalid')
  if (data.version > 3)                   throw new Error('version')
  if (!Array.isArray(data.expenses))      throw new Error('invalid')
  if (!Array.isArray(data.categories))    throw new Error('invalid')
}

// Applies a validated backup to IndexedDB. Returns the fully-processed data so
// callers can sync React state without re-reading from DB.
export async function applyBackup(data) {
  const catsWithIds = data.categories.map(c =>
    c.id ? c : { id: crypto.randomUUID(), ...c }
  )
  const { expenses: migratedExpenses } = migrateExpensesToCategoryIds(data.expenses, catsWithIds)
  const restoredRules = Array.isArray(data.recurringRules) ? data.recurringRules : []
  const restoredTrips = Array.isArray(data.trips) ? data.trips : []
  const generated     = syncRecurringExpenses(restoredRules, migratedExpenses)
  const finalExpenses = generated.length ? [...generated, ...migratedExpenses] : migratedExpenses

  const { theme, darkMode } = data.settings ?? {}

  await db.transaction('rw', [db.expenses, db.categories, db.recurringRules, db.settings, db.trips], async () => {
    await db.expenses.clear()
    if (finalExpenses.length) await db.expenses.bulkPut(finalExpenses)

    await db.categories.clear()
    if (catsWithIds.length) await db.categories.bulkPut(catsWithIds)

    await db.recurringRules.clear()
    if (restoredRules.length) await db.recurringRules.bulkPut(restoredRules)

    await db.trips.clear()
    if (restoredTrips.length) await db.trips.bulkPut(restoredTrips)

    if (theme) {
      await db.settings.put({ key: 'theme', value: theme })
      // Keep localStorage copy in sync so the flash-prevention script stays correct.
      localStorage.setItem('heath_ledger_theme', theme)
    }
    if (darkMode !== null && darkMode !== undefined) {
      await db.settings.put({ key: 'darkMode', value: String(darkMode) })
      localStorage.setItem('heath_ledger_dark', String(darkMode))
    }
  })

  return {
    expenses:       finalExpenses,
    categories:     catsWithIds,
    recurringRules: restoredRules,
    trips:          restoredTrips,
    settings:       data.settings ?? {},
  }
}
