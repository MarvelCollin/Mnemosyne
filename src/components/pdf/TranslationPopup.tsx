import type { ITranslationState } from "@/interfaces/ITranslation"

interface TranslationPopupProps {
  state: ITranslationState
  onSave: () => void
}

export function TranslationPopup({ state, onSave }: TranslationPopupProps) {
  const { text, translation, isLoading, position, alreadySaved } = state

  const handleSave = () => {
    if (alreadySaved || isLoading || !translation) return
    onSave()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    handleSave()
  }

  const showAbove = position.y > 120
  const maxW = Math.min(280, window.innerWidth - 32)

  const style: React.CSSProperties = {
    left: Math.max(maxW / 2 + 8, Math.min(position.x, window.innerWidth - maxW / 2 - 8)),
    top: showAbove ? position.y - 8 : position.y + 20,
    transform: showAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
    maxWidth: `${maxW}px`,
    animation: "dialog-enter 0.12s ease-out",
  }

  return (
    <div
      data-translation-popup
      onContextMenu={handleContextMenu}
      className="fixed z-50 rounded-md border bg-popover px-3 py-2 shadow-lg"
      style={style}
    >
      <p className="text-xs text-muted-foreground">{text}</p>
      {isLoading ? (
        <p className="mt-1 text-sm text-muted-foreground">Translating...</p>
      ) : (
        <>
          <p className="mt-1 text-sm font-medium text-foreground">{translation}</p>
          <button
            onClick={handleSave}
            className={`mt-1.5 text-xs transition-colors ${
              alreadySaved ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {alreadySaved ? "Saved" : "Save"}
          </button>
        </>
      )}
    </div>
  )
}
