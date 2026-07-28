export interface IPdfPageProps {
  pageNumber: number
  scale: number
  pdfDoc?: any
  onRenderSuccess?: () => void
}
