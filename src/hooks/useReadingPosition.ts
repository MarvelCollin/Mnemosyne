import { useState, useEffect, useCallback, useRef } from "react"
import type { IReadingPosition } from "@/interfaces/IReadingPosition"

const STORAGE_KEY = "mnemosyne-positions"
const SAVE_INTERVAL = 1000

function getFileKey(file: File): string {
  return `${file.name}_${file.size}`
}

function loadPositions(): Record<string, IReadingPosition> {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

export function useReadingPosition(
  file: File | null,
  containerRef: React.RefObject<HTMLElement | null>,
  currentPage: number
) {
  const lastSaveRef = useRef(0)
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage
  const [savedPage, setSavedPage] = useState<number | null>(null)

  useEffect(() => {
    if (!file) {
      setSavedPage(null)
      return
    }
    const position = loadPositions()[getFileKey(file)]
    setSavedPage(position?.currentPage ?? null)
  }, [file])

  const save = useCallback(() => {
    if (!file || !containerRef.current) return
    const now = Date.now()
    if (now - lastSaveRef.current < SAVE_INTERVAL) return
    lastSaveRef.current = now

    const key = getFileKey(file)
    const positions = loadPositions()
    positions[key] = {
      fileKey: key,
      scrollTop: containerRef.current.scrollTop,
      currentPage: currentPageRef.current,
      timestamp: now,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
  }, [file, containerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !file) return
    container.addEventListener("scroll", save, { passive: true })
    return () => container.removeEventListener("scroll", save)
  }, [containerRef, file, save])

  const restore = useCallback((): number | null => {
    if (!file) return null
    const position = loadPositions()[getFileKey(file)]
    if (!position || position.currentPage <= 1) return null
    return position.currentPage
  }, [file])

  return { restore, savedPage }
}
