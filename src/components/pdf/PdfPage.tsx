import { Page } from "react-pdf"
import type { IPdfPageProps } from "@/Interface/IPdfPage"

export function PdfPage({ pageNumber, scale }: IPdfPageProps) {
  return (
    <Page
      pageNumber={pageNumber}
      scale={scale}
      renderTextLayer={true}
      renderAnnotationLayer={true}
    />
  )
}
