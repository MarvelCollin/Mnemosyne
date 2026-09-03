import { useState, useRef } from "react"
import {
  BookMarked,
  Plus,
  ExternalLink,
  Trash2,
  RefreshCw,
  Loader2,
  Image,
  Download,
  Upload,
  CloudDownload,
  CloudUpload,
  Cloud,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IReadingItem } from "@/interfaces/IReadingList"

interface ReadingListProps {
  items: IReadingItem[]
  onAdd: (title: string, link: string, lastProgress?: string) => Promise<void>
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Omit<IReadingItem, "id" | "addedAt">>) => void
  onRefreshImage: (id: string, title: string) => Promise<void>
  isSearching: boolean
  isSyncing: boolean
  syncError: string | null
  lastSyncTime: number | null
  onSyncFromDrive: (folderId: string, apiKey: string) => Promise<boolean>
  onImportFromFile: (file: File) => Promise<boolean>
  onExportToFile: () => void
  onClearSyncError: () => void
  onSaveToDrive: (accessToken: string) => Promise<boolean>
  onLoadFromDrive: (accessToken: string) => Promise<boolean>
  apiKey: string | null
  libraryFolderId: string | null
  isSignedIn: boolean
  accessToken: string | null
}

export function ReadingList({
  items,
  onAdd,
  onRemove,
  onUpdate,
  onRefreshImage,
  isSearching,
  isSyncing,
  syncError,
  lastSyncTime,
  onSyncFromDrive,
  onImportFromFile,
  onExportToFile,
  onClearSyncError,
  onSaveToDrive,
  onLoadFromDrive,
  apiKey,
  libraryFolderId,
  isSignedIn,
  accessToken,
}: ReadingListProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [link, setLink] = useState("")
  const [lastProgress, setLastProgress] = useState("")
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null)
  const [editingProgressValue, setEditingProgressValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !link.trim()) return
    let finalLink = link.trim()
    if (!finalLink.startsWith("http://") && !finalLink.startsWith("https://")) {
      finalLink = "https://" + finalLink
    }
    await onAdd(title.trim(), finalLink, lastProgress.trim() || undefined)
    setTitle("")
    setLink("")
    setLastProgress("")
    setShowForm(false)
  }

  const handleProgressEdit = (item: IReadingItem) => {
    setEditingProgressId(item.id)
    setEditingProgressValue(item.lastProgress || "")
  }

  const handleProgressSave = (id: string) => {
    onUpdate(id, { lastProgress: editingProgressValue.trim() || undefined })
    setEditingProgressId(null)
    setEditingProgressValue("")
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await onImportFromFile(file)
      e.target.value = ""
    }
  }

  const handleSyncFromDrive = async () => {
    if (apiKey && libraryFolderId) {
      await onSyncFromDrive(libraryFolderId, apiKey)
    }
  }

  const handleSaveToDrive = async () => {
    if (accessToken) {
      await onSaveToDrive(accessToken)
    }
  }

  const handleLoadFromDrive = async () => {
    if (accessToken) {
      await onLoadFromDrive(accessToken)
    }
  }

  const canSyncFromDrive = apiKey && libraryFolderId
  const canSyncWithOAuth = isSignedIn && accessToken

  return (
    <div className="mt-6 w-full">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookMarked className="size-3.5 text-muted-foreground" />
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reading List
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {canSyncWithOAuth && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadFromDrive}
                disabled={isSyncing}
                title="Load from Google Drive"
                className="h-7 px-2"
              >
                {isSyncing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CloudDownload className="size-4" />
                )}
              </Button>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveToDrive}
                  disabled={isSyncing}
                  title="Save to Google Drive"
                  className="h-7 px-2"
                >
                  <CloudUpload className="size-4" />
                </Button>
              )}
            </>
          )}
          {!canSyncWithOAuth && canSyncFromDrive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSyncFromDrive}
              disabled={isSyncing}
              title="Sync from Google Drive folder"
              className="h-7 px-2"
            >
              {isSyncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CloudDownload className="size-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Import from file"
            className="h-7 px-2"
          >
            <Upload className="size-4" />
          </Button>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExportToFile}
              title="Export to file"
              className="h-7 px-2"
            >
              <Download className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="h-7 px-2"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      {syncError && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{syncError}</span>
          <button
            onClick={onClearSyncError}
            className="ml-2 text-destructive/70 hover:text-destructive"
          >
            ×
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-3 rounded-lg border bg-card p-4">
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Book or movie title..."
              className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              value={lastProgress}
              onChange={(e) => setLastProgress(e.target.value)}
              placeholder="Last chapter/episode (optional)"
              className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="h-10 flex-1" disabled={!title.trim() || !link.trim() || isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
              <Button type="button" variant="ghost" className="h-10" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/50 p-6 text-center">
          <BookMarked className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No saved readings yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/75">
            Click + to add a new reading, or import from a JSON file
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/60"
            >
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {item.imageUrl ? (
                  <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[3/2] items-center justify-center bg-muted">
                    <Image className="size-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-medium">{item.title}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <ExternalLink className="size-3" />
                    <span className="truncate">{new URL(item.link).hostname}</span>
                  </div>
                </div>
              </a>
              <div className="border-t px-3 py-2.5">
                {editingProgressId === item.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingProgressValue}
                      onChange={(e) => setEditingProgressValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleProgressSave(item.id)
                        if (e.key === "Escape") setEditingProgressId(null)
                      }}
                      placeholder="Ch. 1, Ep. 5, etc."
                      className="h-9 min-w-0 flex-1 rounded border bg-background px-3 text-sm outline-none focus:border-primary"
                      autoFocus
                    />
                    <button
                      onClick={() => handleProgressSave(item.id)}
                      className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleProgressEdit(item)}
                    className="w-full min-h-[36px] flex items-center text-left text-sm text-muted-foreground hover:text-foreground active:text-foreground"
                  >
                    {item.lastProgress ? (
                      <span>Progress: <span className="font-medium text-foreground">{item.lastProgress}</span></span>
                    ) : (
                      <span className="italic">+ Add progress</span>
                    )}
                  </button>
                )}
              </div>
              <div className="absolute right-1 top-1 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRefreshImage(item.id, item.title)
                  }}
                  disabled={isSearching}
                  title="Refresh image"
                  className="rounded-md bg-background/90 p-2 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground active:bg-background disabled:opacity-50"
                >
                  {isSearching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onRemove(item.id)
                  }}
                  title="Remove from list"
                  className="rounded-md bg-background/90 p-2 text-muted-foreground backdrop-blur-sm transition-colors hover:text-destructive active:bg-background"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {canSyncWithOAuth ? (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Cloud className="size-3" />
          {lastSyncTime ? (
            <span className="flex items-center gap-1">
              <Check className="size-3 text-green-500" />
              Synced to Google Drive
            </span>
          ) : (
            <span>Auto-syncing to Google Drive</span>
          )}
        </div>
      ) : canSyncFromDrive ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Place a <code className="rounded bg-muted px-1">reading-list.json</code> file in your Google Drive folder to sync
        </p>
      ) : null}
    </div>
  )
}
