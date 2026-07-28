import { ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IZoomControls } from "@/Interface/IZoom"

interface ZoomControlsProps {
  controls: IZoomControls
}

export function ZoomControls({ controls }: ZoomControlsProps) {
  const { zoom, zoomIn, zoomOut } = controls

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={zoomOut} title="Zoom out">
        <ZoomOut className="size-4" />
      </Button>
      <span className="min-w-[3rem] text-center text-xs tabular-nums">
        {Math.round(zoom.scale * 100)}%
      </span>
      <Button variant="ghost" size="icon-sm" onClick={zoomIn} title="Zoom in">
        <ZoomIn className="size-4" />
      </Button>
    </div>
  )
}
