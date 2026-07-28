import type { ThemeMode } from "./ITheme"

export interface IPdfPageProps {
  pageNumber: number
  scale: number
  theme: ThemeMode
  pdfDoc?: any
  onRenderSuccess?: () => void
}
