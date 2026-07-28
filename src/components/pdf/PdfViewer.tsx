import { useState } from "react"
import { Document } from "react-pdf"
import { PdfPage } from "./PdfPage"
import type { IPdfViewerProps } from "@/Interface/IPdfViewer"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

export function PdfViewer({ file, onDocumentLoaded, containerRef }: IPdfViewerProps) {
  const [totalPages, setTotalPages] = useState(0)

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages)
    onDocumentLoaded(numPages)
  }

  return (
    <div ref={containerRef} className="flex flex-1 flex-col items-center overflow-y-auto py-8">
      <Document
        file={file}
        onLoadSuccess={onLoadSuccess}
        className="flex flex-col items-center gap-4"
      >
        {Array.from({ length: totalPages }, (_, i) => (
          <PdfPage key={i + 1} pageNumber={i + 1} width={800} />
        ))}
      </Document>
    </div>
  )
}
