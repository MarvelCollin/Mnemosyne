export interface IShortcut {
  key: string
  label: string
  description: string
}

export interface IKeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}
