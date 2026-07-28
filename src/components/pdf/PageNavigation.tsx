import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IPageNavigationProps } from "@/interfaces/IPageNavigation"

export function PageNavigation({ currentPage, totalPages, onPageChange }: IPageNavigationProps) {
  const [inputValue, setInputValue] = useState(String(currentPage))

  const goToPrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const goToNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(inputValue, 10)
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
    } else {
      setInputValue(String(currentPage))
    }
  }

  const handleBlur = () => {
    setInputValue(String(currentPage))
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={goToPrev} disabled={currentPage <= 1}>
        <ChevronUp className="size-4" />
      </Button>
      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          className="h-6 w-10 rounded border bg-transparent text-center text-xs"
        />
        <span className="text-xs text-muted-foreground">/ {totalPages}</span>
      </form>
      <Button variant="ghost" size="icon-sm" onClick={goToNext} disabled={currentPage >= totalPages}>
        <ChevronDown className="size-4" />
      </Button>
    </div>
  )
}
