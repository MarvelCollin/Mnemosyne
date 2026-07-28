import { memo, useState, useEffect } from "react"
import { Page, pdfjs } from "react-pdf"
import type { IPdfPageProps } from "@/interfaces/IPdfPage"

const IMAGE_OPS = new Set([
  pdfjs.OPS.paintImageXObject,
  pdfjs.OPS.paintImageXObjectRepeat,
  pdfjs.OPS.paintInlineImageXObject,
  pdfjs.OPS.paintInlineImageXObjectGroup,
])

async function pageHasImages(pdfDoc: any, pageNumber: number): Promise<boolean> {
  const page = await pdfDoc.getPage(pageNumber)
  const ops = await page.getOperatorList()
  return ops.fnArray.some((fn: number) => IMAGE_OPS.has(fn))
}

export const PdfPage = memo(function PdfPage({
  pageNumber,
  scale,
  pdfDoc,
  onRenderSuccess,
}: IPdfPageProps) {
  const [hasImages, setHasImages] = useState(false)

  useEffect(() => {
    if (!pdfDoc) return
    let cancelled = false
    pageHasImages(pdfDoc, pageNumber).then((result) => {
      if (!cancelled) setHasImages(result)
    })
    return () => { cancelled = true }
  }, [pdfDoc, pageNumber])

  return (
    <div data-has-images={hasImages || undefined}>
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        onRenderSuccess={onRenderSuccess}
      />
    </div>
  )
})
