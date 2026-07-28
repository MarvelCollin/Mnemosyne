import { useState, useRef, useCallback } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IPdfUploaderProps } from "@/interfaces/IPdfUploader"

export function PdfUploader({ onFileSelect }: IPdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`flex w-full max-w-lg flex-col items-center gap-6 rounded-xl border-2 border-dashed p-12 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Upload className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Mnemosyne</h2>
          <p className="text-sm text-muted-foreground">
            Drop your PDF here or click to browse
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          Choose File
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={onChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
