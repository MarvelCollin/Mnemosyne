export interface IPdfViewerProps {
  file: File
  onDocumentLoaded: (totalPages: number) => void
}
