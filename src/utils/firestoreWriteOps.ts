import {
  addDoc as firebaseAddDoc,
  deleteDoc as firebaseDeleteDoc,
  setDoc as firebaseSetDoc,
  updateDoc as firebaseUpdateDoc,
} from "firebase/firestore";
import { assertCloneWriteAllowed } from "./cloneWriteBarrier";

function getReferencePath(reference: unknown): string | null {
  if (!reference || typeof reference !== "object") return null;
  const path = (reference as { path?: unknown }).path;
  return typeof path === "string" && path.trim() ? path : null;
}

export function addDoc(reference: any, data: any) {
  assertCloneWriteAllowed("firestore.addDoc", {
    path: getReferencePath(reference),
  });
  return firebaseAddDoc(reference, data);
}

export function updateDoc(reference: any, dataOrField: any, ...moreFieldsAndValues: any[]) {
  assertCloneWriteAllowed("firestore.updateDoc", {
    path: getReferencePath(reference),
  });
  return (firebaseUpdateDoc as any)(reference, dataOrField, ...moreFieldsAndValues);
}

export function setDoc(reference: any, data: any, options?: any) {
  assertCloneWriteAllowed("firestore.setDoc", {
    path: getReferencePath(reference),
  });
  return options === undefined
    ? firebaseSetDoc(reference, data)
    : firebaseSetDoc(reference, data, options);
}

export function deleteDoc(reference: any) {
  assertCloneWriteAllowed("firestore.deleteDoc", {
    path: getReferencePath(reference),
  });
  return firebaseDeleteDoc(reference);
}
