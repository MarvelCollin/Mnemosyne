import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { useReadingPosition } from "@/hooks/useReadingPosition"

const STORAGE_KEY = "mnemosyne-positions"

function makeFile(name: string, size: number): File {
  const content = new Uint8Array(size)
  return new File([content], name, { type: "application/pdf" })
}

function makeContainer(scrollTop = 0) {
  const el = document.createElement("div")
  Object.defineProperty(el, "scrollTop", {
    get: () => scrollTop,
    set: vi.fn(),
    configurable: true,
  })
  return { current: el }
}

describe("useReadingPosition", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns null savedPage when no position is saved", () => {
    const file = makeFile("test.pdf", 1000)
    const containerRef = makeContainer()
    const { result } = renderHook(() =>
      useReadingPosition(file, containerRef, 1)
    )
    expect(result.current.savedPage).toBeNull()
  })

  it("returns saved page from localStorage", () => {
    const file = makeFile("test.pdf", 1000)
    const key = `${file.name}_${file.size}`
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [key]: { fileKey: key, scrollTop: 500, currentPage: 5, timestamp: 1000 },
      })
    )
    const containerRef = makeContainer()
    const { result } = renderHook(() =>
      useReadingPosition(file, containerRef, 1)
    )
    expect(result.current.savedPage).toBe(5)
  })

  it("restore returns saved page number", () => {
    const file = makeFile("test.pdf", 1000)
    const key = `${file.name}_${file.size}`
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [key]: { fileKey: key, scrollTop: 500, currentPage: 10, timestamp: 1000 },
      })
    )
    const containerRef = makeContainer()
    const { result } = renderHook(() =>
      useReadingPosition(file, containerRef, 1)
    )
    expect(result.current.restore()).toBe(10)
  })

  it("restore returns null when no saved position", () => {
    const file = makeFile("test.pdf", 1000)
    const containerRef = makeContainer()
    const { result } = renderHook(() =>
      useReadingPosition(file, containerRef, 1)
    )
    expect(result.current.restore()).toBeNull()
  })

  it("restore returns null when saved page is 1", () => {
    const file = makeFile("test.pdf", 1000)
    const key = `${file.name}_${file.size}`
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [key]: { fileKey: key, scrollTop: 0, currentPage: 1, timestamp: 1000 },
      })
    )
    const containerRef = makeContainer()
    const { result } = renderHook(() =>
      useReadingPosition(file, containerRef, 1)
    )
    expect(result.current.restore()).toBeNull()
  })

  it("saves position on scroll", async () => {
    const file = makeFile("test.pdf", 1000)
    const container = document.createElement("div")
    Object.defineProperty(container, "scrollTop", { value: 300, configurable: true })
    const containerRef = { current: container }

    renderHook(() => useReadingPosition(file, containerRef, 3))

    act(() => {
      container.dispatchEvent(new Event("scroll"))
    })

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    const key = `${file.name}_${file.size}`
    expect(saved[key]).toBeDefined()
    expect(saved[key].currentPage).toBe(3)
    expect(saved[key].scrollTop).toBe(300)
  })

  it("resets savedPage when file changes to null", () => {
    const file = makeFile("test.pdf", 1000)
    const key = `${file.name}_${file.size}`
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [key]: { fileKey: key, scrollTop: 500, currentPage: 5, timestamp: 1000 },
      })
    )
    const containerRef = makeContainer()
    const { result, rerender } = renderHook(
      ({ f }) => useReadingPosition(f, containerRef, 1),
      { initialProps: { f: file as File | null } }
    )
    expect(result.current.savedPage).toBe(5)

    rerender({ f: null })
    expect(result.current.savedPage).toBeNull()
  })

  it("uses file name and size as key", () => {
    const file1 = makeFile("book1.pdf", 1000)
    const file2 = makeFile("book2.pdf", 2000)
    const key1 = `${file1.name}_${file1.size}`
    const key2 = `${file2.name}_${file2.size}`

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [key1]: { fileKey: key1, scrollTop: 100, currentPage: 3, timestamp: 1000 },
        [key2]: { fileKey: key2, scrollTop: 800, currentPage: 15, timestamp: 2000 },
      })
    )

    const containerRef = makeContainer()
    const { result: r1 } = renderHook(() =>
      useReadingPosition(file1, containerRef, 1)
    )
    expect(r1.current.savedPage).toBe(3)

    const { result: r2 } = renderHook(() =>
      useReadingPosition(file2, containerRef, 1)
    )
    expect(r2.current.savedPage).toBe(15)
  })
})
