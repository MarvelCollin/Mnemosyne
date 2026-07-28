import { useState, useEffect } from "react"
import type { ThemeMode } from "@/interfaces/ITheme"

const STORAGE_KEY = "mnemosyne-theme"

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (stored) return stored
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark"
    return "light"
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark", "sepia")
    root.classList.add(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  return { theme, setTheme }
}
