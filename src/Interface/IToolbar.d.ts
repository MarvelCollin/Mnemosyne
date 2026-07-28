import type { ThemeMode } from "./ITheme"
import type { IAutoScrollControls } from "./IAutoScroll"

export interface IToolbarProps {
  fileName: string
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  onClose: () => void
  autoScrollControls: IAutoScrollControls
}
