import { Page } from "react-pdf"
import type { IPdfPageProps } from "@/Interface/IPdfPage"

export function PdfPage({ pageNumber, width }: IPdfPageProps) {
  return (
    <Page
      pageNumber={pageNumber}
      width={width}
      renderTextLayer={true}
      renderAnnotationLayer={true}
    />
  )
}
