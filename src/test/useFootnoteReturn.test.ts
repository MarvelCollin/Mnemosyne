import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { useFootnoteReturn } from "@/hooks/useFootnoteReturn"

function makeContainer(scrollTop = 0) {
  const el = document.createElement("div")
  Object.defineProperty(el, "scrollTop", {
    value: scrollTop,
    writable: true,
    configurable: true,
  })
  el.scrollTo = vi.fn()
  return el
}

describe("useFootnoteReturn", () => {
  it("has no return point before any jump", () => {
    const container = makeContainer()
    const { result } = renderHook(() =>
      useFootnoteReturn({ current: container }, 12, "book.pdf")
    )
    expect(result.current.returnPoint).toBeNull()
  })

  it("records where the reader was when a footnote link is followed", () => {
    const container = makeContainer(840)
    const { result } = renderHook(() =>
      useFootnoteReturn({ current: container }, 12, "book.pdf")
    )

    act(() => result.current.push(230))

    expect(result.current.returnPoint).toEqual({ scrollTop: 840, page: 12 })
  })

  it("ignores links that stay on the current page", () => {
    const container = makeContainer(840)
    const { result } = renderHook(() =>
      useFootnoteReturn({ current: container }, 12, "book.pdf")
    )

    act(() => result.current.push(12))

    expect(result.current.returnPoint).toBeNull()
  })

  it("scrolls back to the recorded position and pops the entry", () => {
    const container = makeContainer(840)
    const { result } = renderHook(() =>
      useFootnoteReturn({ current: container }, 12, "book.pdf")
    )

    act(() => result.current.push(230))
    act(() => result.current.goBack())

    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 840,
      behavior: "smooth",
    })
    expect(result.current.returnPoint).toBeNull()
  })

  it("unwinds nested jumps one at a time", () => {
    const container = makeContainer(100)
    const { result, rerender } = renderHook(
      ({ page }) => useFootnoteReturn({ current: container }, page, "book.pdf"),
      { initialProps: { page: 5 } }
    )

    act(() => result.current.push(230))

    container.scrollTop = 9000
    rerender({ page: 230 })
    act(() => result.current.push(231))

    expect(result.current.returnPoint).toEqual({ scrollTop: 9000, page: 230 })

    act(() => result.current.goBack())
    expect(result.current.returnPoint).toEqual({ scrollTop: 100, page: 5 })
  })

  it("does nothing when there is nowhere to go back to", () => {
    const container = makeContainer()
    const { result } = renderHook(() =>
      useFootnoteReturn({ current: container }, 3, "book.pdf")
    )

    act(() => result.current.goBack())

    expect(container.scrollTo).not.toHaveBeenCalled()
  })

  it("clears the stack when a different document is opened", () => {
    const container = makeContainer(500)
    const { result, rerender } = renderHook(
      ({ file }) => useFootnoteReturn({ current: container }, 12, file),
      { initialProps: { file: "book.pdf" } }
    )

    act(() => result.current.push(230))
    expect(result.current.returnPoint).not.toBeNull()

    rerender({ file: "other.pdf" })
    expect(result.current.returnPoint).toBeNull()
  })
})
