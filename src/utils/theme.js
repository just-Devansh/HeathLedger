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
      heroShadow: '0 8px 32px rgba(79,70,229,0.35), 0 0 0 1px rgba(79,70,229,0.14)',
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
      heroShadow: '0 8px 32px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.18)',
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
      heroShadow: '0 8px 32px rgba(22,163,74,0.3), 0 0 0 1px rgba(22,163,74,0.14)',
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
      heroShadow: '0 8px 32px rgba(34,197,94,0.4), 0 0 0 1px rgba(34,197,94,0.16)',
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
      heroShadow: '0 8px 32px rgba(15,23,42,0.28), 0 0 0 1px rgba(15,23,42,0.12)',
    },
    dark: {
      pageBg: '#050505',
      surface: '#1d1d1d',
      primary: '#94a3b8',
      accent: '#cbd5e1',
      secondary: '#64748b',
      gradEnd: '#e2e8f0',
      gradientBg: 'linear-gradient(135deg, #111111, #1a1a1a, #212121)',
      mutedText: 'rgba(255,255,255,0.55)',
      heading: '#f1f5f9',
      shadowRgb: '148,163,184',
      heroShadow: '0 8px 32px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)',
    },
  },
  red: {
    light: {
      pageBg: '#fff1f2',
      surface: '#ffe4e6',
      primary: '#e11d48',
      accent: '#f43f5e',
      secondary: '#be123c',
      gradEnd: '#fb7185',
      gradientBg: 'linear-gradient(135deg, #be123c, #e11d48, #f43f5e)',
      mutedText: '#fecdd3',
      heading: '#4c0519',
      shadowRgb: '225,29,72',
      heroShadow: '0 8px 32px rgba(225,29,72,0.32), 0 0 0 1px rgba(225,29,72,0.14)',
    },
    dark: {
      pageBg: '#050505',
      surface: '#1d1d1d',
      primary: '#f43f5e',
      accent: '#fb7185',
      secondary: '#e11d48',
      gradEnd: '#fda4af',
      gradientBg: 'linear-gradient(135deg, #be123c, #e11d48, #f43f5e)',
      mutedText: '#fecdd3',
      heading: '#fff1f2',
      shadowRgb: '244,63,94',
      heroShadow: '0 8px 32px rgba(244,63,94,0.48), 0 0 0 1px rgba(244,63,94,0.18)',
    },
  },
  pink: {
    light: {
      pageBg: '#fdf2f8',
      surface: '#fce7f3',
      primary: '#db2777',
      accent: '#ec4899',
      secondary: '#be185d',
      gradEnd: '#f472b6',
      gradientBg: 'linear-gradient(135deg, #be185d, #db2777, #ec4899)',
      mutedText: '#fbcfe8',
      heading: '#500724',
      shadowRgb: '219,39,119',
      heroShadow: '0 8px 32px rgba(219,39,119,0.3), 0 0 0 1px rgba(219,39,119,0.14)',
    },
    dark: {
      pageBg: '#050505',
      surface: '#1d1d1d',
      primary: '#ec4899',
      accent: '#f472b6',
      secondary: '#db2777',
      gradEnd: '#f9a8d4',
      gradientBg: 'linear-gradient(135deg, #be185d, #db2777, #ec4899)',
      mutedText: '#fbcfe8',
      heading: '#fdf2f8',
      shadowRgb: '236,72,153',
      heroShadow: '0 8px 32px rgba(236,72,153,0.48), 0 0 0 1px rgba(236,72,153,0.18)',
    },
  },
  orange: {
    light: {
      pageBg: '#fff7ed',
      surface: '#ffedd5',
      primary: '#ea580c',
      accent: '#f97316',
      secondary: '#c2410c',
      gradEnd: '#fb923c',
      gradientBg: 'linear-gradient(135deg, #c2410c, #ea580c, #f97316)',
      mutedText: '#fed7aa',
      heading: '#431407',
      shadowRgb: '234,88,12',
      heroShadow: '0 8px 32px rgba(234,88,12,0.3), 0 0 0 1px rgba(234,88,12,0.14)',
    },
    dark: {
      pageBg: '#050505',
      surface: '#1d1d1d',
      primary: '#f97316',
      accent: '#fb923c',
      secondary: '#ea580c',
      gradEnd: '#fdba74',
      gradientBg: 'linear-gradient(135deg, #c2410c, #ea580c, #f97316)',
      mutedText: '#fed7aa',
      heading: '#fff7ed',
      shadowRgb: '249,115,22',
      heroShadow: '0 8px 32px rgba(249,115,22,0.48), 0 0 0 1px rgba(249,115,22,0.18)',
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
  { id: 'blue',   label: 'Blue',   swatch: '#4f46e5' },
  { id: 'green',  label: 'Green',  swatch: '#16a34a' },
  { id: 'black',  label: 'Black',  swatch: '#0f172a' },
  { id: 'red',    label: 'Red',    swatch: '#e11d48' },
  { id: 'pink',   label: 'Pink',   swatch: '#db2777' },
  { id: 'orange', label: 'Orange', swatch: '#ea580c' },
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
