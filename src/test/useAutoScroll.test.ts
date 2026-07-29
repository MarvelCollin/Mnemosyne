import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useAutoScroll } from "@/hooks/useAutoScroll"

function makeContainer() {
  const el = document.createElement("div")
  let scrollTop = 0
  Object.defineProperty(el, "scrollTop", {
    get: () => scrollTop,
    set: (v: number) => { scrollTop = v },
    configurable: true,
  })
  return { current: el }
}

describe("useAutoScroll", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      return setTimeout(cb, 16) as unknown as number
    })
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      clearTimeout(id)
    })
  })

  it("starts inactive", () => {
    const ref = makeContainer()
    const { result } = renderHook(() => useAutoScroll(ref))
    expect(result.current.autoScroll.isActive).toBe(false)
  })

  it("toggles active state", () => {
    const ref = makeContainer()
    const { result } = renderHook(() => useAutoScroll(ref))

    act(() => { result.current.toggle() })
    expect(result.current.autoScroll.isActive).toBe(true)

    act(() => { result.current.toggle() })
    expect(result.current.autoScroll.isActive).toBe(false)
  })

  it("pause stops scrolling without deactivating", () => {
    const ref = makeContainer()
    const { result } = renderHook(() => useAutoScroll(ref))

    act(() => { result.current.toggle() })
    expect(result.current.autoScroll.isActive).toBe(true)

    act(() => { result.current.pause() })
    expect(result.current.autoScroll.isActive).toBe(true)
  })

  it("resume restarts scrolling after pause", () => {
    const ref = makeContainer()
    const { result } = renderHook(() => useAutoScroll(ref))

    act(() => { result.current.toggle() })
    act(() => { result.current.pause() })
    act(() => { result.current.resume() })
    expect(result.current.autoScroll.isActive).toBe(true)
  })

  it("pause does nothing when not active", () => {
    const ref = makeContainer()
    const { result } = renderHook(() => useAutoScroll(ref))

    act(() => { result.current.pause() })
    expect(result.current.autoScroll.isActive).toBe(false)
  })

  it("resume does nothing when not paused", () => {
    const ref = makeContainer()
    const { result } = renderHook(() => useAutoScroll(ref))

    act(() => { result.current.toggle() })
    act(() => { result.current.resume() })
    expect(result.current.autoScroll.isActive).toBe(true)
  })

  it("adjusts speed within bounds", () => {
    const ref = makeContainer()
    const { result } = renderHook(() => useAutoScroll(ref))

    act(() => { result.current.setSpeed(5) })
    expect(result.current.autoScroll.speed).toBe(5)

    act(() => { result.current.setSpeed(0) })
    expect(result.current.autoScroll.speed).toBe(1)

    act(() => { result.current.setSpeed(99) })
    expect(result.current.autoScroll.speed).toBe(10)
  })

  it("increaseSpeed and decreaseSpeed work", () => {
    const ref = makeContainer()
    const { result } = renderHook(() => useAutoScroll(ref))

    expect(result.current.autoScroll.speed).toBe(1)
    act(() => { result.current.increaseSpeed() })
    expect(result.current.autoScroll.speed).toBe(2)
    act(() => { result.current.decreaseSpeed() })
    expect(result.current.autoScroll.speed).toBe(1)
    act(() => { result.current.decreaseSpeed() })
    expect(result.current.autoScroll.speed).toBe(1)
  })
})
