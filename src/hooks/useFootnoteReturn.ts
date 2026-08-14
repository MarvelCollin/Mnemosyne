import { useState, useEffect, useCallback, useRef } from "react"
import type { IReturnPoint } from "@/interfaces/IFootnoteReturn"

export function useFootnoteReturn(
  containerRef: React.RefObject<HTMLElement | null>,
  currentPage: number,
  resetKey: unknown
) {
  const [stack, setStack] = useState<IReturnPoint[]>([])
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage
  const stackRef = useRef(stack)
  stackRef.current = stack

  useEffect(() => {
    setStack([])
  }, [resetKey])

  const push = useCallback(
    (targetPage: number) => {
      const container = containerRef.current
      if (!container) return
      const from = currentPageRef.current
      if (targetPage === from) return
      setStack((prev) => [...prev, { scrollTop: container.scrollTop, page: from }])
    },
    [containerRef]
  )

  const goBack = useCallback(() => {
    const point = stackRef.current[stackRef.current.length - 1]
    if (!point) return
    containerRef.current?.scrollTo({ top: point.scrollTop, behavior: "smooth" })
    setStack((prev) => prev.slice(0, -1))
  }, [containerRef])

  return {
    returnPoint: stack.length > 0 ? stack[stack.length - 1] : null,
    push,
    goBack,
  }
}
