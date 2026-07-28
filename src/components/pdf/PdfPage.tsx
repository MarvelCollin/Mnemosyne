import { memo, useRef, useCallback, useState, useEffect } from "react"
import { Page, pdfjs } from "react-pdf"
import type { IPdfPageProps } from "@/interfaces/IPdfPage"

const IMAGE_OPS = new Set([
  pdfjs.OPS.paintImageXObject,
  pdfjs.OPS.paintImageXObjectRepeat,
  pdfjs.OPS.paintInlineImageXObject,
  pdfjs.OPS.paintInlineImageXObjectGroup,
])

interface Rect { x: number; y: number; w: number; h: number }

function mulMat(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ]
}

async function getImageRects(
  pdfDoc: any,
  pageNumber: number,
  canvasW: number,
  canvasH: number,
): Promise<Rect[]> {
  const page = await pdfDoc.getPage(pageNumber)
  const unitVp = page.getViewport({ scale: 1 })
  const vp = page.getViewport({ scale: canvasW / unitVp.width })
  const ops = await page.getOperatorList()

  const rects: Rect[] = []
  let ctm = [...vp.transform]
  const stack: number[][] = []

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i]
    if (fn === pdfjs.OPS.save) {
      stack.push([...ctm])
    } else if (fn === pdfjs.OPS.restore) {
      ctm = stack.pop() || [...vp.transform]
    } else if (fn === pdfjs.OPS.transform) {
      ctm = mulMat(ctm, ops.argsArray[i] as number[])
    } else if (IMAGE_OPS.has(fn)) {
      const [a, b, c, d, e, f] = ctm
      const corners = [[e, f], [a + e, b + f], [c + e, d + f], [a + c + e, b + d + f]]
      const xs = corners.map(p => p[0])
      const ys = corners.map(p => p[1])
      const x1 = Math.max(0, Math.floor(Math.min(...xs)))
      const y1 = Math.max(0, Math.floor(Math.min(...ys)))
      const x2 = Math.min(canvasW, Math.ceil(Math.max(...xs)))
      const y2 = Math.min(canvasH, Math.ceil(Math.max(...ys)))
      if (x2 > x1 && y2 > y1) {
        rects.push({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 })
      }
    }
  }
  return rects
}

export const PdfPage = memo(function PdfPage({
  pageNumber,
  scale,
  pdfDoc,
  onRenderSuccess,
}: IPdfPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [hasImages, setHasImages] = useState(false)
  const retryTimers = useRef<number[]>([])

  useEffect(() => {
    if (!pdfDoc) return
    let cancelled = false
    pdfDoc.getPage(pageNumber).then((page: any) =>
      page.getOperatorList()
    ).then((ops: any) => {
      if (!cancelled) {
        setHasImages(ops.fnArray.some((fn: number) => IMAGE_OPS.has(fn)))
      }
    })
    return () => { cancelled = true }
  }, [pdfDoc, pageNumber])

  const copyImageRegions = useCallback(async (): Promise<boolean> => {
    if (!wrapperRef.current || !overlayRef.current || !pdfDoc) return false
    const mainCanvas = wrapperRef.current.querySelector<HTMLCanvasElement>(
      ".react-pdf__Page canvas",
    )
    if (!mainCanvas || mainCanvas.width === 0) return false

    const mainCtx = mainCanvas.getContext("2d", { willReadFrequently: true })
    if (!mainCtx) return false

    const sample = mainCtx.getImageData(0, 0, Math.min(10, mainCanvas.width), 1)
    if (sample.data.every(v => v === 0)) return false

    const rects = await getImageRects(pdfDoc, pageNumber, mainCanvas.width, mainCanvas.height)
    if (rects.length === 0 || !overlayRef.current) return false

    const oc = overlayRef.current
    oc.width = mainCanvas.width
    oc.height = mainCanvas.height
    const ctx = oc.getContext("2d")
    if (!ctx) return false
    ctx.clearRect(0, 0, oc.width, oc.height)

    for (const r of rects) {
      try {
        const imgData = mainCtx.getImageData(r.x, r.y, r.w, r.h)
        ctx.putImageData(imgData, r.x, r.y)
      } catch { /* cross-origin */ }
    }
    return true
  }, [pdfDoc, pageNumber])

  const scheduleCopy = useCallback(() => {
    retryTimers.current.forEach(clearTimeout)
    retryTimers.current = []

    let attempts = 0
    const tryOnce = () => {
      requestAnimationFrame(() => {
        copyImageRegions().then(ok => {
          if (!ok && attempts < 3) {
            attempts++
            const t = window.setTimeout(tryOnce, 150)
            retryTimers.current.push(t)
          }
        })
      })
    }
    tryOnce()
  }, [copyImageRegions])

  const handleRenderSuccess = useCallback(() => {
    onRenderSuccess?.()
    if (hasImages) scheduleCopy()
  }, [onRenderSuccess, hasImages, scheduleCopy])

  useEffect(() => {
    if (hasImages) scheduleCopy()
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
