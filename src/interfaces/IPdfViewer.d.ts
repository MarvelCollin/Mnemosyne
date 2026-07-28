import type { IZoom } from "./IZoom"
import type { ThemeMode } from "./ITheme"

export interface IPdfViewerProps {
  file: File
  zoom: IZoom
  theme: ThemeMode
  onDocumentLoaded: (totalPages: number) => void
  onPageChange: (page: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  goToPage: number | null
  onReady: () => void
}
