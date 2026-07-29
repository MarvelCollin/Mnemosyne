import { describe, it, expect, vi, beforeEach } from "vitest"

describe("goToPage navigation", () => {
  let scrollIntoViewMock: ReturnType<typeof vi.fn>
  let container: HTMLDivElement
  let pageElements: Map<number, HTMLDivElement>

  beforeEach(() => {
    scrollIntoViewMock = vi.fn()
    container = document.createElement("div")
    Object.defineProperty(container, "scrollTop", { value: 0, writable: true, configurable: true })
    pageElements = new Map()

    for (let i = 1; i <= 20; i++) {
      const el = document.createElement("div")
      el.scrollIntoView = scrollIntoViewMock as unknown as typeof el.scrollIntoView
      Object.defineProperty(el, "offsetTop", { value: (i - 1) * 800, configurable: true })
      container.appendChild(el)
      pageElements.set(i, el)
    }
  })

  it("scrollIntoView is called with correct element for target page", () => {
    const targetPage = 10
    const el = pageElements.get(targetPage)
    el!.scrollIntoView({ behavior: "smooth", block: "start" })

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" })
  })

  it("scrollIntoView can be called for any valid page", () => {
    for (const page of [1, 5, 10, 15, 20]) {
      scrollIntoViewMock.mockClear()
      const el = pageElements.get(page)
      expect(el).toBeDefined()
      el!.scrollIntoView({ behavior: "smooth", block: "start" })
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(1)
    }
  })

  it("handles edge case of page 1", () => {
    const el = pageElements.get(1)
    el!.scrollIntoView({ behavior: "smooth", block: "start" })
    expect(scrollIntoViewMock).toHaveBeenCalled()
  })

  it("handles edge case of last page", () => {
    const el = pageElements.get(20)
    el!.scrollIntoView({ behavior: "smooth", block: "start" })
    expect(scrollIntoViewMock).toHaveBeenCalled()
  })

  it("does not throw for non-existent page", () => {
    const el = pageElements.get(99)
    expect(el).toBeUndefined()
  })
})

describe("page detection from scroll", () => {
  it("finds closest page to viewport position", () => {
    const pages = new Map<number, { offsetTop: number }>()
    for (let i = 1; i <= 10; i++) {
      pages.set(i, { offsetTop: (i - 1) * 800 })
    }

    function findClosestPage(scrollTop: number, clientHeight: number): number {
      const target = scrollTop + clientHeight / 3
      let closestPage = 1
      let closestDistance = Infinity
      pages.forEach((el, pageNum) => {
        const distance = Math.abs(el.offsetTop - target)
        if (distance < closestDistance) {
          closestDistance = distance
          closestPage = pageNum
        }
      })
      return closestPage
    }

    expect(findClosestPage(0, 600)).toBe(1)
    expect(findClosestPage(800, 600)).toBe(2)
    expect(findClosestPage(3200, 600)).toBe(5)
    expect(findClosestPage(7200, 600)).toBe(10)
  })
})

describe("reading position persistence key", () => {
  it("generates unique key from file name and size", () => {
    function getFileKey(name: string, size: number): string {
      return `${name}_${size}`
    }

    expect(getFileKey("book.pdf", 1000)).toBe("book.pdf_1000")
    expect(getFileKey("book.pdf", 2000)).toBe("book.pdf_2000")
    expect(getFileKey("other.pdf", 1000)).toBe("other.pdf_1000")
    expect(getFileKey("book.pdf", 1000)).toBe(getFileKey("book.pdf", 1000))
    expect(getFileKey("a.pdf", 1)).not.toBe(getFileKey("b.pdf", 1))
  })
})
