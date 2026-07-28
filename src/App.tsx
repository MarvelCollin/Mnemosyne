import { useRef, useState, useCallback } from "react"
import { pdfjs } from "react-pdf"
import { PdfUploader } from "@/components/pdf/PdfUploader"
import { PdfViewer } from "@/components/pdf/PdfViewer"
import { Toolbar } from "@/components/layout/Toolbar"
import { ProgressBar } from "@/components/layout/ProgressBar"
import { ShortcutsDialog } from "@/components/layout/ShortcutsDialog"
import { useDocument } from "@/hooks/useDocument"
import { useTheme } from "@/hooks/useTheme"
import { useAutoScroll } from "@/hooks/useAutoScroll"
import { useZoom } from "@/hooks/useZoom"
import { useReadingProgress } from "@/hooks/useReadingProgress"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useReadingPosition } from "@/hooks/useReadingPosition"

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

function App() {
  const { document, loadFile, clearDocument, setCurrentPage } = useDocument()
  const { theme, setTheme } = useTheme()
  const viewerRef = useRef<HTMLDivElement>(null)
  const autoScrollControls = useAutoScroll(viewerRef)
  const zoomControls = useZoom()
  const progress = useReadingProgress(viewerRef)
  const [goToPage, setGoToPage] = useState<number | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { restore } = useReadingPosition(
    document?.file ?? null,
    viewerRef,
    document?.currentPage ?? 1
  )

  useKeyboardShortcuts({
    autoScroll: autoScrollControls,
    zoom: zoomControls,
    onToggleHelp: () => setShowShortcuts((prev) => !prev),
  })

  const handleFileSelect = (file: File) => {
    loadFile(file, 0)
  }

  const handleDocumentLoaded = (totalPages: number) => {
    if (document) {
      loadFile(document.file, totalPages)
    }
  }

  const handleViewerReady = useCallback(() => {
    restore()
  }, [restore])

  const handlePageChangeFromScroll = useCallback((page: number) => {
    setCurrentPage(page)
  }, [setCurrentPage])

  const handlePageChangeFromNav = (page: number) => {
    setCurrentPage(page)
    setGoToPage(page)
    setTimeout(() => setGoToPage(null), 100)
  }

  if (!document) {
    return <PdfUploader onFileSelect={handleFileSelect} />
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      <Toolbar
        fileName={document.name}
        theme={theme}
        onThemeChange={setTheme}
        onClose={clearDocument}
        autoScrollControls={autoScrollControls}
        zoomControls={zoomControls}
        currentPage={document.currentPage}
        totalPages={document.totalPages}
        onPageChange={handlePageChangeFromNav}
      />
      <ProgressBar progress={progress} />
      <PdfViewer
        file={document.file}
        zoom={zoomControls.zoom}
        onDocumentLoaded={handleDocumentLoaded}
        onPageChange={handlePageChangeFromScroll}
        containerRef={viewerRef}
        goToPage={goToPage}
        onReady={handleViewerReady}
      />
      <ShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  )
}

export default App
