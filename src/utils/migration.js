// One-time migration from localStorage to IndexedDB.
// Runs on every app start but exits immediately after the first successful run.
// All localStorage reads are isolated here; no other module touches localStorage for data.

import { db } from './db'

const LS_EXPENSES_KEY    = 'heath_ledger_expenses'
const LS_CATEGORIES_KEY  = 'categories'
const LS_RECURRING_KEY   = 'heath_ledger_recurring'
const LS_QUICK_IDS_KEY   = 'heath_ledger_quick_actions'
const LS_QUICK_MAP_KEY   = 'heath_ledger_quick_map'   // legacy pre-array format
const LS_THEME_KEY       = 'heath_ledger_theme'
const LS_DARK_KEY        = 'heath_ledger_dark'

const EMOJI_TO_ICON = {
  '🍔': 'utensils', '🚗': 'car', '🏠': 'home',
  '🎉': 'users',    '🛍️': 'shopping-bag', '✈️': 'plane', '📦': 'box',
}

function readLocalExpenses() {
  try {
    const raw = localStorage.getItem(LS_EXPENSES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function readLocalCategories() {
  try {
    const raw = localStorage.getItem(LS_CATEGORIES_KEY)
    if (raw === null) return []  // never written — fresh install
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(c => {
      if (typeof c === 'string')    return { id: crypto.randomUUID(), name: c, icon: 'box' }
      if (c.emoji && !c.icon)      return { id: c.id ?? crypto.randomUUID(), name: c.name, icon: EMOJI_TO_ICON[c.emoji] ?? 'box' }
      if (!c.id)                   return { id: crypto.randomUUID(), ...c }
      return c
    })
  } catch { return [] }
}

function readLocalRecurring() {
  try {
    const raw = localStorage.getItem(LS_RECURRING_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function readLocalQuickActions() {
  try {
    const raw = localStorage.getItem(LS_QUICK_IDS_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      return parsed.map(item =>
        typeof item === 'string' ? { name: null, categoryId: item } : item
      )
    }
    // Migrate from even-older map format
    const mapRaw = localStorage.getItem(LS_QUICK_MAP_KEY)
    if (mapRaw) {
      const oldMap = JSON.parse(mapRaw)
      const seen = new Set()
      return ['rapido', 'zepto', 'lunch', 'dinner']
        .map(k => oldMap[k])
        .filter(id => id && !seen.has(id) && seen.add(id))
        .map(id => ({ name: null, categoryId: id }))
    }
    return []
  } catch { return [] }
}

export async function runMigration() {
  const flag = await db.settings.get('migrated')
  if (flag?.value === true) return

  const expenses    = readLocalExpenses()
  const categories  = readLocalCategories()
  const recurring   = readLocalRecurring()
  const quickActions = readLocalQuickActions()
  const theme       = localStorage.getItem(LS_THEME_KEY)
  const darkMode    = localStorage.getItem(LS_DARK_KEY)

  await db.transaction('rw', [db.expenses, db.categories, db.recurringRules, db.settings], async () => {
    if (expenses.length)      await db.expenses.bulkPut(expenses)
    if (categories.length)    await db.categories.bulkPut(categories)
    if (recurring.length)     await db.recurringRules.bulkPut(recurring)
    if (quickActions.length)  await db.settings.put({ key: 'quickActions', value: quickActions })
    if (theme)                await db.settings.put({ key: 'theme', value: theme })
    if (darkMode !== null)    await db.settings.put({ key: 'darkMode', value: darkMode })
    await db.settings.put({ key: 'migrated', value: true })
  })
}
