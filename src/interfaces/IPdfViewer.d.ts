import type { IZoom } from "./IZoom"

export interface IPdfViewerProps {
  file: File
  zoom: IZoom
  onDocumentLoaded: (totalPages: number) => void
  onPageChange: (page: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  goToPage: number | null
  onReady: () => void
}
