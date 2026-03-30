/* eslint-disable @typescript-eslint/no-explicit-any */
import { db, storage } from "../../firebase";
import {
  doc as firestoreDoc,
  getDoc as firestoreGetDoc,
  setDoc as firestoreSetDoc,
} from "firebase/firestore";
import { deleteObject as firebaseDeleteObject, ref as storageRef } from "firebase/storage";
import { isCloneRuntime } from "../../utils/cloneWriteBarrier";

type CloneDocValue = Record<string, unknown>;

const cloneDocOverrides = new Map<string, CloneDocValue>();
const cloneDeletedStoragePaths = new Set<string>();

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export { db, storage };
export const doc = firestoreDoc;
export const ref = storageRef;

export async function getDoc(reference: any) {
  const snapshot = await firestoreGetDoc(reference);

  if (!isCloneRuntime()) {
    return snapshot;
  }

  const path = String(reference?.path ?? "");
  const baseData =
    typeof snapshot?.exists === "function" && snapshot.exists() ? snapshot.data() : undefined;
  const override = cloneDocOverrides.get(path);

  if (!override) {
    return snapshot;
  }

  const merged = {
    ...(baseData && typeof baseData === "object" ? cloneValue(baseData) : {}),
    ...cloneValue(override),
  };

  return {
    exists: () => true,
    data: () => merged,
    id: snapshot?.id ?? reference?.id ?? path,
    ref: reference,
  };
}

export async function setDoc(reference: any, value: unknown, options?: { merge?: boolean }) {
  if (!isCloneRuntime()) {
    return firestoreSetDoc(reference, value as any, options as any);
  }

  const path = String(reference?.path ?? "");
  const nextValue =
    value && typeof value === "object" && !Array.isArray(value)
      ? (cloneValue(value) as CloneDocValue)
      : ({ value: cloneValue(value) } as CloneDocValue);

  if (options?.merge) {
    const previous = cloneDocOverrides.get(path) ?? {};
    cloneDocOverrides.set(path, { ...previous, ...nextValue });
  } else {
    cloneDocOverrides.set(path, nextValue);
  }

  if (typeof console !== "undefined") {
    console.warn("[NEXT_AUTISTI_ADMIN_CLONE] Scrittura Firestore neutralizzata", {
      path,
      merge: Boolean(options?.merge),
    });
  }
}

export async function deleteObject(reference: any) {
  if (!isCloneRuntime()) {
    return firebaseDeleteObject(reference);
  }

  const fullPath = String(reference?.fullPath ?? reference?._location?.path ?? "");
  if (fullPath) {
    cloneDeletedStoragePaths.add(fullPath);
  }

  if (typeof console !== "undefined") {
    console.warn("[NEXT_AUTISTI_ADMIN_CLONE] Delete Storage neutralizzato", {
      fullPath,
    });
  }
}

export function isNextAutistiAdminStorageDeleted(path: string | null | undefined) {
  const normalized = String(path ?? "").trim();
  return normalized ? cloneDeletedStoragePaths.has(normalized) : false;
}
