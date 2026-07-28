const DB_NAME = "mnemosyne"
const DB_VERSION = 1
const STORE_NAME = "documents"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function persistDocument(file: File): Promise<void> {
  const db = await openDB()
  const buffer = await file.arrayBuffer()
  const tx = db.transaction(STORE_NAME, "readwrite")
  tx.objectStore(STORE_NAME).put(
    { buffer, name: file.name, size: file.size, type: file.type },
    "current"
  )
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function loadPersistedDocument(): Promise<File | null> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, "readonly")
  const request = tx.objectStore(STORE_NAME).get("current")
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close()
      const result = request.result
      if (result) {
        resolve(new File([result.buffer], result.name, { type: result.type }))
      } else {
        resolve(null)
      }
    }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function clearPersistedDocument(): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, "readwrite")
  tx.objectStore(STORE_NAME).delete("current")
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
