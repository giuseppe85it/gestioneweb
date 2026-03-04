import { db } from "../firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

const MEZZI_KEY = "@mezzi_aziendali";

type SetItemSyncOptions = {
  allowRemovals?: boolean;
  removedIds?: string[];
};

function normalizeTargaKey(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function isObjectLike(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

export async function setItemSync(
  key: string,
  value: any,
  opts?: SetItemSyncOptions
) {
  try {
    const ref = doc(db, "storage", key);

    // Merge-safe path only for the mezzi document.
    if (key === MEZZI_KEY) {
      const snap = await getDoc(ref);
      const oldValue = snap.exists() ? snap.data().value : null;

      if (Array.isArray(oldValue) && Array.isArray(value)) {
        const oldArr = oldValue;
        const newArr = value;
        const allowRemovals =
          opts?.allowRemovals === true &&
          Array.isArray(opts?.removedIds) &&
          opts.removedIds.length > 0;
        const removedIdsSet = new Set(
          allowRemovals
            ? (opts?.removedIds || [])
                .map((id) => String(id ?? "").trim())
                .filter(Boolean)
            : []
        );

        const merged = [...oldArr];
        const byId = new Map<string, number>();
        const byTarga = new Map<string, number>();

        merged.forEach((item, index) => {
          if (!isObjectLike(item)) return;

          const idKey = String(item.id ?? "").trim();
          if (idKey && !byId.has(idKey)) byId.set(idKey, index);

          const targaKey = normalizeTargaKey(item.targa);
          if (targaKey && !byTarga.has(targaKey)) byTarga.set(targaKey, index);
        });

        newArr.forEach((item) => {
          if (!isObjectLike(item)) {
            merged.push(item);
            return;
          }

          const idKey = String(item.id ?? "").trim();
          const targaKey = normalizeTargaKey(item.targa);
          const idxById = idKey ? byId.get(idKey) : undefined;
          const idxByTarga = targaKey ? byTarga.get(targaKey) : undefined;
          const idx = idxById ?? idxByTarga;

          if (idx === undefined || idx < 0 || idx >= merged.length) {
            const nextIndex = merged.length;
            merged.push(item);
            if (idKey && !byId.has(idKey)) byId.set(idKey, nextIndex);
            if (targaKey && !byTarga.has(targaKey)) byTarga.set(targaKey, nextIndex);
            return;
          }

          const previous = merged[idx];
          merged[idx] = isObjectLike(previous) ? { ...previous, ...item } : item;
        });

        const mergedAfterRemovals = allowRemovals
          ? merged.filter((item) => {
              if (!isObjectLike(item)) return true;
              const idKey = String(item.id ?? "").trim();
              if (!idKey) return true;
              return !removedIdsSet.has(idKey);
            })
          : merged;

        const oldCount = oldArr.length;
        const newCount = newArr.length;
        const mergedCount = mergedAfterRemovals.length;
        const isDev = typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);

        if (isDev) {
          console.log(
            `[MEZZI_MERGE] oldCount=${oldCount} newCount=${newCount} mergedCount=${mergedCount} allowRemovals=${allowRemovals} removedIds=${
              allowRemovals ? Array.from(removedIdsSet).join(",") : ""
            }`
          );
        }

        // Anti-rollback guard: blocks only evident stale rollback patterns.
        if (!allowRemovals && mergedCount < oldCount && newCount >= oldCount) {
          console.error(
            `[MEZZI_MERGE][ROLLBACK_BLOCKED] oldCount=${oldCount} newCount=${newCount} mergedCount=${mergedCount}`
          );
          return;
        }

        await setDoc(ref, { value: mergedAfterRemovals });
        console.log("setItemSync:", key, mergedAfterRemovals);
        return;
      }
    }

    await setDoc(ref, { value: value });
    console.log("setItemSync:", key, value);
  } catch (err) {
    console.error("Errore setItemSync:", err);
  }
}

export async function getItemSync(key: string) {
  try {
    const ref = doc(db, "storage", key);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().value : null;
  } catch (err) {
    console.error("Errore getItemSync:", err);
    return null;
  }
}

export async function removeItemSync(key: string) {
  try {
    await deleteDoc(doc(db, "storage", key));
    console.log("removeItemSync:", key);
  } catch (err) {
    console.error("Errore removeItemSync:", err);
  }
}
