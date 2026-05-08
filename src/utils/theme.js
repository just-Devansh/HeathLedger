const THEME_KEY = 'heath_ledger_theme'
const DARK_KEY = 'heath_ledger_dark'

const LIGHT_BASE = {
  cardBg: '#ffffff',
  inputBg: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  glassBg: 'rgba(255,255,255,0.72)',
  glassShadow: '0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.8)',
  filterBg: 'rgba(255,255,255,0.6)',
  modalBg: 'rgba(0,0,0,0.5)',
  dangerSurface: '#fef2f2',
}

const DARK_BASE = {
  cardBg: '#151515',
  inputBg: '#0a0a0a',
  border: 'rgba(255,255,255,0.06)',
  text: '#f8fafc',
  textMuted: 'rgba(255,255,255,0.6)',
  textFaint: 'rgba(255,255,255,0.35)',
  glassBg: 'rgba(15,15,15,0.92)',
  glassShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
  filterBg: 'rgba(21,21,21,0.92)',
  modalBg: 'rgba(0,0,0,0.8)',
  dangerSurface: 'rgba(239,68,68,0.15)',
}

const ACCENT_VARIANTS = {
  blue: {
    light: {
      pageBg: '#f1f5ff',
      surface: '#ede9fe',
      primary: '#4f46e5',
      accent: '#6366f1',
      secondary: '#7c3aed',
      gradEnd: '#a855f7',
      gradientBg: 'linear-gradient(135deg, #4f46e5, #22c55e, #a855f7)',
      mutedText: '#c4b5fd',
      heading: '#1e1b4b',
      shadowRgb: '79,70,229',
    },
    dark: {
      pageBg: '#050505',
      surface: '#1d1d1d',
      primary: '#6366f1',
      accent: '#818cf8',
      secondary: '#7c3aed',
      gradEnd: '#a855f7',
      gradientBg: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)',
      mutedText: '#c4b5fd',
      heading: '#e0e7ff',
      shadowRgb: '99,102,241',
    },
  },
  green: {
    light: {
      pageBg: '#f0fdf4',
      surface: '#dcfce7',
      primary: '#16a34a',
      accent: '#22c55e',
      secondary: '#15803d',
      gradEnd: '#4ade80',
      gradientBg: 'linear-gradient(135deg, #16a34a, #22c55e, #4ade80)',
      mutedText: '#bbf7d0',
      heading: '#14532d',
      shadowRgb: '22,163,74',
    },
    dark: {
      pageBg: '#050505',
      surface: '#1d1d1d',
      primary: '#22c55e',
      accent: '#4ade80',
      secondary: '#16a34a',
      gradEnd: '#86efac',
      gradientBg: 'linear-gradient(135deg, #15803d, #16a34a, #22c55e)',
      mutedText: '#bbf7d0',
      heading: '#dcfce7',
      shadowRgb: '34,197,94',
    },
  },
  black: {
    light: {
      pageBg: '#f8fafc',
      surface: '#f1f5f9',
      primary: '#0f172a',
      accent: '#475569',
      secondary: '#1e293b',
      gradEnd: '#64748b',
      gradientBg: 'linear-gradient(135deg, #0f172a, #1e293b, #64748b)',
      mutedText: '#94a3b8',
      heading: '#0f172a',
      shadowRgb: '15,23,42',
    },
    dark: {
      pageBg: '#050505',
      surface: '#1d1d1d',
      primary: '#94a3b8',
      accent: '#cbd5e1',
      secondary: '#64748b',
      gradEnd: '#e2e8f0',
      gradientBg: 'linear-gradient(135deg, #64748b, #94a3b8, #cbd5e1)',
      mutedText: '#94a3b8',
      heading: '#f1f5f9',
      shadowRgb: '148,163,184',
    },
  },
}

export function buildTheme(themeName, isDark) {
  const mode = isDark ? 'dark' : 'light'
  return {
    ...(isDark ? DARK_BASE : LIGHT_BASE),
    ...ACCENT_VARIANTS[themeName][mode],
  }
}

export const THEME_META = [
  { id: 'blue',  label: 'Blue',  swatch: '#4f46e5' },
  { id: 'green', label: 'Green', swatch: '#16a34a' },
  { id: 'black', label: 'Black', swatch: '#0f172a' },
]

export function loadThemeName() {
  const saved = localStorage.getItem(THEME_KEY)
  return saved && ACCENT_VARIANTS[saved] ? saved : 'blue'
}

export function saveThemeName(name) {
  localStorage.setItem(THEME_KEY, name)
}

export function loadDarkMode() {
  const saved = localStorage.getItem(DARK_KEY)
  if (saved !== null) return saved === 'true'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function saveDarkMode(val) {
  localStorage.setItem(DARK_KEY, String(val))
}

export const PAGE_BGS = Object.fromEntries(
  Object.entries(ACCENT_VARIANTS).flatMap(([id, v]) => [
    [`${id}-light`, v.light.pageBg],
    [`${id}-dark`, v.dark.pageBg],
  ])
)
