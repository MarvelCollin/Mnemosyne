import { useState, useRef, useCallback } from "react";
import { BookOpen, Link, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleDriveBrowser } from "./GoogleDriveBrowser";
import { LibraryShelf } from "./LibraryShelf";
import { ReadingList } from "./ReadingList";
import { useLibrary } from "@/hooks/useLibrary";
import { useReadingList } from "@/hooks/useReadingList";
import {
  parseGDriveUrl,
  getApiKey,
  setApiKey,
  getDriveUrl,
  setDriveUrl,
  downloadFile,
  getFileName,
  getFolderName,
} from "@/lib/googleDrive";
import type { IPdfUploaderProps } from "@/interfaces/IPdfUploader";

export function PdfUploader({ onFileSelect, initialFolderId }: IPdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const [driveUrl, setDriveUrlState] = useState(() => getDriveUrl());
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [browseFolderId, setBrowseFolderId] = useState<string | null>(
    initialFolderId ?? null,
  );

  const [apiKey, setApiKeyState] = useState<string | null>(() => getApiKey());
  const [keyInput, setKeyInput] = useState("");

  const { shelves, remember, forget, markOpened } = useLibrary();
  const readingList = useReadingList();

  const handleDriveUrlChange = useCallback((value: string) => {
    setDriveUrlState(value);
    setDriveUrl(value);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === "application/pdf") {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const saveKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setApiKeyState(trimmed);
    setKeyInput("");
    setDriveError(null);
  };

  const openShelf = (folderId: string) => {
    markOpened(folderId);
    setBrowseFolderId(folderId);
  };

  const handleDriveSubmit = async () => {
    setDriveError(null);
    const parsed = parseGDriveUrl(driveUrl);

    if (!parsed.type || !parsed.id) {
      setDriveError("Invalid Google Drive link");
      return;
    }

    if (!apiKey) {
      setDriveError("Google Drive API key not configured");
      return;
    }

    if (parsed.type === "folder") {
      const folderId = parsed.id;
      openShelf(folderId);
      getFolderName(folderId, apiKey).then((name) => remember(folderId, name));
      return;
    }

    setDriveLoading(true);
    try {
      const [buffer, name] = await Promise.all([
        downloadFile(parsed.id, apiKey),
        getFileName(parsed.id, apiKey),
      ]);
      const file = new File([buffer], name, { type: "application/pdf" });
      onFileSelect(file);
    } catch (e: any) {
      setDriveError(e.message);
    } finally {
      setDriveLoading(false);
    }
  };

  if (browseFolderId && apiKey) {
    return (
      <div className="flex min-h-svh flex-col items-center px-4 pt-12">
        <h1 className="font-serif-display text-4xl tracking-tight sm:text-5xl">
          Google Drive
        </h1>
        <GoogleDriveBrowser
          folderId={browseFolderId}
          apiKey={apiKey}
          onFileSelect={onFileSelect}
          onBack={() => setBrowseFolderId(null)}
        />
      </div>
    );
  }

  return (
    <div
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className="relative flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center">
        <h1 className="font-serif-display text-6xl tracking-tight sm:text-7xl">
          Mnemosyne
        </h1>
        <p className="mt-3 text-muted-foreground">Your personal reading space</p>
        <div className="mt-12 flex items-center gap-4">
          <Button size="lg" onClick={() => inputRef.current?.click()}>
            Open a PDF
          </Button>
          <span className="text-sm text-muted-foreground">
            or drop it anywhere
          </span>
        </div>

        <div className="mt-8 w-full">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={driveUrl}
                onChange={(e) => handleDriveUrlChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDriveSubmit()}
                placeholder="Paste Google Drive link..."
                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button
              onClick={handleDriveSubmit}
              disabled={!driveUrl.trim() || driveLoading}>
              {driveLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Open"
              )}
            </Button>
          </div>

          {driveError && (
            <p className="mt-2 text-sm text-destructive">{driveError}</p>
          )}

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Folder links are saved to your library so you only paste them once
          </p>
        </div>

        {apiKey ? (
          <LibraryShelf
            shelves={shelves}
            onOpen={(shelf) => openShelf(shelf.id)}
            onRemove={forget}
          />
        ) : (
          <div className="mt-8 w-full rounded-lg border bg-card p-3">
            <div className="flex items-center gap-1.5">
              <KeyRound className="size-3.5 text-muted-foreground" />
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Google Drive API key
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Needed to open Drive links. Stored only in this browser.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveKey()}
                placeholder="AIza..."
                className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <Button size="sm" onClick={saveKey} disabled={!keyInput.trim()}>
                Save
              </Button>
            </div>
          </div>
        )}

        <ReadingList
          items={readingList.items}
          onAdd={readingList.add}
          onRemove={readingList.remove}
          onRefreshImage={readingList.refreshImage}
          isSearching={readingList.isSearching}
        />
      </div>

      {isDragging && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/5 backdrop-blur-sm"
          style={{ animation: "fade-in 0.15s ease-out" }}>
          <div className="flex flex-col items-center gap-3">
            <BookOpen className="size-12 text-primary" />
            <p className="text-lg font-medium text-primary">
              Drop to start reading
            </p>
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
  );
}
