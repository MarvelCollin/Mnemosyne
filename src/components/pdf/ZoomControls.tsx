import type { IZoomControls } from "@/interfaces/IZoom"

interface ZoomControlsProps {
  controls: IZoomControls
}

export function ZoomControls({ controls }: ZoomControlsProps) {
  const { zoom, zoomIn, zoomOut } = controls

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={zoomOut}
        className="flex size-6 items-center justify-center rounded-sm text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        −
      </button>
      <span className="min-w-[2.5rem] text-center text-xs tabular-nums text-muted-foreground">
        {Math.round(zoom.scale * 100)}%
      </span>
      <button
        onClick={zoomIn}
        className="flex size-6 items-center justify-center rounded-sm text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        +
      </button>
    </div>
  )
}
