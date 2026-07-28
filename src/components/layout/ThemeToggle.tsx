import type { ThemeMode } from "@/interfaces/ITheme"

const themes: { mode: ThemeMode; label: string; short: string }[] = [
  { mode: "light", label: "Light", short: "L" },
  { mode: "dark", label: "Dark", short: "D" },
  { mode: "sepia", label: "Sepia", short: "S" },
]

interface ThemeToggleProps {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-md bg-muted/60 p-0.5">
      {themes.map(({ mode, label, short }) => (
        <button
          key={mode}
          onClick={() => onThemeChange(mode)}
          className={`rounded-sm px-1.5 py-1 text-xs font-medium transition-colors sm:px-2.5 ${
            theme === mode
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="sm:hidden">{short}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
