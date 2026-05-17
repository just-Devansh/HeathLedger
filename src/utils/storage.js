const KEY = 'heath_ledger_expenses'
const CATEGORIES_KEY = 'categories'

const EMOJI_TO_ICON = {
  '🍔': 'utensils',
  '🚗': 'car',
  '🏠': 'home',
  '🎉': 'users',
  '🛍️': 'shopping-bag',
  '✈️': 'plane',
  '📦': 'box',
}

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'utensils' },
  { name: 'Commute', icon: 'bike' },
  { name: 'Zepto/Blinkit/Instamart', icon: 'shopping-bag' },
  { name: 'Transport', icon: 'car' },
  { name: 'Rent/Fixed', icon: 'home' },
  { name: 'Social/Going Out', icon: 'users' },
  { name: 'Shopping', icon: 'tag' },
  { name: 'Travel', icon: 'plane' },
  { name: 'Miscellaneous', icon: 'box' },
]

function normName(n) {
  return (n || '').toLowerCase().replace(/\s*\/\s*/g, '/').trim()
}

export function loadExpenses() {
  try {
    const data = localStorage.getItem(KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveExpenses(expenses) {
  localStorage.setItem(KEY, JSON.stringify(expenses))
}

export function loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    // null  → key never written → first launch
    // '[]'  → user deleted everything → respect it (truthy string, not null)
    if (raw !== null) {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('corrupt')
      let changed = false
      const result = parsed.map(c => {
        let cat = c
        if (typeof c === 'string') { cat = { name: c, icon: 'box' }; changed = true }
        else if (c.emoji && !c.icon) { cat = { name: c.name, icon: EMOJI_TO_ICON[c.emoji] ?? 'box' }; changed = true }
        if (!cat.id) { cat = { id: crypto.randomUUID(), ...cat }; changed = true }
        return cat
      })
      if (changed) localStorage.setItem(CATEGORIES_KEY, JSON.stringify(result))
      return result
    }
  } catch {}
  // First launch (or corrupt data) — seed defaults with stable IDs and persist immediately.
  const seed = DEFAULT_CATEGORIES.map(c => ({ id: crypto.randomUUID(), ...c }))
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(seed))
  return seed
}

export function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

// Converts expenses that reference categories by name string to reference by categoryId.
// Safe to call multiple times — skips expenses that already have a categoryId.
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

const BACKUP_THEME_KEY = 'heath_ledger_theme'
const BACKUP_DARK_KEY = 'heath_ledger_dark'

export function exportBackup() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'HeathLedger',
    expenses: loadExpenses(),
    categories: loadCategories(),
    settings: {
      theme: localStorage.getItem(BACKUP_THEME_KEY) ?? 'blue',
      darkMode: localStorage.getItem(BACKUP_DARK_KEY),
    },
  }
  return JSON.stringify(backup, null, 2)
}

export function validateBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid')
  if (typeof data.version !== 'number') throw new Error('invalid')
  if (data.version > 2) throw new Error('version')
  if (!Array.isArray(data.expenses)) throw new Error('invalid')
  if (!Array.isArray(data.categories)) throw new Error('invalid')
}

export function applyBackup(data) {
  saveExpenses(data.expenses)
  saveCategories(data.categories)
  const { theme, darkMode } = data.settings ?? {}
  if (theme) localStorage.setItem(BACKUP_THEME_KEY, theme)
  if (darkMode !== null && darkMode !== undefined) localStorage.setItem(BACKUP_DARK_KEY, String(darkMode))
}
