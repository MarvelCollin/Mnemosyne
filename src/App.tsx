import { useRef, useState, useCallback, useEffect } from "react"
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
import { useTranslation } from "@/hooks/useTranslation"
import { TranslationPopup } from "@/components/pdf/TranslationPopup"
import { TranslationSettings } from "@/components/pdf/TranslationSettings"
import { persistDocument, loadPersistedDocument, clearPersistedDocument } from "@/lib/storage"

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
  const [showTranslationSettings, setShowTranslationSettings] = useState(false)
  const {
    settings: translationSettings,
    updateSettings: updateTranslationSettings,
    popup: translationPopup,
    saveToDict,
    dictionary,
    deleteDictEntry,
    clearDictionary,
  } = useTranslation(viewerRef)
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

  useEffect(() => {
    loadPersistedDocument().then((file) => {
      if (file) loadFile(file, 0)
    })
  }, [])

  const handleFileSelect = (file: File) => {
    loadFile(file, 0)
    persistDocument(file)
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
        onClose={() => { clearDocument(); clearPersistedDocument() }}
        autoScrollControls={autoScrollControls}
        zoomControls={zoomControls}
        currentPage={document.currentPage}
        totalPages={document.totalPages}
        onPageChange={handlePageChangeFromNav}
        translationLabel={`${translationSettings.sourceLanguage.toUpperCase()}→${translationSettings.targetLanguage.toUpperCase()}`}
        onTranslateSettings={() => setShowTranslationSettings((prev) => !prev)}
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
      <TranslationSettings
        settings={translationSettings}
        onUpdate={updateTranslationSettings}
        isOpen={showTranslationSettings}
        onClose={() => setShowTranslationSettings(false)}
        dictionary={dictionary}
        onDeleteEntry={deleteDictEntry}
        onClearDictionary={clearDictionary}
      />
      {translationPopup && <TranslationPopup state={translationPopup} onSave={saveToDict} />}
    </div>
  )
}

export default App
