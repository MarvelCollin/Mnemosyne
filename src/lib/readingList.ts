import type { IReadingItem } from "@/interfaces/IReadingList"

const READING_LIST_KEY = "Mnemosyne - Yomu-reading-list"

export function getReadingList(): IReadingItem[] {
  const raw = localStorage.getItem(READING_LIST_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(items: IReadingItem[]): IReadingItem[] {
  localStorage.setItem(READING_LIST_KEY, JSON.stringify(items))
  return items
}

export function addReadingItem(item: Omit<IReadingItem, "id" | "addedAt">): IReadingItem[] {
  const items = getReadingList()
  const newItem: IReadingItem = {
    ...item,
    id: crypto.randomUUID(),
    addedAt: Date.now(),
  }
  return persist([newItem, ...items])
}

export function updateReadingItem(id: string, updates: Partial<Omit<IReadingItem, "id" | "addedAt">>): IReadingItem[] {
  const items = getReadingList()
  return persist(items.map((item) => (item.id === id ? { ...item, ...updates } : item)))
}

export function removeReadingItem(id: string): IReadingItem[] {
  return persist(getReadingList().filter((item) => item.id !== id))
}

export async function searchBookImage(title: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (data.docs && data.docs.length > 0) {
      const book = data.docs[0]
      if (book.cover_i) {
        return `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      }
    }
    
    return null
  } catch {
    return null
  }
}
