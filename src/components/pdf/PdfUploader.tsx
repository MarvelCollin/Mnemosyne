import { useState, useRef, useCallback } from "react"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { IPdfUploaderProps } from "@/interfaces/IPdfUploader"

export function PdfUploader({ onFileSelect }: IPdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

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

  return (
    <div
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className="relative flex min-h-svh flex-col items-center justify-center"
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
      </div>

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/5 backdrop-blur-sm"
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
