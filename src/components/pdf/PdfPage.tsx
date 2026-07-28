import { memo, useRef, useCallback, useState, useEffect } from "react"
import { Page, pdfjs } from "react-pdf"
import type { IPdfPageProps } from "@/interfaces/IPdfPage"

interface ImageRegion {
  x: number
  y: number
  width: number
  height: number
}

function multiplyMatrices(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ]
}

const IMAGE_OPS = new Set([
  pdfjs.OPS.paintImageXObject,
  pdfjs.OPS.paintImageXObjectRepeat,
  pdfjs.OPS.paintXObject,
])

async function getImageRegions(
  pdfDoc: any,
  pageNumber: number,
  scale: number
): Promise<ImageRegion[]> {
  const page = await pdfDoc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const ops = await page.getOperatorList()

  const regions: ImageRegion[] = []
  const stack: number[][] = []
  let ctm = [...viewport.transform]

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i]
    if (fn === pdfjs.OPS.save) {
      stack.push([...ctm])
    } else if (fn === pdfjs.OPS.restore) {
      ctm = stack.pop() || [...viewport.transform]
    } else if (fn === pdfjs.OPS.transform) {
      ctm = multiplyMatrices(ctm, ops.argsArray[i] as number[])
    } else if (IMAGE_OPS.has(fn)) {
      const corners = [
        [ctm[4], ctm[5]],
        [ctm[0] + ctm[4], ctm[1] + ctm[5]],
        [ctm[2] + ctm[4], ctm[3] + ctm[5]],
        [ctm[0] + ctm[2] + ctm[4], ctm[1] + ctm[3] + ctm[5]],
      ]
      const xs = corners.map((c) => c[0])
      const ys = corners.map((c) => c[1])
      const x = Math.max(0, Math.min(...xs))
      const y = Math.max(0, Math.min(...ys))
      const w = Math.min(viewport.width, Math.max(...xs)) - x
      const h = Math.min(viewport.height, Math.max(...ys)) - y
      if (w > 10 && h > 10) regions.push({ x, y, width: w, height: h })
    }
  }

  return regions
}

export const PdfPage = memo(function PdfPage({
  pageNumber,
  scale,
  theme,
  pdfDoc,
  onRenderSuccess,
}: IPdfPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [overlays, setOverlays] = useState<ImageRegion[]>([])
  const overlayRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const canvasRendered = useRef(false)

  const retryTimers = useRef<number[]>([])

  const copyPixels = useCallback(() => {
    if (!wrapperRef.current || overlays.length === 0) return false
    const mainCanvas = wrapperRef.current.querySelector<HTMLCanvasElement>(
      ".react-pdf__Page canvas"
    )
    if (!mainCanvas || mainCanvas.width === 0) return false
    const mainCtx = mainCanvas.getContext("2d", { willReadFrequently: true })
    if (!mainCtx) return false
    const dpr = window.devicePixelRatio || 1

    let hasData = false
    overlays.forEach((region, i) => {
      const oc = overlayRefs.current.get(i)
      if (!oc) return
      const sw = Math.round(region.width * dpr)
      const sh = Math.round(region.height * dpr)
      oc.width = sw
      oc.height = sh
      const ctx = oc.getContext("2d")
      if (!ctx) return
      try {
        const imgData = mainCtx.getImageData(
          Math.round(region.x * dpr),
          Math.round(region.y * dpr),
          sw,
          sh
        )
        const nonZero = imgData.data.some((v) => v !== 0)
        if (nonZero) {
          ctx.putImageData(imgData, 0, 0)
          hasData = true
        }
      } catch {
        /* tainted canvas */
      }
    })
    return hasData
  }, [overlays])

  const scheduleCopy = useCallback(() => {
    retryTimers.current.forEach(clearTimeout)
    retryTimers.current = []
    const attempt = () => {
      requestAnimationFrame(() => {
        if (!copyPixels()) {
          const t = window.setTimeout(() => requestAnimationFrame(() => {
            if (!copyPixels()) {
              const t2 = window.setTimeout(() => requestAnimationFrame(copyPixels), 300)
              retryTimers.current.push(t2)
            }
          }), 100)
          retryTimers.current.push(t)
        }
      })
    }
    attempt()
  }, [copyPixels])

  const handleRenderSuccess = useCallback(() => {
    canvasRendered.current = true
    onRenderSuccess?.()
    if (overlays.length > 0) scheduleCopy()
  }, [onRenderSuccess, overlays, scheduleCopy])

  useEffect(() => {
    if (theme !== "dark" || !pdfDoc) {
      setOverlays([])
      return
    }
    let cancelled = false
    getImageRegions(pdfDoc, pageNumber, scale).then((regions) => {
      if (!cancelled) setOverlays(regions)
    })
    return () => {
      cancelled = true
    }
  }, [theme, pdfDoc, pageNumber, scale])

  useEffect(() => {
    if (overlays.length > 0 && canvasRendered.current) {
      scheduleCopy()
    }
  }, [overlays, scheduleCopy])

  useEffect(() => {
    return () => retryTimers.current.forEach(clearTimeout)
  }, [])

  const setOverlayRef = useCallback(
    (index: number) => (el: HTMLCanvasElement | null) => {
      if (el) overlayRefs.current.set(index, el)
      else overlayRefs.current.delete(index)
    },
    []
  )

  return (
    <div ref={wrapperRef} className="relative">
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        onRenderSuccess={handleRenderSuccess}
      />
      {overlays.map((region, i) => (
        <canvas
          key={i}
          ref={setOverlayRef(i)}
          className="pointer-events-none absolute z-[1]"
          style={{
            left: `${region.x}px`,
            top: `${region.y}px`,
            width: `${region.width}px`,
            height: `${region.height}px`,
          }}
        />
      ))}
    </div>
  )
})
