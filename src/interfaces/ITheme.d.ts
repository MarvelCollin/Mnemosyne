export type ThemeMode = "light" | "dark" | "sepia"

export interface IThemeContext {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}
