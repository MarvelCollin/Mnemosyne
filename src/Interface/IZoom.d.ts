export type ZoomMode = "fit-width" | "fit-page" | "custom"

export interface IZoom {
  mode: ZoomMode
  scale: number
}

export interface IZoomControls {
  zoom: IZoom
  zoomIn: () => void
  zoomOut: () => void
  setScale: (scale: number) => void
  setMode: (mode: ZoomMode) => void
}
