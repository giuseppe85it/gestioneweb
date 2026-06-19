/**
 * Writer del modulo "Materiali da ordinare" (Acquisti) per preventivi e listino.
 *
 * Tutte le scritture rispettano il clone write barrier per /next/materiali-da-ordinare:
 * SOLO firestore.setDoc su storage/@preventivi · @listino_prezzi e storage.uploadBytes
 * sui prefissi preventivi/manuali|ia. NON sono ammessi deleteDoc/updateDoc: le
 * eliminazioni e gli aggiornamenti avvengono RISCRIVENDO l'array del documento con
 * setDoc({ merge: true }). Le letture usano getDoc nativo (non passa dal barrier).
 */
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { setDoc } from "../utils/firestoreWriteOps";
import {
  uploadPreventivoManualeFoto,
  type Preventivo,
} from "./nextPreventivoManualeWriter";

const STORAGE_COLLECTION = "storage";
const PREVENTIVI_DOC_ID = "@preventivi";
const LISTINO_DOC_ID = "@listino_prezzi";

/** Converte ricorsivamente i valori `undefined` in `null` (Firestore non accetta undefined). */
function sanitizeUndefinedToNull<T>(value: T): T {
  if (value === undefined) return null as T;
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUndefinedToNull(item)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      out[key] = item === undefined ? null : sanitizeUndefinedToNull(item);
    });
    return out as T;
  }
  return value;
}

async function readPreventivi(): Promise<Preventivo[]> {
  const ref = doc(collection(db, STORAGE_COLLECTION), PREVENTIVI_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const value = snap.data()?.preventivi;
  return Array.isArray(value) ? (value as Preventivo[]) : [];
}

async function writePreventivi(next: Preventivo[]): Promise<void> {
  const ref = doc(collection(db, STORAGE_COLLECTION), PREVENTIVI_DOC_ID);
  await setDoc(ref, sanitizeUndefinedToNull({ preventivi: next }), { merge: true });
}

/** Elimina un preventivo dall'array di @preventivi (riscrittura, non deleteDoc). */
export async function deleteNextPreventivo(preventivoId: string): Promise<void> {
  const current = await readPreventivi();
  const next = current.filter((entry) => entry.id !== preventivoId);
  await writePreventivi(next);
}

/** Aggiorna un preventivo esistente (merge del patch su testata/righe), preservando id/createdAt/allegati non modificati. */
export async function updateNextPreventivo(id: string, patch: Partial<Preventivo>): Promise<void> {
  const current = await readPreventivi();
  const idx = current.findIndex((entry) => entry.id === id);
  if (idx < 0) {
    throw new Error("Preventivo non trovato.");
  }
  const next = [...current];
  next[idx] = { ...current[idx], ...patch, id, updatedAt: Date.now() };
  await writePreventivi(next);
}

/** Rimuove i riferimenti agli allegati IA (immagini) da tutti i preventivi. */
export async function cleanPreventiviIaAttachments(): Promise<number> {
  const current = await readPreventivi();
  let puliti = 0;
  const next = current.map((entry) => {
    const hasImages =
      (Array.isArray(entry.imageStoragePaths) && entry.imageStoragePaths.length > 0) ||
      (Array.isArray(entry.imageUrls) && entry.imageUrls.length > 0);
    if (!hasImages) return entry;
    puliti += 1;
    const { imageStoragePaths: _paths, imageUrls: _urls, ...rest } = entry;
    void _paths;
    void _urls;
    return { ...rest, updatedAt: Date.now() } as Preventivo;
  });
  if (puliti > 0) {
    await writePreventivi(next);
  }
  return puliti;
}

/** Carica le foto e le collega a un preventivo (aggiorna imageStoragePaths/imageUrls). */
export async function attachFotoToPreventivo(preventivoId: string, files: File[]): Promise<void> {
  if (!files.length) return;
  const { imageStoragePaths, imageUrls } = await uploadPreventivoManualeFoto({
    preventivoId,
    foto: files,
    prefix: "preventivi/manuali/",
    strict: true,
  });
  const current = await readPreventivi();
  const idx = current.findIndex((entry) => entry.id === preventivoId);
  if (idx < 0) {
    throw new Error("Preventivo non trovato.");
  }
  const prev = current[idx];
  const next = [...current];
  next[idx] = {
    ...prev,
    imageStoragePaths: [...(prev.imageStoragePaths ?? []), ...imageStoragePaths],
    imageUrls: [...(prev.imageUrls ?? []), ...imageUrls],
    updatedAt: Date.now(),
  };
  await writePreventivi(next);
}

/** Elimina una voce dal listino @listino_prezzi (riscrittura array `voci`). */
export async function deleteNextListinoVoce(voceId: string): Promise<void> {
  const ref = doc(collection(db, STORAGE_COLLECTION), LISTINO_DOC_ID);
  const snap = await getDoc(ref);
  const current: Array<{ id: string }> = snap.exists()
    ? Array.isArray(snap.data()?.voci)
      ? (snap.data()?.voci as Array<{ id: string }>)
      : []
    : [];
  const next = current.filter((voce) => voce.id !== voceId);
  await setDoc(ref, sanitizeUndefinedToNull({ voci: next }), { merge: true });
}
