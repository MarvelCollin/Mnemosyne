const API_KEY_STORAGE = "mnemosyne-gdrive-api-key"
const API_BASE = "https://www.googleapis.com/drive/v3"

export interface GDriveItem {
  id: string
  name: string
  mimeType: string
  size?: string
}

export type GDriveLinkType = "file" | "folder" | null

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE)
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key)
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE)
}

export function parseGDriveUrl(url: string): { type: GDriveLinkType; id: string | null } {
  try {
    const u = new URL(url.trim())
    if (!u.hostname.includes("drive.google.com") && !u.hostname.includes("docs.google.com")) {
      return { type: null, id: null }
    }

    const folderMatch = u.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/)
    if (folderMatch) return { type: "folder", id: folderMatch[1] }

    const fileMatch = u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileMatch) return { type: "file", id: fileMatch[1] }

    const idParam = u.searchParams.get("id")
    if (idParam) return { type: "file", id: idParam }

    return { type: null, id: null }
  } catch {
    return { type: null, id: null }
  }
}

export async function listFolder(folderId: string, apiKey: string): Promise<GDriveItem[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    key: apiKey,
    fields: "files(id,name,mimeType,size)",
    pageSize: "100",
    orderBy: "folder,name",
  })

  const res = await fetch(`${API_BASE}/files?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Google Drive API error: ${res.status}`)
  }
  const data = await res.json()
  return data.files as GDriveItem[]
}

export async function downloadFile(fileId: string, apiKey: string): Promise<ArrayBuffer> {
  const params = new URLSearchParams({ alt: "media", key: apiKey })
  const res = await fetch(`${API_BASE}/files/${fileId}?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Download failed: ${res.status}`)
  }
  return res.arrayBuffer()
}

export async function getFileName(fileId: string, apiKey: string): Promise<string> {
  const params = new URLSearchParams({ key: apiKey, fields: "name" })
  const res = await fetch(`${API_BASE}/files/${fileId}?${params}`)
  if (!res.ok) return "document.pdf"
  const data = await res.json()
  return data.name || "document.pdf"
}

export async function getFolderName(folderId: string, apiKey: string): Promise<string> {
  const params = new URLSearchParams({ key: apiKey, fields: "name" })
  const res = await fetch(`${API_BASE}/files/${folderId}?${params}`)
  if (!res.ok) return "Folder"
  const data = await res.json()
  return data.name || "Folder"
}
