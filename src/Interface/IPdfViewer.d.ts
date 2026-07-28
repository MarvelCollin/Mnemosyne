export interface IPdfViewerProps {
  file: File
  onDocumentLoaded: (totalPages: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}
