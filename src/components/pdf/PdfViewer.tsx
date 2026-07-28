import { useState, useEffect, useRef, useCallback } from "react"
import { Document } from "react-pdf"
import { PdfPage } from "./PdfPage"
import type { IPdfViewerProps } from "@/Interface/IPdfViewer"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

export function PdfViewer({ file, zoom, onDocumentLoaded, onPageChange, containerRef, goToPage }: IPdfViewerProps) {
  const [totalPages, setTotalPages] = useState(0)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages)
    onDocumentLoaded(numPages)
  }

  const handleScroll = useCallback(() => {
    if (!containerRef.current || totalPages === 0) return
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
  }, [containerRef, totalPages, onPageChange])

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

  const setPageRef = (pageNum: number) => (el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(pageNum, el)
    } else {
      pageRefs.current.delete(pageNum)
    }
  }

  return (
    <div ref={containerRef} className="flex flex-1 flex-col items-center overflow-y-auto py-8">
      <Document
        file={file}
        onLoadSuccess={onLoadSuccess}
        className="flex flex-col items-center gap-4"
      >
        {Array.from({ length: totalPages }, (_, i) => (
          <div key={i + 1} ref={setPageRef(i + 1)}>
            <PdfPage pageNumber={i + 1} scale={zoom.scale} />
          </div>
        ))}
      </Document>
    </div>
  )
}
