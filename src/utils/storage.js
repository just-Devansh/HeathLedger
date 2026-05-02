const KEY = 'heath_ledger_expenses'
const CATEGORIES_KEY = 'categories'
const DEFAULT_CATEGORIES = [
  { name: 'Food', emoji: '🍔' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Rent/Fixed', emoji: '🏠' },
  { name: 'Social/Going Out', emoji: '🎉' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Travel', emoji: '✈️' },
  { name: 'Miscellaneous', emoji: '📦' },
]

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

const DEFAULT_EMOJI_MAP = Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.name, c.emoji]))

export function loadCategories() {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      // backward compat: old format was string[] — use default emoji if name matches, else 📦
      return parsed.map(c => typeof c === 'string' ? { name: c, emoji: DEFAULT_EMOJI_MAP[c] ?? '📦' } : c)
    }
  } catch {}
  return DEFAULT_CATEGORIES.map(c => ({ ...c }))
}

export function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}
