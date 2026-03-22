/** Safe storage helpers with IndexedDB backup for mobile/private browsing edge cases */
const DB_NAME = 'ocean5-storage'
const STORE_NAME = 'kv'

let dbPromise: Promise<IDBDatabase | null> | null = null

function canUseIndexedDb(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) return Promise.resolve(null)
  if (dbPromise) return dbPromise

  dbPromise = new Promise(resolve => {
    const request = window.indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })

  return dbPromise
}

async function readFromIndexedDb(key: string): Promise<string | null> {
  const db = await openDatabase()
  if (!db) return null

  return new Promise(resolve => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(key)

    request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null)
    request.onerror = () => resolve(null)
    tx.onabort = () => resolve(null)
  })
}

async function writeToIndexedDb(key: string, value: string): Promise<void> {
  const db = await openDatabase()
  if (!db) return

  await new Promise<void>(resolve => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
    tx.onabort = () => resolve()
  })
}

async function removeFromIndexedDb(key: string): Promise<void> {
  const db = await openDatabase()
  if (!db) return

  await new Promise<void>(resolve => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
    tx.onabort = () => resolve()
  })
}

function mirrorToLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  const localValue = getItem(key)
  if (localValue !== null) return localValue

  const backupValue = await readFromIndexedDb(key)
  if (backupValue !== null) {
    mirrorToLocalStorage(key, backupValue)
  }

  return backupValue
}

export function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }

  void writeToIndexedDb(key, value)
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }

  void removeFromIndexedDb(key)
}

export async function ensurePersistentStorage(): Promise<boolean> {
  if (
    typeof navigator === 'undefined' ||
    !('storage' in navigator) ||
    typeof navigator.storage.persist !== 'function'
  ) {
    return false
  }

  try {
    if (typeof navigator.storage.persisted === 'function' && await navigator.storage.persisted()) {
      return true
    }

    return await navigator.storage.persist()
  } catch {
    return false
  }
}
