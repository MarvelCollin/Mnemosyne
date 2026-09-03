const API_KEY_STORAGE = "mnemosyne-gdrive-api-key"
const DRIVE_URL_STORAGE = "mnemosyne-gdrive-url"
const API_BASE = "https://www.googleapis.com/drive/v3"

export interface GDriveItem {
  id: string
  name: string
  mimeType: string
  size?: string
}

export type GDriveLinkType = "file" | "folder" | null

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE) || import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || null
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key)
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE)
}

export function getDriveUrl(): string {
  return localStorage.getItem(DRIVE_URL_STORAGE) || ""
}

export function setDriveUrl(url: string) {
  localStorage.setItem(DRIVE_URL_STORAGE, url)
}

export function clearDriveUrl() {
  localStorage.removeItem(DRIVE_URL_STORAGE)
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

const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const APP_FOLDER_NAME = "Mnemosyne";

export async function findFileByName(
  name: string,
  accessToken: string,
  folderId?: string
): Promise<GDriveItem | null> {
  let query = `name = '${name}' and trashed = false`;
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name,mimeType)",
    pageSize: "1",
  });

  const res = await fetch(`${API_BASE}/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.files?.[0] || null;
}

export async function findOrCreateAppFolder(
  accessToken: string
): Promise<string | null> {
  const existing = await findFileByName(APP_FOLDER_NAME, accessToken);
  if (existing) return existing.id;

  const metadata = {
    name: APP_FOLDER_NAME,
    mimeType: "application/vnd.google-apps.folder",
  };

  const res = await fetch(`${API_BASE}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.id;
}

export async function uploadJsonFile(
  name: string,
  content: string,
  accessToken: string,
  folderId?: string
): Promise<string | null> {
  const targetFolderId = folderId || (await findOrCreateAppFolder(accessToken));
  if (!targetFolderId) return null;

  const existingFile = await findFileByName(name, accessToken, targetFolderId);

  if (existingFile) {
    const res = await fetch(`${UPLOAD_BASE}/files/${existingFile.id}?uploadType=media`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: content,
    });
    if (!res.ok) return null;
    return existingFile.id;
  }

  const metadata = {
    name,
    mimeType: "application/json",
    parents: [targetFolderId],
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", new Blob([content], { type: "application/json" }));

  const res = await fetch(`${UPLOAD_BASE}/files?uploadType=multipart`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.id;
}

export async function downloadFileWithToken(
  fileId: string,
  accessToken: string
): Promise<string | null> {
  const params = new URLSearchParams({ alt: "media" });
  const res = await fetch(`${API_BASE}/files/${fileId}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;
  return res.text();
}

export async function loadJsonFromAppFolder(
  name: string,
  accessToken: string
): Promise<string | null> {
  const folderId = await findOrCreateAppFolder(accessToken);
  if (!folderId) return null;

  const file = await findFileByName(name, accessToken, folderId);
  if (!file) return null;

  return downloadFileWithToken(file.id, accessToken);
}
