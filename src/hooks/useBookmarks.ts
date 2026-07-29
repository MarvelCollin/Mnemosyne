import { useState, useCallback, useEffect } from "react"
import type { IBookmark, IBookmarkControls } from "@/interfaces/IBookmark"

const STORAGE_KEY = "mnemosyne-bookmarks"

function getFileKey(file: File): string {
  return `${file.name}_${file.size}`
}

function loadAll(): Record<string, IBookmark[]> {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

function saveAll(data: Record<string, IBookmark[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useBookmarks(file: File | null): IBookmarkControls {
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([])

  useEffect(() => {
    if (!file) {
      setBookmarks([])
      return
    }
    const all = loadAll()
    setBookmarks(all[getFileKey(file)] ?? [])
  }, [file])

  const persist = useCallback((next: IBookmark[]) => {
    if (!file) return
    const all = loadAll()
    all[getFileKey(file)] = next
    saveAll(all)
    setBookmarks(next)
  }, [file])

  const isBookmarked = useCallback((page: number) => {
    return bookmarks.some((b) => b.page === page)
  }, [bookmarks])

  const toggle = useCallback((page: number) => {
    const existing = bookmarks.findIndex((b) => b.page === page)
    if (existing >= 0) {
      persist(bookmarks.filter((_, i) => i !== existing))
    } else {
      const next = [...bookmarks, { page, label: `Page ${page}`, timestamp: Date.now() }]
      next.sort((a, b) => a.page - b.page)
      persist(next)
    }
  }, [bookmarks, persist])

  const remove = useCallback((index: number) => {
    persist(bookmarks.filter((_, i) => i !== index))
  }, [bookmarks, persist])

  const clear = useCallback(() => {
    persist([])
  }, [persist])

  return { bookmarks, isBookmarked, toggle, remove, clear }
}
