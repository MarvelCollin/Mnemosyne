import type { IAutoScrollControls } from "@/interfaces/IAutoScroll"

interface AutoScrollControlsProps {
  controls: IAutoScrollControls
}

export function AutoScrollControls({ controls }: AutoScrollControlsProps) {
  const { autoScroll, toggle, increaseSpeed, decreaseSpeed } = controls

  return (
    <div className="flex items-center">
      <button
        onClick={toggle}
        className={`rounded-sm px-2 py-1 text-xs font-medium transition-colors ${
          autoScroll.isActive
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {autoScroll.isActive ? "Scrolling" : "Scroll"}
      </button>
      {autoScroll.isActive && (
        <div className="ml-1 flex items-center gap-0.5">
          <button
            onClick={decreaseSpeed}
            className="flex size-5 items-center justify-center rounded-sm text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center text-xs tabular-nums">
            {autoScroll.speed}×
          </span>
          <button
            onClick={increaseSpeed}
            className="flex size-5 items-center justify-center rounded-sm text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}
