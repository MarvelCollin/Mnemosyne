import { Library, Folder, ChevronRight } from "lucide-react"
import type { IShelf } from "@/interfaces/ILibrary"

interface LibraryShelfProps {
  shelves: IShelf[]
  onOpen: (shelf: IShelf) => void
  onRemove: (id: string) => void
}

export function LibraryShelf({ shelves, onOpen, onRemove }: LibraryShelfProps) {
  if (shelves.length === 0) return null

  return (
    <div className="mt-8 w-full">
      <div className="mb-2 flex items-center gap-1.5">
        <Library className="size-3.5 text-muted-foreground" />
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Library
        </h2>
      </div>

      <div className="rounded-lg border bg-card">
        {shelves.map((shelf) => (
          <div
            key={shelf.id}
            className="flex items-center border-b last:border-b-0 hover:bg-muted/60"
          >
            <button
              onClick={() => onOpen(shelf)}
              className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm"
            >
              <Folder className="size-5 shrink-0 text-blue-500" />
              <span className="min-w-0 flex-1 truncate">{shelf.name}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
            <button
              onClick={() => onRemove(shelf.id)}
              title="Remove from library"
              className="px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
