import { useEffect } from "react"
import type { IAutoScrollControls } from "@/interfaces/IAutoScroll"
import type { IZoomControls } from "@/interfaces/IZoom"

interface ShortcutHandlers {
  autoScroll: IAutoScrollControls
  zoom: IZoomControls
  onToggleHelp: () => void
  onToggleView: () => void
}

export function useKeyboardShortcuts({ autoScroll, zoom, onToggleHelp, onToggleView }: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case " ":
          e.preventDefault()
          autoScroll.toggle()
          break
        case "ArrowUp":
          if (e.shiftKey) {
            e.preventDefault()
            autoScroll.decreaseSpeed()
          }
          break
        case "ArrowDown":
          if (e.shiftKey) {
            e.preventDefault()
            autoScroll.increaseSpeed()
          }
          break
        case "+":
        case "=":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoom.zoomIn()
          }
          break
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoom.zoomOut()
          }
          break
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoom.setScale(1)
          }
          break
        case "d":
        case "D":
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault()
            onToggleView()
          }
          break
        case "?":
          e.preventDefault()
          onToggleHelp()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [autoScroll, zoom, onToggleHelp, onToggleView])
}
