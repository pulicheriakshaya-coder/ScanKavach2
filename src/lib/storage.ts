/**
 * @file src/lib/storage.ts
 * @description Safe IndexedDB and SessionStorage access with in-memory fallback.
 */

import { STORAGE_PREFIX } from '../config';

const DB_NAME = 'scankavach_db';
const DB_VERSION = 1;
const STORE_NAME = 'kv_store';

const memoryFallback = new Map<string, unknown>();

/**
 * Opens or initializes the IndexedDB database instance.
 * @returns Promise resolving to IDBDatabase or null.
 */
function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Retrieves a value from IndexedDB with in-memory fallback.
 * @param key - Identifier key.
 * @returns Stored value or null.
 */
export async function getStorageItem<T>(key: string): Promise<T | null> {
  const fullKey = `${STORAGE_PREFIX}${key}`;
  try {
    const db = await openDatabase();
    if (!db) {
      return (memoryFallback.get(fullKey) as T) ?? null;
    }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(fullKey);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve((memoryFallback.get(fullKey) as T) ?? null);
    });
  } catch {
    return (memoryFallback.get(fullKey) as T) ?? null;
  }
}

/**
 * Stores a value in IndexedDB and in-memory cache.
 * @param key - Identifier key.
 * @param value - Value to persist.
 */
export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  const fullKey = `${STORAGE_PREFIX}${key}`;
  memoryFallback.set(fullKey, value);
  try {
    const db = await openDatabase();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, fullKey);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Graceful fallback to memory
  }
}

/**
 * Removes a key from IndexedDB and memory.
 * @param key - Identifier key.
 */
export async function removeStorageItem(key: string): Promise<void> {
  const fullKey = `${STORAGE_PREFIX}${key}`;
  memoryFallback.delete(fullKey);
  try {
    const db = await openDatabase();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(fullKey);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore error
  }
}

/**
 * Safely accesses sessionStorage.
 * @param key - Storage key.
 * @returns Parsed JSON object or null.
 */
export function getSessionItem<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Safely writes to sessionStorage.
 * @param key - Storage key.
 * @param value - Serializable value.
 */
export function setSessionItem<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // In-memory or private browsing quota handled
  }
}

/**
 * Safely removes an item from sessionStorage.
 * @param key - Storage key.
 */
export function removeSessionItem(key: string): void {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Ignore error
  }
}
