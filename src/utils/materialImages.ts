// src/utils/materialImages.ts
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "../firebase";

/**
 * Carica una foto di materiale su Firebase Storage.
 * @param file File selezionato dall'utente
 * @param materialId id del materiale (usato nel path)
 */
export async function uploadMaterialImage(file: File, materialId: string) {
  const storage = getStorage(app);
  const path = `materiali/${materialId}-${Date.now()}.${file.name.split(".").pop() || "jpg"}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return {
    fotoUrl: url,
    fotoStoragePath: path,
  };
}

/**
 * Elimina una foto di materiale da Firebase Storage, se esiste.
 */
export async function deleteMaterialImage(storagePath?: string | null) {
  if (!storagePath) return;
  const storage = getStorage(app);
  const storageRef = ref(storage, storagePath);
  try {
    await deleteObject(storageRef);
  } catch (err) {
    console.error("Errore eliminazione immagine da Storage:", err);
  }
}
