import { createContext, useContext, useState } from 'react'
import { THEMES, loadThemeName, saveThemeName } from '../utils/theme'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState(() => loadThemeName())

  function setTheme(name) {
    saveThemeName(name)
    setThemeNameState(name)
  }

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeName], themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
