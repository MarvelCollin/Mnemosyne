import type { IShelf } from "@/interfaces/ILibrary"

const SHELVES_KEY = "mnemosyne-library"
const LAST_SHELF_KEY = "mnemosyne-last-shelf"

export function getShelves(): IShelf[] {
  const raw = localStorage.getItem(SHELVES_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(shelves: IShelf[]): IShelf[] {
  localStorage.setItem(SHELVES_KEY, JSON.stringify(shelves))
  return shelves
}

export function addShelf(id: string, name: string): IShelf[] {
  const shelves = getShelves()
  const existing = shelves.find((s) => s.id === id)
  if (existing) {
    return persist(shelves.map((s) => (s.id === id ? { ...s, name } : s)))
  }
  return persist([...shelves, { id, name, addedAt: Date.now() }])
}

export function removeShelf(id: string): IShelf[] {
  if (getLastShelfId() === id) setLastShelfId(null)
  return persist(getShelves().filter((s) => s.id !== id))
}

export function getLastShelfId(): string | null {
  return localStorage.getItem(LAST_SHELF_KEY)
}

export function setLastShelfId(id: string | null) {
  if (id) {
    localStorage.setItem(LAST_SHELF_KEY, id)
  } else {
    localStorage.removeItem(LAST_SHELF_KEY)
  }
}
