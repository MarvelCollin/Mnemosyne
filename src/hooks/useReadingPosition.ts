import { useEffect, useCallback, useRef } from "react"
import type { IReadingPosition } from "@/interfaces/IReadingPosition"

const STORAGE_KEY = "mnemosyne-positions"
const SAVE_INTERVAL = 1000

function getFileKey(file: File): string {
  return `${file.name}_${file.size}`
}

function loadPositions(): Record<string, IReadingPosition> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}
  return JSON.parse(raw)
}

function savePositions(positions: Record<string, IReadingPosition>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
}

export function useReadingPosition(
  file: File | null,
  containerRef: React.RefObject<HTMLElement | null>,
  currentPage: number
) {
  const lastSaveRef = useRef(0)

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
      currentPage,
      timestamp: now,
    }
    savePositions(positions)
  }, [file, containerRef, currentPage])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !file) return
    container.addEventListener("scroll", save, { passive: true })
    return () => container.removeEventListener("scroll", save)
  }, [containerRef, file, save])

  const restore = useCallback(() => {
    if (!file || !containerRef.current) return false
    const key = getFileKey(file)
    const positions = loadPositions()
    const position = positions[key]
    if (!position) return false

    containerRef.current.scrollTop = position.scrollTop
    return true
  }, [file, containerRef])

  return { restore }
}
