import { useState, useCallback } from "react"
import type { IReadingItem } from "@/interfaces/IReadingList"
import {
  getReadingList,
  addReadingItem,
  updateReadingItem,
  removeReadingItem,
  searchBookImage,
} from "@/lib/readingList"

export function useReadingList() {
  const [items, setItems] = useState<IReadingItem[]>(() => getReadingList())
  const [isSearching, setIsSearching] = useState(false)

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

  return { items, add, update, remove, refreshImage, isSearching }
}
