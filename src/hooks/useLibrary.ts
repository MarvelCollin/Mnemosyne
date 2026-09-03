import { useState, useCallback } from "react"
import type { IShelf } from "@/interfaces/ILibrary"
import { getShelves, addShelf, removeShelf, setLastShelfId } from "@/lib/library"

export function useLibrary() {
  const [shelves, setShelves] = useState<IShelf[]>(() => getShelves())

  const remember = useCallback((id: string, name: string) => {
    setShelves(addShelf(id, name))
  }, [])

  const forget = useCallback((id: string) => {
    setShelves(removeShelf(id))
  }, [])

  const markOpened = useCallback((id: string) => {
    setLastShelfId(id)
  }, [])

  return { shelves, remember, forget, markOpened }
}
