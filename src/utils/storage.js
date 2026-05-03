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
  { name: 'Transport', icon: 'car' },
  { name: 'Rent/Fixed', icon: 'home' },
  { name: 'Social/Going Out', icon: 'users' },
  { name: 'Shopping', icon: 'shopping-bag' },
  { name: 'Travel', icon: 'plane' },
  { name: 'Miscellaneous', icon: 'box' },
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

export function loadCategories() {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return parsed.map(c => {
        if (typeof c === 'string') return { name: c, icon: 'box' }
        if (c.emoji && !c.icon) return { name: c.name, icon: EMOJI_TO_ICON[c.emoji] ?? 'box' }
        return c
      })
    }
  } catch {}
  return DEFAULT_CATEGORIES.map(c => ({ ...c }))
}

export function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}
