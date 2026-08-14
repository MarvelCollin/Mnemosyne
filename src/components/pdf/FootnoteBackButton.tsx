import { CornerUpLeft } from "lucide-react"
import type { IReturnPoint } from "@/interfaces/IFootnoteReturn"

interface FootnoteBackButtonProps {
  returnPoint: IReturnPoint | null
  onGoBack: () => void
}

export function FootnoteBackButton({ returnPoint, onGoBack }: FootnoteBackButtonProps) {
  if (!returnPoint) return null

  return (
    <button
      onClick={onGoBack}
      title="Back to where you were reading (Alt + ←)"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border bg-popover px-4 py-2 text-sm shadow-lg transition-colors hover:bg-muted"
      style={{ animation: "dialog-enter 0.15s ease-out" }}
    >
      <CornerUpLeft className="size-4 text-primary" />
      Back to page {returnPoint.page}
    </button>
  )
}
