import { useState, useCallback, useRef } from "react"
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
  saveReadingListToDrive,
  loadReadingListFromDriveWithToken,
} from "@/lib/readingList"

const READING_LIST_KEY = "mnemosyne-reading-list"

function persistItems(items: IReadingItem[]) {
  localStorage.setItem(READING_LIST_KEY, JSON.stringify(items))
}

export function useReadingList() {
  const [items, setItems] = useState<IReadingItem[]>(() => getReadingList())
  const [isSearching, setIsSearching] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const accessTokenRef = useRef<string | null>(null)

  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token
  }, [])

  const add = useCallback(async (title: string, link: string, lastProgress?: string) => {
    setIsSearching(true)
    try {
      const imageUrl = await searchBookImage(title)
      const newItems = addReadingItem({ title, link, imageUrl: imageUrl ?? undefined, lastProgress })
      setItems(newItems)
      if (accessTokenRef.current) {
        saveReadingListToDrive(newItems, accessTokenRef.current).catch(() => {})
      }
    } finally {
      setIsSearching(false)
    }
  }, [])

  const update = useCallback((id: string, updates: Partial<Omit<IReadingItem, "id" | "addedAt">>) => {
    const newItems = updateReadingItem(id, updates)
    setItems(newItems)
    if (accessTokenRef.current) {
      saveReadingListToDrive(newItems, accessTokenRef.current).catch(() => {})
    }
  }, [])

  const remove = useCallback((id: string) => {
    const newItems = removeReadingItem(id)
    setItems(newItems)
    if (accessTokenRef.current) {
      saveReadingListToDrive(newItems, accessTokenRef.current).catch(() => {})
    }
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

  const saveToDrive = useCallback(async (accessToken: string) => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const success = await saveReadingListToDrive(items, accessToken)
      if (success) {
        setLastSyncTime(Date.now())
        return true
      }
      setSyncError("Failed to save to Google Drive")
      return false
    } catch (e: any) {
      setSyncError(e.message || "Failed to save to Drive")
      return false
    } finally {
      setIsSyncing(false)
    }
  }, [items])

  const loadFromDriveWithToken = useCallback(async (accessToken: string) => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const driveItems = await loadReadingListFromDriveWithToken(accessToken)
      if (driveItems) {
        persistItems(driveItems)
        setItems(driveItems)
        setLastSyncTime(Date.now())
        return true
      }
      return false
    } catch (e: any) {
      setSyncError(e.message || "Failed to load from Drive")
      return false
    } finally {
      setIsSyncing(false)
    }
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
    lastSyncTime,
    syncFromDrive,
    importFromFile,
    exportToFile,
    clearSyncError,
    saveToDrive,
    loadFromDriveWithToken,
    setAccessToken,
  }
}
