import { useState, useEffect, useRef, useCallback } from "react"
import { Document } from "react-pdf"
import { PdfPage } from "./PdfPage"
import type { IPdfViewerProps } from "@/interfaces/IPdfViewer"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

export function PdfViewer({ file, zoom, onDocumentLoaded, onPageChange, containerRef, goToPage, onReady }: IPdfViewerProps) {
  const [totalPages, setTotalPages] = useState(0)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const readyCalled = useRef(false)
  const renderedCount = useRef(0)
  const scrollRaf = useRef(0)
  const totalPagesRef = useRef(0)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages)
    totalPagesRef.current = numPages
    renderedCount.current = 0
    readyCalled.current = false
    onDocumentLoaded(numPages)
  }

  const onPageRendered = useCallback(() => {
    renderedCount.current++
    if (renderedCount.current >= totalPagesRef.current && !readyCalled.current) {
      readyCalled.current = true
      setTimeout(() => onReadyRef.current(), 50)
    }
  }, [])

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(scrollRaf.current)
    scrollRaf.current = requestAnimationFrame(() => {
      if (!containerRef.current || totalPagesRef.current === 0) return
      const container = containerRef.current
      const containerTop = container.scrollTop + container.clientHeight / 3

      let closestPage = 1
      let closestDistance = Infinity

      pageRefs.current.forEach((el, pageNum) => {
        const distance = Math.abs(el.offsetTop - containerTop)
        if (distance < closestDistance) {
          closestDistance = distance
          closestPage = pageNum
        }
      })

      onPageChange(closestPage)
    })
  }, [containerRef, onPageChange])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [containerRef, handleScroll])

  useEffect(() => {
    if (goToPage === null) return
    const el = pageRefs.current.get(goToPage)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [goToPage])

  const setPageRef = useCallback((pageNum: number) => (el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(pageNum, el)
    } else {
      pageRefs.current.delete(pageNum)
    }
  }, [])

  return (
    <div ref={containerRef} className="flex flex-1 flex-col items-center overflow-y-auto overflow-x-hidden bg-muted/40 px-3 py-3 sm:px-8 sm:py-8">
      {totalPages === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )}
      <Document
        file={file}
        onLoadSuccess={onLoadSuccess}
        className="flex flex-col items-center gap-2 sm:gap-4"
      >
        {Array.from({ length: totalPages }, (_, i) => (
          <div key={i + 1} ref={setPageRef(i + 1)} className="pdf-page-wrapper overflow-hidden rounded-lg shadow">
            <PdfPage pageNumber={i + 1} scale={zoom.scale} onRenderSuccess={onPageRendered} />
          </div>
        ))}
      </Document>
    </div>
  )
}
