const KEYWORD_MAP = {
  rapido: 'Transport',
  ola: 'Transport',
  uber: 'Transport',
  metro: 'Transport',
  auto: 'Transport',
  zepto: 'Food',
  blinkit: 'Food',
  swiggy: 'Food',
  zomato: 'Food',
  lunch: 'Food',
  dinner: 'Food',
  breakfast: 'Food',
  netflix: 'Rent/Fixed',
  jiofiber: 'Rent/Fixed',
  hotstar: 'Rent/Fixed',
  spotify: 'Rent/Fixed',
  rent: 'Rent/Fixed',
  amazon: 'Shopping',
  flipkart: 'Shopping',
}

export function inferCategory(note) {
  if (!note) return ''
  const lower = note.toLowerCase()
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return category
  }
  return ''
}
