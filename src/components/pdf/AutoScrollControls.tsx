import { Play, Pause, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IAutoScrollControls } from "@/Interface/IAutoScroll"

interface AutoScrollControlsProps {
  controls: IAutoScrollControls
}

export function AutoScrollControls({ controls }: AutoScrollControlsProps) {
  const { autoScroll, toggle, increaseSpeed, decreaseSpeed } = controls

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={decreaseSpeed} title="Slower">
        <Minus className="size-3.5" />
      </Button>
      <Button
        variant={autoScroll.isActive ? "secondary" : "ghost"}
        size="sm"
        onClick={toggle}
        className="gap-1.5 tabular-nums"
      >
        {autoScroll.isActive ? (
          <Pause className="size-3.5" />
        ) : (
          <Play className="size-3.5" />
        )}
        {autoScroll.speed}x
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={increaseSpeed} title="Faster">
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}
