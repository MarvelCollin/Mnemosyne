import { memo } from "react"
import { Page } from "react-pdf"
import type { IPdfPageProps } from "@/interfaces/IPdfPage"

export const PdfPage = memo(function PdfPage({ pageNumber, scale, onRenderSuccess }: IPdfPageProps) {
  return (
    <Page
      pageNumber={pageNumber}
      scale={scale}
      renderTextLayer={true}
      renderAnnotationLayer={true}
      onRenderSuccess={onRenderSuccess}
    />
  )
})
