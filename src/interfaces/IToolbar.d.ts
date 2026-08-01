import type { ThemeMode } from "./ITheme"
import type { IAutoScrollControls } from "./IAutoScroll"
import type { IZoomControls } from "./IZoom"

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
  isDual: boolean
  onToggleView: () => void
  secondaryPage: number
  onSecondaryPageChange: (page: number) => void
}
