import { useState, useRef, useCallback } from "react"
import { BookOpen, Link, Key, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GoogleDriveBrowser } from "./GoogleDriveBrowser"
import {
  parseGDriveUrl,
  getApiKey,
  setApiKey,
  downloadFile,
  getFileName,
} from "@/lib/googleDrive"
import type { IPdfUploaderProps } from "@/interfaces/IPdfUploader"

export function PdfUploader({ onFileSelect }: IPdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const [driveUrl, setDriveUrl] = useState("")
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveLoading, setDriveLoading] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyValue, setApiKeyValue] = useState(() => getApiKey() || "")
  const [browseFolderId, setBrowseFolderId] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === "application/pdf") {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (dragCounter.current === 1) setIsDragging(true)
  }, [])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDragLeave = useCallback(() => {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const ensureApiKey = (): string | null => {
    const key = getApiKey()
    if (!key) {
      setShowApiKeyInput(true)
      setDriveError("Enter your Google Drive API key first")
      return null
    }
    return key
  }

  const handleDriveSubmit = async () => {
    setDriveError(null)
    const parsed = parseGDriveUrl(driveUrl)

    if (!parsed.type || !parsed.id) {
      setDriveError("Invalid Google Drive link")
      return
    }

    const key = ensureApiKey()
    if (!key) return

    if (parsed.type === "folder") {
      setBrowseFolderId(parsed.id)
      return
    }

    setDriveLoading(true)
    try {
      const [buffer, name] = await Promise.all([
        downloadFile(parsed.id, key),
        getFileName(parsed.id, key),
      ])
      const file = new File([buffer], name, { type: "application/pdf" })
      onFileSelect(file)
    } catch (e: any) {
      setDriveError(e.message)
    } finally {
      setDriveLoading(false)
    }
  }

  const handleSaveApiKey = () => {
    const trimmed = apiKeyValue.trim()
    if (!trimmed) return
    setApiKey(trimmed)
    setShowApiKeyInput(false)
    setDriveError(null)
  }

  if (browseFolderId) {
    const key = getApiKey()
    if (!key) return null
    return (
      <div className="flex min-h-svh flex-col items-center px-4 pt-12">
        <h1 className="font-serif-display text-4xl tracking-tight sm:text-5xl">Google Drive</h1>
        <GoogleDriveBrowser
          folderId={browseFolderId}
          apiKey={key}
          onFileSelect={onFileSelect}
          onBack={() => setBrowseFolderId(null)}
        />
      </div>
    )
  }

  return (
    <div
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className="relative flex min-h-svh flex-col items-center justify-center px-4"
    >
      <div className="flex flex-col items-center">
        <h1 className="font-serif-display text-6xl tracking-tight sm:text-7xl">
          Mnemosyne
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your personal reading space
        </p>
        <div className="mt-12 flex items-center gap-4">
          <Button size="lg" onClick={() => inputRef.current?.click()}>
            Open a PDF
          </Button>
          <span className="text-sm text-muted-foreground">or drop it anywhere</span>
        </div>

        <div className="mt-8 w-full max-w-md">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDriveSubmit()}
                placeholder="Paste Google Drive link..."
                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button onClick={handleDriveSubmit} disabled={!driveUrl.trim() || driveLoading}>
              {driveLoading ? <Loader2 className="size-4 animate-spin" /> : "Open"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowApiKeyInput((v) => !v)}
              title="API key settings"
            >
              <Key className="size-4" />
            </Button>
          </div>

          {showApiKeyInput && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="password"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
                placeholder="Google Drive API key"
                className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <Button size="sm" onClick={handleSaveApiKey} disabled={!apiKeyValue.trim()}>
                Save
              </Button>
              {getApiKey() && (
                <Button size="sm" variant="ghost" onClick={() => setShowApiKeyInput(false)}>
                  <X className="size-3" />
                </Button>
              )}
            </div>
          )}

          {driveError && (
            <p className="mt-2 text-sm text-destructive">{driveError}</p>
          )}

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Supports public Google Drive file and folder links
          </p>
        </div>
      </div>

      {isDragging && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/5 backdrop-blur-sm"
          style={{ animation: "fade-in 0.15s ease-out" }}
        >
          <div className="flex flex-col items-center gap-3">
            <BookOpen className="size-12 text-primary" />
            <p className="text-lg font-medium text-primary">Drop to start reading</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={onChange}
        className="hidden"
      />
    </div>
  )
}
