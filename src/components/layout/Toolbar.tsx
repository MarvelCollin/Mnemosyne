import { ThemeToggle } from "./ThemeToggle"
import { AutoScrollControls } from "@/components/pdf/AutoScrollControls"
import { ZoomControls } from "@/components/pdf/ZoomControls"
import { PageNavigation } from "@/components/pdf/PageNavigation"
import type { IToolbarProps } from "@/interfaces/IToolbar"

export function Toolbar({
  fileName,
  theme,
  onThemeChange,
  onClose,
  autoScrollControls,
  zoomControls,
  currentPage,
  totalPages,
  onPageChange,
  translationLabel,
  onTranslateSettings,
}: IToolbarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-1.5 px-2 shadow-sm sm:h-12 sm:justify-between sm:gap-0 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-sm text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Close"
        >
          ×
        </button>
        <span className="hidden max-w-[200px] truncate text-sm font-medium sm:block">{fileName}</span>
      </div>

      {totalPages > 0 && (
        <PageNavigation
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}

      <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
        <AutoScrollControls controls={autoScrollControls} />
        <div className="hidden h-4 w-px bg-border/40 sm:block" />
        <ZoomControls controls={zoomControls} />
        <div className="hidden h-4 w-px bg-border/40 sm:block" />
        <button
          onClick={onTranslateSettings}
          className="rounded-sm px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-2"
          title="Translation settings"
        >
          {translationLabel}
        </button>
        <div className="hidden h-4 w-px bg-border/40 sm:block" />
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
      </div>
    </div>
  )
}
