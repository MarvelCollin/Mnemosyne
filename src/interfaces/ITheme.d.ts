export type ThemeMode = "light" | "dark"

export interface IThemeContext {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}
