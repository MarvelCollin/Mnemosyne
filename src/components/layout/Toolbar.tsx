import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
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
}: IToolbarProps) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <span className="max-w-[200px] truncate text-sm font-medium">{fileName}</span>
        {totalPages > 0 && (
          <>
            <div className="mx-1 h-5 w-px bg-border" />
            <PageNavigation
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <AutoScrollControls controls={autoScrollControls} />
        <div className="mx-1 h-5 w-px bg-border" />
        <ZoomControls controls={zoomControls} />
        <div className="mx-1 h-5 w-px bg-border" />
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
        <div className="mx-1 h-5 w-px bg-border" />
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
