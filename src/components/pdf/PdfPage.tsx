import { memo, useRef, useCallback } from "react"
import { Page } from "react-pdf"
import type { IPdfPageProps } from "@/interfaces/IPdfPage"

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

function invertCanvasLightness(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imageData.data

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255
    const g = d[i + 1] / 255
    const b = d[i + 2] / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    let l = (max + min) / 2

    if (max !== min) {
      const diff = max - min
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min)
      if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) / 6
      else if (max === g) h = ((b - r) / diff + 2) / 6
      else h = ((r - g) / diff + 4) / 6
    }

    l = 0.12 + (1 - l) * 0.76

    if (s === 0) {
      const v = Math.round(l * 255)
      d[i] = v
      d[i + 1] = v
      d[i + 2] = v
    } else {
      const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p2 = 2 * l - q2
      d[i] = Math.round(hue2rgb(p2, q2, h + 1 / 3) * 255)
      d[i + 1] = Math.round(hue2rgb(p2, q2, h) * 255)
      d[i + 2] = Math.round(hue2rgb(p2, q2, h - 1 / 3) * 255)
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

function applySepiaToCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imageData.data
  const amount = 0.4

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    const sr = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
    const sg = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
    const sb = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
    d[i] = Math.round(r + (sr - r) * amount)
    d[i + 1] = Math.round(g + (sg - g) * amount)
    d[i + 2] = Math.round(b + (sb - b) * amount)
  }

  ctx.putImageData(imageData, 0, 0)
}

export const PdfPage = memo(function PdfPage({ pageNumber, scale, theme, onRenderSuccess }: IPdfPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleRenderSuccess = useCallback(() => {
    if (wrapperRef.current) {
      const canvas = wrapperRef.current.querySelector("canvas")
      if (canvas) {
        if (theme === "dark") invertCanvasLightness(canvas)
        else if (theme === "sepia") applySepiaToCanvas(canvas)
      }
    }
    onRenderSuccess?.()
  }, [theme, onRenderSuccess])

  return (
    <div ref={wrapperRef}>
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        onRenderSuccess={handleRenderSuccess}
      />
    </div>
  )
})
