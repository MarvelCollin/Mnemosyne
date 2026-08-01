import { useState, useCallback } from "react"
import type { IViewModeControls, ViewMode } from "@/interfaces/IViewMode"

export function useViewMode(): IViewModeControls {
  const [mode, setMode] = useState<ViewMode>("single")

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "single" ? "dual" : "single"))
  }, [])

  return { mode, isDual: mode === "dual", toggle }
}
