import type { IBookmarkControls } from "@/interfaces/IBookmark"

interface BookmarkPanelProps {
  isOpen: boolean
  onClose: () => void
  controls: IBookmarkControls
  currentPage: number
  onGoToPage: (page: number) => void
}

export function BookmarkPanel({ isOpen, onClose, controls, currentPage, onGoToPage }: BookmarkPanelProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute inset-x-3 top-12 max-h-[70vh] overflow-y-auto rounded-md border bg-popover p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:top-14 sm:w-72"
        style={{ animation: "dialog-enter 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold tracking-tight">Bookmarks</h4>
          <button
            onClick={() => controls.toggle(currentPage)}
            className="rounded-sm px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            {controls.isBookmarked(currentPage) ? "Remove current" : "Add page " + currentPage}
          </button>
        </div>

        {controls.bookmarks.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No bookmarks yet</p>
        ) : (
          <div className="mt-3 space-y-1">
            {controls.bookmarks.map((bookmark, i) => (
              <div
                key={bookmark.page}
                className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-muted ${bookmark.page === currentPage ? "bg-muted font-medium" : ""}`}
                onClick={() => onGoToPage(bookmark.page)}
              >
                <span className="truncate">{bookmark.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    controls.remove(i)
                  }}
                  className="ml-2 shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="border-t pt-2">
              <button
                onClick={controls.clear}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
