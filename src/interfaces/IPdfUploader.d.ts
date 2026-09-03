export interface IPdfUploaderProps {
  onFileSelect: (file: File) => void
  initialFolderId?: string | null
}
