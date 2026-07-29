import type { ThemeMode } from "./ITheme"
import type { IAutoScrollControls } from "./IAutoScroll"
import type { IZoomControls } from "./IZoom"
import type { IBookmarkControls } from "./IBookmark"

export interface IToolbarProps {
  fileName: string
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  onClose: () => void
  autoScrollControls: IAutoScrollControls
  zoomControls: IZoomControls
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  translationLabel: string
  onTranslateSettings: () => void
  bookmarkControls: IBookmarkControls
  onBookmarkPanel: () => void
}
