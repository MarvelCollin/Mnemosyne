import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./ThemeToggle"
import type { ThemeMode } from "@/Interface/ITheme"

interface ToolbarProps {
  fileName: string
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  onClose: () => void
}

export function Toolbar({ fileName, theme, onThemeChange, onClose }: ToolbarProps) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <span className="max-w-[200px] truncate text-sm font-medium">{fileName}</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
        <div className="mx-1 h-5 w-px bg-border" />
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
