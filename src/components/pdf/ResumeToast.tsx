import { useState, useEffect } from "react"

interface ResumeToastProps {
  savedPage: number | null
  totalPages: number
  onGoToPage: (page: number) => void
}

export function ResumeToast({ savedPage, totalPages, onGoToPage }: ResumeToastProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!savedPage || savedPage <= 1 || totalPages === 0 || dismissed) return
    const showTimer = setTimeout(() => setVisible(true), 600)
    const hideTimer = setTimeout(() => setVisible(false), 8000)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [savedPage, totalPages, dismissed])

  if (!visible || !savedPage || savedPage <= 1) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      style={{ animation: "dialog-enter 0.2s ease-out" }}
    >
      <div className="flex items-center gap-3 rounded-lg border bg-popover px-4 py-2.5 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
        <span className="text-sm">
          Last read: page <span className="font-semibold">{savedPage}</span>
          <span className="text-muted-foreground"> of {totalPages}</span>
        </span>
        <button
          onClick={() => {
            onGoToPage(savedPage)
            setVisible(false)
            setDismissed(true)
          }}
          className="rounded-sm bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go
        </button>
        <button
          onClick={() => {
            setVisible(false)
            setDismissed(true)
          }}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
