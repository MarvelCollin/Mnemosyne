import { useState, useEffect, useCallback } from "react"

export function useReadingProgress(containerRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    const maxScroll = scrollHeight - clientHeight
    if (maxScroll <= 0) {
      setProgress(0)
      return
    }
    setProgress((scrollTop / maxScroll) * 100)
  }, [containerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [containerRef, handleScroll])

  return progress
}
