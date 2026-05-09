import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";

export const RIFORNIMENTI_WRITE_SCOPE = "centro_controllo_rifornimenti_write";

const STORAGE_COLLECTION = "storage";
const DOSSIER_RIFORNIMENTI_KEY = "@rifornimenti";
const FIELD_RIFORNIMENTI_KEY = "@rifornimenti_autisti_tmp";
const LAST_MODIFIED_SOURCE = "centro_controllo_next";

export type NextRifornimentoEditablePayload = {
  tipo: "caravate" | "distributore";
  metodoPagamento: "piccadilly" | "eni" | "contanti" | null;
  paese: "IT" | "CH" | null;
  km: number | null;
  litri: number | null;
  importo: number | null;
  note: string;
};

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deriveDistributoreLabel(
  tipo: NextRifornimentoEditablePayload["tipo"],
  metodo: NextRifornimentoEditablePayload["metodoPagamento"],
  paese: NextRifornimentoEditablePayload["paese"],
): string {
  const parts: string[] = [];
  if (tipo) parts.push(String(tipo));
  if (paese) parts.push(String(paese));
  if (metodo) parts.push(String(metodo));
  return parts.length ? parts.join(" ") : "-";
}

function unwrapItems(rawDoc: unknown): {
  shape: "items" | "value.items" | "missing";
  items: unknown[];
} {
  if (!isRecord(rawDoc)) return { shape: "missing", items: [] };
  if (Array.isArray(rawDoc.items)) return { shape: "items", items: rawDoc.items };
  if (
    isRecord(rawDoc.value) &&
    Array.isArray((rawDoc.value as RawRecord).items)
  ) {
    return {
      shape: "value.items",
      items: ((rawDoc.value as RawRecord).items as unknown[]),
    };
  }
  return { shape: "missing", items: [] };
}

function findIndexById(items: unknown[], id: string): number {
  return items.findIndex(
    (entry) => isRecord(entry) && String(entry.id ?? "").trim() === id,
  );
}

function buildDossierItemPatch(
  current: RawRecord,
  patch: NextRifornimentoEditablePayload,
  now: number,
): RawRecord {
  const distributore = deriveDistributoreLabel(
    patch.tipo,
    patch.metodoPagamento,
    patch.paese,
  );
  return {
    ...current,
    litri: patch.litri,
    km: patch.km,
    distributore,
    costo: patch.importo,
    note: patch.note ?? "",
    lastModifiedAt: now,
    lastModifiedSource: LAST_MODIFIED_SOURCE,
  };
}

function buildBufferItemPatch(
  current: RawRecord,
  patch: NextRifornimentoEditablePayload,
  now: number,
): RawRecord {
  return {
    ...current,
    tipo: patch.tipo,
    metodoPagamento: patch.tipo === "distributore" ? patch.metodoPagamento : null,
    paese: patch.tipo === "distributore" ? patch.paese : null,
    km: patch.km,
    litri: patch.litri,
    importo: patch.importo,
    note: patch.note ?? "",
    lastModifiedAt: now,
    lastModifiedSource: LAST_MODIFIED_SOURCE,
  };
}

export async function updateNextRifornimento(
  rifornimentoId: string,
  patch: NextRifornimentoEditablePayload,
): Promise<{ ok: boolean; error?: string; foundDossier?: boolean; foundBuffer?: boolean }> {
  const id = String(rifornimentoId ?? "").trim();
  if (!id) {
    return { ok: false, error: "ID rifornimento mancante." };
  }

  const now = Date.now();

  let foundDossier = false;
  let foundBuffer = false;

  try {
    await runWithCloneWriteScopedAllowance(
      RIFORNIMENTI_WRITE_SCOPE,
      async () => {
        const dossierRef = doc(db, STORAGE_COLLECTION, DOSSIER_RIFORNIMENTI_KEY);
        const snap = await getDoc(dossierRef);
        const rawDoc = snap.exists() ? (snap.data() as RawRecord) : null;
        const { shape, items } = unwrapItems(rawDoc);
        const idx = findIndexById(items, id);
        if (idx >= 0) {
          foundDossier = true;
          const current = items[idx] as RawRecord;
          const updated = buildDossierItemPatch(current, patch, now);
          const nextItems = items.slice();
          nextItems[idx] = updated;
          let nextDocPayload: RawRecord;
          if (shape === "value.items") {
            const value = isRecord(rawDoc?.value) ? (rawDoc!.value as RawRecord) : {};
            nextDocPayload = {
              ...(rawDoc ?? {}),
              value: { ...value, items: nextItems },
            };
          } else {
            nextDocPayload = { ...(rawDoc ?? {}), items: nextItems };
          }
          await setDoc(dossierRef, nextDocPayload);
        }

        const bufferRaw = await getItemSync(FIELD_RIFORNIMENTI_KEY);
        const bufferList = Array.isArray(bufferRaw) ? bufferRaw : [];
        const bufferIdx = findIndexById(bufferList as unknown[], id);
        if (bufferIdx >= 0) {
          foundBuffer = true;
          const current = bufferList[bufferIdx] as RawRecord;
          const updated = buildBufferItemPatch(current, patch, now);
          const nextBuffer = bufferList.slice();
          nextBuffer[bufferIdx] = updated;
          await setItemSync(FIELD_RIFORNIMENTI_KEY, nextBuffer);
        }
      },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Errore salvataggio rifornimento.";
    return { ok: false, error: message, foundDossier, foundBuffer };
  }

  if (!foundDossier && !foundBuffer) {
    return {
      ok: false,
      error: "Rifornimento non trovato in nessuno dei dataset.",
      foundDossier,
      foundBuffer,
    };
  }

  return { ok: true, foundDossier, foundBuffer };
}
