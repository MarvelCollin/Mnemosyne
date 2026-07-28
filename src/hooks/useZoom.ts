import { useState } from "react"
import type { IZoom, IZoomControls, ZoomMode } from "@/interfaces/IZoom"

const MIN_SCALE = 0.25
const MAX_SCALE = 3
const ZOOM_STEP = 0.25
const PDF_PAGE_WIDTH = 612

function getInitialScale(): number {
  const w = window.innerWidth
  if (w < 640) {
    return Math.max(MIN_SCALE, Math.round(((w - 24) / PDF_PAGE_WIDTH) * 100) / 100)
  }
  return 1
}

export function useZoom(): IZoomControls {
  const [zoom, setZoom] = useState<IZoom>({
    mode: "custom",
    scale: getInitialScale(),
  })

  const zoomIn = () => {
    setZoom((prev) => ({
      mode: "custom",
      scale: Math.min(MAX_SCALE, prev.scale + ZOOM_STEP),
    }))
  }

  const zoomOut = () => {
    setZoom((prev) => ({
      mode: "custom",
      scale: Math.max(MIN_SCALE, prev.scale - ZOOM_STEP),
    }))
  }

  const setScale = (scale: number) => {
    setZoom({
      mode: "custom",
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)),
    })
  }

  const setMode = (mode: ZoomMode) => {
    setZoom((prev) => ({ ...prev, mode }))
  }

  return { zoom, zoomIn, zoomOut, setScale, setMode }
}
