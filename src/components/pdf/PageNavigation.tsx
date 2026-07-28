import { useState, useEffect } from "react"
import type { IPageNavigationProps } from "@/interfaces/IPageNavigation"

export function PageNavigation({ currentPage, totalPages, onPageChange }: IPageNavigationProps) {
  const [inputValue, setInputValue] = useState(String(currentPage))
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(currentPage))
    }
  }, [currentPage, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(inputValue, 10)
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
    } else {
      setInputValue(String(currentPage))
    }
    setIsEditing(false)
  }

  const handleBlur = () => {
    setInputValue(String(currentPage))
    setIsEditing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 text-sm tabular-nums">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        className="h-6 w-8 rounded-sm bg-transparent text-center text-sm transition-colors focus:bg-muted focus:outline-none"
      />
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{totalPages}</span>
    </form>
  )
}
