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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold">Keyboard Shortcuts</h3>
        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="rounded border bg-muted px-2 py-1 text-xs font-mono">
                {shortcut.label}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
