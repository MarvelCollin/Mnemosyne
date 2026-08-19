import { useState, useCallback } from "react"
import type { IReadingItem } from "@/interfaces/IReadingList"
import {
  getReadingList,
  addReadingItem,
  updateReadingItem,
  removeReadingItem,
  searchBookImage,
  loadReadingListFromDrive,
  importReadingListFromJson,
  downloadReadingListFile,
} from "@/lib/readingList"

const READING_LIST_KEY = "Mnemosyne - Yomu-reading-list"

function persistItems(items: IReadingItem[]) {
  localStorage.setItem(READING_LIST_KEY, JSON.stringify(items))
}

export function useReadingList() {
  const [items, setItems] = useState<IReadingItem[]>(() => getReadingList())
  const [isSearching, setIsSearching] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const add = useCallback(async (title: string, link: string) => {
    setIsSearching(true)
    try {
      const imageUrl = await searchBookImage(title)
      const newItems = addReadingItem({ title, link, imageUrl: imageUrl ?? undefined })
      setItems(newItems)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const update = useCallback((id: string, updates: Partial<Omit<IReadingItem, "id" | "addedAt">>) => {
    setItems(updateReadingItem(id, updates))
  }, [])

  const remove = useCallback((id: string) => {
    setItems(removeReadingItem(id))
  }, [])

  const refreshImage = useCallback(async (id: string, title: string) => {
    setIsSearching(true)
    try {
      const imageUrl = await searchBookImage(title)
      if (imageUrl) {
        setItems(updateReadingItem(id, { imageUrl }))
      }
    } finally {
      setIsSearching(false)
    }
  }, [])

  const syncFromDrive = useCallback(async (folderId: string, apiKey: string) => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const driveItems = await loadReadingListFromDrive(folderId, apiKey)
      if (driveItems) {
        persistItems(driveItems)
        setItems(driveItems)
        return true
      }
      setSyncError("No reading-list.json found in folder")
      return false
    } catch (e: any) {
      setSyncError(e.message || "Failed to sync from Drive")
      return false
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const importFromFile = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const imported = importReadingListFromJson(text)
        if (imported) {
          persistItems(imported)
          setItems(imported)
          resolve(true)
        } else {
          setSyncError("Invalid reading list file format")
          resolve(false)
        }
      }
      reader.onerror = () => {
        setSyncError("Failed to read file")
        resolve(false)
      }
      reader.readAsText(file)
    })
  }, [])

  const exportToFile = useCallback(() => {
    downloadReadingListFile(items)
  }, [items])

  const clearSyncError = useCallback(() => {
    setSyncError(null)
  }, [])

  return {
    items,
    add,
    update,
    remove,
    refreshImage,
    isSearching,
    isSyncing,
    syncError,
    syncFromDrive,
    importFromFile,
    exportToFile,
    clearSyncError,
  }
}
