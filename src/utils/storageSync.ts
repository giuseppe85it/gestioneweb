import { db } from "../firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

export async function setItemSync(key: string, value: any) {
  try {
    await setDoc(doc(db, "storage", key), { value: value });
    console.log("✔ setItemSync:", key, value);
  } catch (err) {
    console.error("❌ Errore setItemSync:", err);
  }
}

export async function getItemSync(key: string) {
  try {
    const ref = doc(db, "storage", key);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().value : null;
  } catch (err) {
    console.error("❌ Errore getItemSync:", err);
    return null;
  }
}

export async function removeItemSync(key: string) {
  try {
    await deleteDoc(doc(db, "storage", key));
    console.log("✔ removeItemSync:", key);
  } catch (err) {
    console.error("❌ Errore removeItemSync:", err);
  }
}
