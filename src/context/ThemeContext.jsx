import { createContext, useContext, useState, useEffect } from 'react'
import { buildTheme, loadThemeName, saveThemeName, loadDarkMode, saveDarkMode } from '../utils/theme'
import { db } from '../utils/db'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState(() => loadThemeName())
  const [isDark, setIsDarkState]       = useState(() => loadDarkMode())

  const theme = buildTheme(themeName, isDark)

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

  function setTheme(name) {
    saveThemeName(name)         // localStorage — keeps flash-prevention script current
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

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, isDark, toggleDark, setDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
