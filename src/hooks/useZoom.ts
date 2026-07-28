import { useState } from "react"
import type { IZoom, IZoomControls, ZoomMode } from "@/Interface/IZoom"

const MIN_SCALE = 0.25
const MAX_SCALE = 3
const ZOOM_STEP = 0.25

export function useZoom(): IZoomControls {
  const [zoom, setZoom] = useState<IZoom>({
    mode: "custom",
    scale: 1,
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
