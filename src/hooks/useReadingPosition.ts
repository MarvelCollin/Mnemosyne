import { useState, useEffect, useCallback, useRef } from "react"
import type { IReadingPosition } from "@/interfaces/IReadingPosition"

const STORAGE_KEY = "mnemosyne-positions"
const SAVE_INTERVAL = 1000

function getFileKey(file: File): string {
  return `${file.name}_${file.size}`
}

export function useReadingPosition(
  file: File | null,
  containerRef: React.RefObject<HTMLElement | null>,
  currentPage: number
) {
  const lastSaveRef = useRef(0)
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage
  const positionsRef = useRef<Record<string, IReadingPosition> | null>(null)
  const [savedPage, setSavedPage] = useState<number | null>(null)

  const getPositions = useCallback(() => {
    if (!positionsRef.current) {
      const raw = localStorage.getItem(STORAGE_KEY)
      positionsRef.current = raw ? JSON.parse(raw) : {}
    }
    return positionsRef.current!
  }, [])

  useEffect(() => {
    if (!file) {
      setSavedPage(null)
      return
    }
    const positions = getPositions()
    const position = positions[getFileKey(file)]
    setSavedPage(position?.currentPage ?? null)
  }, [file, getPositions])

  const save = useCallback(() => {
    if (!file || !containerRef.current) return
    const now = Date.now()
    if (now - lastSaveRef.current < SAVE_INTERVAL) return
    lastSaveRef.current = now

    const key = getFileKey(file)
    const positions = getPositions()
    positions[key] = {
      fileKey: key,
      scrollTop: containerRef.current.scrollTop,
      currentPage: currentPageRef.current,
      timestamp: now,
    }
    positionsRef.current = positions
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
  }, [file, containerRef, getPositions])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !file) return
    container.addEventListener("scroll", save, { passive: true })
    return () => container.removeEventListener("scroll", save)
  }, [containerRef, file, save])

  const restore = useCallback(() => {
    if (!file || !containerRef.current) return false
    const key = getFileKey(file)
    const positions = getPositions()
    const position = positions[key]
    if (!position) return false

    containerRef.current.scrollTop = position.scrollTop
    return true
  }, [file, containerRef, getPositions])

  return { restore, savedPage }
}
