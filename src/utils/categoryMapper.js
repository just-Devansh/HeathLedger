const KEYWORD_MAP = {
  rapido: 'Commute',
  ola: 'Commute',
  uber: 'Commute',
  metro: 'Commute',
  auto: 'Commute',
  zepto: 'Zepto/Blinkit/Instamart',
  blinkit: 'Zepto/Blinkit/Instamart',
  instamart: 'Zepto/Blinkit/Instamart',
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
