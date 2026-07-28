import { Sun, Moon, Glasses } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ThemeMode } from "@/interfaces/ITheme"

const themes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: "light", icon: Sun, label: "Light" },
  { mode: "dark", icon: Moon, label: "Dark" },
  { mode: "sepia", icon: Glasses, label: "Sepia" },
]

interface ThemeToggleProps {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  return (
    <div className="flex items-center gap-1">
      {themes.map(({ mode, icon: Icon, label }) => (
        <Button
          key={mode}
          variant={theme === mode ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onThemeChange(mode)}
          title={label}
        >
          <Icon className="size-4" />
        </Button>
      ))}
    </div>
  )
}
