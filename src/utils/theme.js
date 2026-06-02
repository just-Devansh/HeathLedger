const THEME_KEY = 'heath_ledger_theme'
const DARK_KEY = 'heath_ledger_dark'

const LIGHT_BASE = {
  cardBg: '#ffffff',
  inputBg: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  primaryText: '#ffffff',
  dangerColor: '#ef4444',
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
  primaryText: '#ffffff',
  dangerColor: '#ef4444',
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
  blood: {
    light: {
      pageBg: '#fff0f0',
      surface: '#fde0e0',
      primary: '#8b0000',
      accent: '#a01212',
      secondary: '#6b0000',
      gradEnd: '#b30000',
      gradientBg: 'linear-gradient(135deg, #6b0000, #8b0000, #b30000)',
      mutedText: '#f5a0a0',
      heading: '#3b0000',
      shadowRgb: '139,0,0',
      heroShadow: '0 8px 32px rgba(139,0,0,0.38), 0 0 0 1px rgba(139,0,0,0.16)',
    },
    dark: {
      pageBg: '#060000',
      surface: '#1a0505',
      primary: '#b31616',
      accent: '#cc1a1a',
      secondary: '#870d0d',
      gradEnd: '#d42828',
      gradientBg: 'linear-gradient(135deg, #5a0000, #8b0000, #b31616)',
      mutedText: 'rgba(255,210,210,0.82)',
      heading: '#fce8e8',
      shadowRgb: '179,22,22',
      heroShadow: '0 8px 32px rgba(179,22,22,0.65), 0 0 0 1px rgba(179,22,22,0.24)',
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
  { id: 'blood',  label: 'Blood',  swatch: '#8b0000' },
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

// ── Palettes ──────────────────────────────────────────────────────────────────

export const PALETTE_DEFS = [
  {
    id: 'forest',
    label: 'Forest Ledger',
    bgColor: '#102018',
    fgColor: '#E7D7B8',
    primaryText: '#0d2018',
    dangerColor: '#ef4444',
    pageBg: '#102018',
    cardBg: '#162a1f',
    inputBg: '#0d1a14',
    surface: '#1d3828',
    border: 'rgba(231,215,184,0.13)',
    text: '#E7D7B8',
    textMuted: 'rgba(231,215,184,0.62)',
    textFaint: 'rgba(231,215,184,0.36)',
    primary: '#E7D7B8',
    accent: '#DCC9A3',
    secondary: '#DCC9A3',
    gradEnd: '#F0E5CC',
    gradientBg: 'linear-gradient(135deg, #0d2018, #1a3828, #204830)',
    mutedText: 'rgba(231,215,184,0.5)',
    heading: '#EDE1C8',
    shadowRgb: '16,32,24',
    heroShadow: '0 8px 32px rgba(16,32,24,0.8), 0 0 0 1px rgba(231,215,184,0.1)',
    glassBg: 'rgba(16,32,24,0.95)',
    glassShadow: '0 10px 30px rgba(0,0,0,0.5)',
    filterBg: 'rgba(16,32,24,0.92)',
    modalBg: 'rgba(0,0,0,0.8)',
    dangerSurface: 'rgba(239,68,68,0.15)',
  },
  {
    id: 'retro',
    label: 'Retro Pop',
    bgColor: '#C63C6A',
    fgColor: '#FFD95A',
    primaryText: '#5C1530',
    dangerColor: '#3D0014',
    pageBg: '#C63C6A',
    cardBg: '#B83562',
    inputBg: '#a82d58',
    surface: '#d4456f',
    border: 'rgba(255,217,90,0.22)',
    text: '#FFD95A',
    textMuted: 'rgba(255,217,90,0.72)',
    textFaint: 'rgba(255,217,90,0.48)',
    primary: '#FFD95A',
    accent: '#FFE27A',
    secondary: '#FFE27A',
    gradEnd: '#FFF0AA',
    gradientBg: 'linear-gradient(135deg, #a01e53, #c63c6a, #d44478)',
    mutedText: 'rgba(255,217,90,0.6)',
    heading: '#FFE27A',
    shadowRgb: '198,60,106',
    heroShadow: '0 8px 32px rgba(198,60,106,0.5), 0 0 0 1px rgba(255,217,90,0.15)',
    glassBg: 'rgba(198,60,106,0.92)',
    glassShadow: '0 10px 30px rgba(0,0,0,0.35)',
    filterBg: 'rgba(184,53,98,0.95)',
    modalBg: 'rgba(0,0,0,0.75)',
    dangerSurface: 'rgba(0,0,0,0.25)',
  },
  {
    id: 'midnight',
    label: 'Midnight Signal',
    bgColor: '#0B1736',
    fgColor: '#FF8C42',
    primaryText: '#060f28',
    dangerColor: '#ef4444',
    pageBg: '#0B1736',
    cardBg: '#101f48',
    inputBg: '#081228',
    surface: '#162454',
    border: 'rgba(255,140,66,0.14)',
    text: '#FF8C42',
    textMuted: 'rgba(255,140,66,0.65)',
    textFaint: 'rgba(255,140,66,0.38)',
    primary: '#FF8C42',
    accent: '#FFA552',
    secondary: '#FFA552',
    gradEnd: '#FFB878',
    gradientBg: 'linear-gradient(135deg, #060f28, #0b1736, #10204a)',
    mutedText: 'rgba(255,140,66,0.5)',
    heading: '#FFA552',
    shadowRgb: '11,23,54',
    heroShadow: '0 8px 32px rgba(11,23,54,0.8), 0 0 0 1px rgba(255,140,66,0.12)',
    glassBg: 'rgba(11,23,54,0.95)',
    glassShadow: '0 10px 30px rgba(0,0,0,0.5)',
    filterBg: 'rgba(11,23,54,0.92)',
    modalBg: 'rgba(0,0,0,0.8)',
    dangerSurface: 'rgba(239,68,68,0.15)',
  },
  {
    id: 'industrial',
    label: 'Industrial',
    bgColor: '#1A1A1A',
    fgColor: '#C0C0C0',
    primaryText: '#111111',
    dangerColor: '#ef4444',
    pageBg: '#1A1A1A',
    cardBg: '#222222',
    inputBg: '#141414',
    surface: '#2a2a2a',
    border: 'rgba(168,168,168,0.12)',
    text: '#C0C0C0',
    textMuted: 'rgba(192,192,192,0.62)',
    textFaint: 'rgba(192,192,192,0.36)',
    primary: '#A8A8A8',
    accent: '#C0C0C0',
    secondary: '#A8A8A8',
    gradEnd: '#D8D8D8',
    gradientBg: 'linear-gradient(135deg, #111111, #1a1a1a, #252525)',
    mutedText: 'rgba(192,192,192,0.5)',
    heading: '#D0D0D0',
    shadowRgb: '26,26,26',
    heroShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,168,168,0.1)',
    glassBg: 'rgba(26,26,26,0.95)',
    glassShadow: '0 10px 30px rgba(0,0,0,0.5)',
    filterBg: 'rgba(26,26,26,0.92)',
    modalBg: 'rgba(0,0,0,0.8)',
    dangerSurface: 'rgba(239,68,68,0.15)',
  },
]

export function buildPaletteTheme(paletteId) {
  return PALETTE_DEFS.find(p => p.id === paletteId) ?? null
}

const PALETTE_KEY = 'heath_ledger_palette'

export function loadPaletteId() {
  return localStorage.getItem(PALETTE_KEY) ?? null
}

export function savePaletteId(id) {
  if (id === null) {
    localStorage.removeItem(PALETTE_KEY)
  } else {
    localStorage.setItem(PALETTE_KEY, id)
  }
}
