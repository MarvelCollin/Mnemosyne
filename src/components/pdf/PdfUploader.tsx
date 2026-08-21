import { useState, useRef, useCallback, useEffect } from "react";
import { BookOpen, Link, Loader2, KeyRound, LogOut, FileText, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleDriveBrowser } from "./GoogleDriveBrowser";
import { LibraryShelf } from "./LibraryShelf";
import { ReadingList } from "./ReadingList";
import { useLibrary } from "@/hooks/useLibrary";
import { useReadingList } from "@/hooks/useReadingList";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

type Tab = "open" | "reading-list";
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
import { getLastShelfId } from "@/lib/library";
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
  const [activeTab, setActiveTab] = useState<Tab>("open");

  const { shelves, remember, forget, markOpened } = useLibrary();
  const readingList = useReadingList();
  const googleAuth = useGoogleAuth();

  useEffect(() => {
    readingList.setAccessToken(googleAuth.accessToken);
  }, [googleAuth.accessToken, readingList.setAccessToken]);

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
      className="relative flex min-h-svh flex-col">
      <nav className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
          <h1 className="font-serif-display text-xl tracking-tight">
            Mnemosyne
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("open")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "open"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <FileText className="size-4" />
              <span className="hidden sm:inline">Open PDF</span>
            </button>
            <button
              onClick={() => setActiveTab("reading-list")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "reading-list"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <BookMarked className="size-4" />
              <span className="hidden sm:inline">Reading List</span>
              {readingList.items.length > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                  {readingList.items.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="flex w-full max-w-md flex-col items-center">

        {activeTab === "open" ? (
          <>
            <div className="mt-8 flex items-center gap-4">
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
          </>
        ) : (
          <>
            {googleAuth.isConfigured && (
              <div className="mt-6 w-full">
                {googleAuth.isSignedIn && googleAuth.user ? (
                  <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={googleAuth.user.picture}
                        alt={googleAuth.user.name}
                        className="size-8 rounded-full"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{googleAuth.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          Reading list synced to Drive
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={googleAuth.signOut}
                      title="Sign out"
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-card/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Sign in to sync your reading list to Google Drive
                    </p>
                    <Button
                      className="mt-3"
                      onClick={googleAuth.signIn}
                      disabled={!googleAuth.isReady || googleAuth.isLoading}
                    >
                      {googleAuth.isLoading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <svg className="mr-2 size-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      Sign in with Google
                    </Button>
                    {googleAuth.error && (
                      <p className="mt-2 text-sm text-destructive">{googleAuth.error}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <ReadingList
              items={readingList.items}
              onAdd={readingList.add}
              onRemove={readingList.remove}
              onRefreshImage={readingList.refreshImage}
              isSearching={readingList.isSearching}
              isSyncing={readingList.isSyncing}
              syncError={readingList.syncError}
              lastSyncTime={readingList.lastSyncTime}
              onSyncFromDrive={readingList.syncFromDrive}
              onImportFromFile={readingList.importFromFile}
              onExportToFile={readingList.exportToFile}
              onClearSyncError={readingList.clearSyncError}
              onSaveToDrive={readingList.saveToDrive}
              onLoadFromDrive={readingList.loadFromDriveWithToken}
              apiKey={apiKey}
              libraryFolderId={getLastShelfId()}
              isSignedIn={googleAuth.isSignedIn}
              accessToken={googleAuth.accessToken}
            />
          </>
        )}
        </div>
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

