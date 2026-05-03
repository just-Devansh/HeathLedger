const THEME_KEY = 'heath_ledger_theme'

export const THEMES = {
  blue: {
    pageBg: '#f1f5ff',
    primary: '#4f46e5',
    accent: '#6366f1',
    secondary: '#7c3aed',
    gradEnd: '#a855f7',
    gradientBg: 'linear-gradient(135deg, #4f46e5, #22c55e, #a855f7)',
    mutedText: '#c4b5fd',
    surface: '#ede9fe',
    border: '#ddd6fe',
    heading: '#1e1b4b',
    shadowRgb: '79,70,229',
  },
  green: {
    pageBg: '#f0fdf4',
    primary: '#16a34a',
    accent: '#22c55e',
    secondary: '#15803d',
    gradEnd: '#4ade80',
    gradientBg: 'linear-gradient(135deg, #16a34a, #22c55e, #4ade80)',
    mutedText: '#bbf7d0',
    surface: '#dcfce7',
    border: '#bbf7d0',
    heading: '#14532d',
    shadowRgb: '22,163,74',
  },
  black: {
    pageBg: '#f8fafc',
    primary: '#0f172a',
    accent: '#475569',
    secondary: '#1e293b',
    gradEnd: '#64748b',
    gradientBg: 'linear-gradient(135deg, #0f172a, #1e293b, #64748b)',
    mutedText: '#94a3b8',
    surface: '#f1f5f9',
    border: '#e2e8f0',
    heading: '#0f172a',
    shadowRgb: '15,23,42',
  },
}

export const THEME_META = [
  { id: 'blue',  label: 'Blue',  swatch: '#4f46e5' },
  { id: 'green', label: 'Green', swatch: '#16a34a' },
  { id: 'black', label: 'Black', swatch: '#0f172a' },
]

export function loadThemeName() {
  const saved = localStorage.getItem(THEME_KEY)
  return saved && THEMES[saved] ? saved : 'blue'
}

export function saveThemeName(name) {
  localStorage.setItem(THEME_KEY, name)
}
