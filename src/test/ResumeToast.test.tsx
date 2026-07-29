import { render, screen, act, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ResumeToast } from "@/components/pdf/ResumeToast"

describe("ResumeToast", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders nothing when savedPage is null", () => {
    const { container } = render(
      <ResumeToast savedPage={null} totalPages={100} onGoToPage={vi.fn()} />
    )
    expect(container.innerHTML).toBe("")
  })

  it("renders nothing when savedPage is 1", () => {
    const { container } = render(
      <ResumeToast savedPage={1} totalPages={100} onGoToPage={vi.fn()} />
    )
    act(() => { vi.advanceTimersByTime(1000) })
    expect(container.innerHTML).toBe("")
  })

  it("renders nothing when totalPages is 0", () => {
    const { container } = render(
      <ResumeToast savedPage={5} totalPages={0} onGoToPage={vi.fn()} />
    )
    act(() => { vi.advanceTimersByTime(1000) })
    expect(container.innerHTML).toBe("")
  })

  it("shows toast after 600ms delay", () => {
    render(
      <ResumeToast savedPage={42} totalPages={100} onGoToPage={vi.fn()} />
    )
    expect(screen.queryByText("42")).not.toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(600) })
    expect(screen.getByText("42")).toBeInTheDocument()
    expect(screen.getByText("of 100")).toBeInTheDocument()
    expect(screen.getByText("Go")).toBeInTheDocument()
  })

  it("auto-hides after 8 seconds", () => {
    render(
      <ResumeToast savedPage={42} totalPages={100} onGoToPage={vi.fn()} />
    )
    act(() => { vi.advanceTimersByTime(600) })
    expect(screen.getByText("42")).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(7500) })
    expect(screen.queryByText("42")).not.toBeInTheDocument()
  })

  it("calls onGoToPage with savedPage when Go is clicked", () => {
    const onGoToPage = vi.fn()
    render(
      <ResumeToast savedPage={42} totalPages={100} onGoToPage={onGoToPage} />
    )
    act(() => { vi.advanceTimersByTime(600) })

    fireEvent.click(screen.getByText("Go"))
    expect(onGoToPage).toHaveBeenCalledWith(42)
  })

  it("hides after Go is clicked", () => {
    render(
      <ResumeToast savedPage={42} totalPages={100} onGoToPage={vi.fn()} />
    )
    act(() => { vi.advanceTimersByTime(600) })
    expect(screen.getByText("42")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Go"))
    expect(screen.queryByText("42")).not.toBeInTheDocument()
  })

  it("hides when dismiss X is clicked", () => {
    render(
      <ResumeToast savedPage={42} totalPages={100} onGoToPage={vi.fn()} />
    )
    act(() => { vi.advanceTimersByTime(600) })

    const buttons = screen.getAllByRole("button")
    const dismissBtn = buttons[buttons.length - 1]
    fireEvent.click(dismissBtn)
    expect(screen.queryByText("42")).not.toBeInTheDocument()
  })

  it("does not reappear after being dismissed", () => {
    const { rerender } = render(
      <ResumeToast savedPage={42} totalPages={100} onGoToPage={vi.fn()} />
    )
    act(() => { vi.advanceTimersByTime(600) })
    act(() => { vi.advanceTimersByTime(8000) })

    rerender(
      <ResumeToast savedPage={42} totalPages={100} onGoToPage={vi.fn()} />
    )
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.queryByText("42")).not.toBeInTheDocument()
  })
})
