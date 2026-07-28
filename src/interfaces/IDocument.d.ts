export interface IDocument {
  file: File
  name: string
  totalPages: number
  currentPage: number
}

export interface IDocumentContext {
  document: IDocument | null
  setDocument: (doc: IDocument | null) => void
  setCurrentPage: (page: number) => void
}
