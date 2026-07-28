import { useState } from "react"
import type { IDocument } from "@/Interface/IDocument"

export function useDocument() {
  const [document, setDocument] = useState<IDocument | null>(null)

  const setCurrentPage = (page: number) => {
    if (!document) return
    setDocument({ ...document, currentPage: page })
  }

  const loadFile = (file: File, totalPages: number) => {
    setDocument({
      file,
      name: file.name,
      totalPages,
      currentPage: 1,
    })
  }

  const clearDocument = () => {
    setDocument(null)
  }

  return { document, setCurrentPage, loadFile, clearDocument }
}
