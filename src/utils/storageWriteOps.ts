import {
  deleteObject as firebaseDeleteObject,
  uploadBytes as firebaseUploadBytes,
  uploadString as firebaseUploadString,
} from "firebase/storage";
import { assertCloneWriteAllowed } from "./cloneWriteBarrier";

function getStoragePath(reference: unknown): string | null {
  if (!reference || typeof reference !== "object") return null;
  const path = (reference as { fullPath?: unknown }).fullPath;
  return typeof path === "string" && path.trim() ? path : null;
}

function getPayloadMeta(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const size = (value as { size?: unknown }).size;
  return typeof size === "number" && Number.isFinite(size) ? { size } : undefined;
}

export function uploadBytes(reference: any, data: any, metadata?: any) {
  assertCloneWriteAllowed("storage.uploadBytes", {
    path: getStoragePath(reference),
    ...(getPayloadMeta(data) ?? {}),
  });
  return metadata === undefined
    ? firebaseUploadBytes(reference, data)
    : firebaseUploadBytes(reference, data, metadata);
}

export function uploadString(
  reference: any,
  value: string,
  format?: any,
  metadata?: any
) {
  assertCloneWriteAllowed("storage.uploadString", {
    path: getStoragePath(reference),
    valueLength: value.length,
  });

  if (format === undefined) {
    return firebaseUploadString(reference, value);
  }

  if (metadata === undefined) {
    return firebaseUploadString(reference, value, format);
  }

  return firebaseUploadString(reference, value, format, metadata);
}

export function deleteObject(reference: any) {
  assertCloneWriteAllowed("storage.deleteObject", {
    path: getStoragePath(reference),
  });
  return firebaseDeleteObject(reference);
}
