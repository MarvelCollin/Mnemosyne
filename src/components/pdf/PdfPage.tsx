import { memo, useRef, useCallback, useState, useEffect } from "react"
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
  theme,
  pdfDoc,
  onRenderSuccess,
}: IPdfPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const canvasRendered = useRef(false)
  const [hasImages, setHasImages] = useState(false)
  const retryTimers = useRef<number[]>([])

  const copyPixels = useCallback(() => {
    if (!wrapperRef.current || !overlayRef.current) return false
    const mainCanvas = wrapperRef.current.querySelector<HTMLCanvasElement>(
      ".react-pdf__Page canvas"
    )
    if (!mainCanvas || mainCanvas.width === 0) return false
    const mainCtx = mainCanvas.getContext("2d", { willReadFrequently: true })
    if (!mainCtx) return false

    const oc = overlayRef.current
    oc.width = mainCanvas.width
    oc.height = mainCanvas.height
    const ctx = oc.getContext("2d")
    if (!ctx) return false

    try {
      const imgData = mainCtx.getImageData(0, 0, mainCanvas.width, mainCanvas.height)
      const nonZero = imgData.data.some((v) => v !== 0)
      if (!nonZero) return false
      ctx.putImageData(imgData, 0, 0)
      return true
    } catch {
      return false
    }
  }, [])

  const scheduleCopy = useCallback(() => {
    retryTimers.current.forEach(clearTimeout)
    retryTimers.current = []

    const tryNow = () => {
      requestAnimationFrame(() => {
        if (!copyPixels()) {
          const t1 = window.setTimeout(() => requestAnimationFrame(() => {
            if (!copyPixels()) {
              const t2 = window.setTimeout(() => requestAnimationFrame(copyPixels), 500)
              retryTimers.current.push(t2)
            }
          }), 150)
          retryTimers.current.push(t1)
        }
      })
    }
    tryNow()
  }, [copyPixels])

  const handleRenderSuccess = useCallback(() => {
    canvasRendered.current = true
    onRenderSuccess?.()
    if (hasImages) scheduleCopy()
  }, [onRenderSuccess, hasImages, scheduleCopy])

  useEffect(() => {
    if (theme !== "dark" || !pdfDoc) {
      setHasImages(false)
      return
    }
    let cancelled = false
    pageHasImages(pdfDoc, pageNumber).then((result) => {
      if (!cancelled) setHasImages(result)
    })
    return () => { cancelled = true }
  }, [theme, pdfDoc, pageNumber])

  useEffect(() => {
    if (hasImages && canvasRendered.current) scheduleCopy()
  }, [hasImages, scheduleCopy])

  useEffect(() => {
    return () => retryTimers.current.forEach(clearTimeout)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        onRenderSuccess={handleRenderSuccess}
      />
      {hasImages && (
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute left-0 top-0 z-[1]"
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  )
})
