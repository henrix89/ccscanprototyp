// src/indexedDb.ts
import { openDB } from 'idb';

export const dbPromise = openDB('VareDB', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('varer')) {
      db.createObjectStore('varer');
    }
  },
});

export async function settInnVaredata(varedata: Record<string, any>) {
  const db = await dbPromise;
  const tx = db.transaction('varer', 'readwrite');
  const store = tx.objectStore('varer');
  await store.put(varedata, 'fullListe');
  await tx.done;
}

export async function hentVaredata(): Promise<Record<string, any> | null> {
  const db = await dbPromise;
  const tx = db.transaction('varer', 'readonly');
  const store = tx.objectStore('varer');
  const data = await store.get('fullListe');
  await tx.done;
  return data ?? null;
}
