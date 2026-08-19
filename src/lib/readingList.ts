import type { IReadingItem } from "@/interfaces/IReadingList"
import { listFolder, downloadFile } from "@/lib/googleDrive"

const READING_LIST_KEY = "mnemosyne-reading-list"
const READING_LIST_FILENAME = "reading-list.json"

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

export function exportReadingListToJson(items: IReadingItem[]): string {
  return JSON.stringify(items, null, 2)
}

export function importReadingListFromJson(json: string): IReadingItem[] | null {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return null
    const valid = parsed.every(
      (item) =>
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.link === "string" &&
        typeof item.addedAt === "number"
    )
    if (!valid) return null
    return parsed as IReadingItem[]
  } catch {
    return null
  }
}

export async function loadReadingListFromDrive(
  folderId: string,
  apiKey: string
): Promise<IReadingItem[] | null> {
  try {
    const files = await listFolder(folderId, apiKey)
    const readingListFile = files.find(
      (f) => f.name === READING_LIST_FILENAME && f.mimeType === "application/json"
    )
    
    if (!readingListFile) return null
    
    const buffer = await downloadFile(readingListFile.id, apiKey)
    const text = new TextDecoder().decode(buffer)
    return importReadingListFromJson(text)
  } catch {
    return null
  }
}

export function downloadReadingListFile(items: IReadingItem[]) {
  const json = exportReadingListToJson(items)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = READING_LIST_FILENAME
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
