import { useState, useEffect, useCallback } from "react"
import { Folder, FileText, File, ChevronRight, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listFolder, downloadFile, getFolderName, type GDriveItem } from "@/lib/googleDrive"

interface BreadcrumbItem {
  id: string
  name: string
}

interface GoogleDriveBrowserProps {
  folderId: string
  apiKey: string
  onFileSelect: (file: File) => void
  onBack: () => void
}

export function GoogleDriveBrowser({ folderId, apiKey, onFileSelect, onBack }: GoogleDriveBrowserProps) {
  const [items, setItems] = useState<GDriveItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [currentFolder, setCurrentFolder] = useState(folderId)

  const loadFolder = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const files = await listFolder(id, apiKey)
      setItems(files)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    loadFolder(currentFolder)
  }, [currentFolder, loadFolder])

  useEffect(() => {
    getFolderName(folderId, apiKey).then((name) => {
      setBreadcrumbs([{ id: folderId, name }])
    })
  }, [folderId, apiKey])

  const navigateToFolder = async (item: GDriveItem) => {
    setCurrentFolder(item.id)
    setBreadcrumbs((prev) => [...prev, { id: item.id, name: item.name }])
  }

  const navigateToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index]
    setCurrentFolder(target.id)
    setBreadcrumbs((prev) => prev.slice(0, index + 1))
  }

  const openFile = async (item: GDriveItem) => {
    setDownloading(item.id)
    setError(null)
    try {
      const buffer = await downloadFile(item.id, apiKey)
      const file = new File([buffer], item.name, { type: "application/pdf" })
      onFileSelect(file)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDownloading(null)
    }
  }

  const isPdf = (item: GDriveItem) =>
    item.mimeType === "application/pdf" || item.name.toLowerCase().endsWith(".pdf")

  const isFolder = (item: GDriveItem) =>
    item.mimeType === "application/vnd.google-apps.folder"

  const getIcon = (item: GDriveItem) => {
    if (isFolder(item)) return <Folder className="size-5 text-blue-500" />
    if (isPdf(item)) return <FileText className="size-5 text-red-500" />
    return <File className="size-5 text-muted-foreground" />
  }

  const formatSize = (bytes?: string) => {
    if (!bytes) return ""
    const n = parseInt(bytes)
    if (n < 1024) return `${n} B`
    if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="mt-8 w-full max-w-lg">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-1 overflow-x-auto text-sm">
          {breadcrumbs.map((b, i) => (
            <span key={b.id} className="flex shrink-0 items-center gap-1">
              {i > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
              <button
                onClick={() => navigateToBreadcrumb(i)}
                className={`rounded px-1 py-0.5 hover:bg-muted ${
                  i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {b.name}
              </button>
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Empty folder</p>
      ) : (
        <div className="rounded-lg border bg-card">
          {items.map((item) => {
            const clickable = isFolder(item) || isPdf(item)
            const isDownloading = downloading === item.id
            return (
              <button
                key={item.id}
                disabled={!clickable || isDownloading}
                onClick={() => (isFolder(item) ? navigateToFolder(item) : isPdf(item) ? openFile(item) : null)}
                className={`flex w-full items-center gap-3 border-b px-3 py-2.5 text-left text-sm last:border-b-0 ${
                  clickable
                    ? "hover:bg-muted/60"
                    : "cursor-default opacity-50"
                }`}
              >
                {isDownloading ? <Loader2 className="size-5 animate-spin text-primary" /> : getIcon(item)}
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {formatSize(item.size) && (
                  <span className="shrink-0 text-xs text-muted-foreground">{formatSize(item.size)}</span>
                )}
                {isFolder(item) && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
