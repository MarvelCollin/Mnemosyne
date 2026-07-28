import type { IKeyboardShortcutsProps, IShortcut } from "@/interfaces/IKeyboardShortcuts"

const shortcuts: IShortcut[] = [
  { key: "Space", label: "Space", description: "Toggle auto-scroll" },
  { key: "Shift + ↑", label: "Shift + ↑", description: "Decrease scroll speed" },
  { key: "Shift + ↓", label: "Shift + ↓", description: "Increase scroll speed" },
  { key: "Ctrl + +", label: "Ctrl + +", description: "Zoom in" },
  { key: "Ctrl + -", label: "Ctrl + -", description: "Zoom out" },
  { key: "Ctrl + 0", label: "Ctrl + 0", description: "Reset zoom" },
  { key: "?", label: "?", description: "Toggle shortcuts" },
]

export function ShortcutsDialog({ isOpen, onClose }: IKeyboardShortcutsProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs"
      style={{ animation: "fade-in 0.15s ease-out" }}
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-lg border bg-background p-4 shadow-xl sm:mx-0 sm:p-6"
        style={{ animation: "dialog-enter 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-semibold tracking-tight">Keyboard Shortcuts</h3>
        <div className="space-y-2.5">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="rounded-sm border bg-muted/50 px-2 py-0.5 text-xs font-mono text-muted-foreground">
                {shortcut.label}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
