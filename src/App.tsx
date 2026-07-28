import { pdfjs } from "react-pdf"
import { PdfUploader } from "@/components/pdf/PdfUploader"
import { PdfViewer } from "@/components/pdf/PdfViewer"
import { Toolbar } from "@/components/layout/Toolbar"
import { useDocument } from "@/hooks/useDocument"
import { useTheme } from "@/hooks/useTheme"

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

function App() {
  const { document, loadFile, clearDocument } = useDocument()
  const { theme, setTheme } = useTheme()

  const handleFileSelect = (file: File) => {
    loadFile(file, 0)
  }

  const handleDocumentLoaded = (totalPages: number) => {
    if (document) {
      loadFile(document.file, totalPages)
    }
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
      />
      <PdfViewer file={document.file} onDocumentLoaded={handleDocumentLoaded} />
    </div>
  )
}

export default App
