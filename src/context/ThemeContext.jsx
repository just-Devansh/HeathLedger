import { createContext, useContext, useState, useEffect } from 'react'
import {
  buildTheme, loadThemeName, saveThemeName, loadDarkMode, saveDarkMode,
  buildPaletteTheme, loadPaletteId, savePaletteId,
} from '../utils/theme'
import { db } from '../utils/db'
import { loadPalette, savePalette } from '../utils/storage'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState(() => loadThemeName())
  const [isDark, setIsDarkState]       = useState(() => loadDarkMode())
  const [paletteId, setPaletteIdState] = useState(() => loadPaletteId())

  const paletteTheme = paletteId ? buildPaletteTheme(paletteId) : null
  const theme = paletteTheme ?? buildTheme(themeName, isDark)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--card-bg',       theme.cardBg)
    root.style.setProperty('--input-bg',      theme.inputBg)
    root.style.setProperty('--border',        theme.border)
    root.style.setProperty('--text',          theme.text)
    root.style.setProperty('--text-muted',    theme.textMuted)
    root.style.setProperty('--danger-surface',theme.dangerSurface)
    document.body.style.background = theme.pageBg
  }, [theme])

  // Sync palette from DB on mount in case localStorage diverged
  useEffect(() => {
    loadPalette().then(p => {
      if (p !== paletteId) setPaletteIdState(p)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setTheme(name) {
    saveThemeName(name)
    setThemeNameState(name)
    db.settings.put({ key: 'theme', value: name }).catch(() => {})
  }

  function toggleDark() {
    const next = !isDark
    saveDarkMode(next)
    setIsDarkState(next)
    db.settings.put({ key: 'darkMode', value: String(next) }).catch(() => {})
  }

  function setDark(val) {
    saveDarkMode(val)
    setIsDarkState(val)
    db.settings.put({ key: 'darkMode', value: String(val) }).catch(() => {})
  }

  function setPalette(id) {
    setPaletteIdState(id)
    savePaletteId(id)
    savePalette(id).catch(() => {})
  }

  function clearPalette() {
    setPalette(null)
  }

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, isDark, toggleDark, setDark, paletteId, setPalette, clearPalette }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
