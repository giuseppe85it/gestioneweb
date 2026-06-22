import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { setItemSync } from "../../utils/storageSync";
import {
  assertCloneWriteAllowed,
  CloneWriteBlockedError,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";
import {
  readLegameLavoro,
  readLegamiOrigine,
  removeLegameOrigine,
} from "../helpers/cicloLegame";

export const NEXT_CONTROLLO_DELETE_WRITE_SCOPE = "next_controllo_delete_write_scope";

const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const MANUTENZIONI_KEY = "@manutenzioni";

type RawRecord = Record<string, unknown>;

export type DeleteControlloAutistaInput = {
  controlloId: string;
};

export type DeleteControlloAutistaResult = {
  ok: boolean;
  error?: string;
  removedId?: string;
  detachedManutenzioneIds?: string[];
};

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) {
    return raw.value.filter(isRecord);
  }
  if (isRecord(raw) && Array.isArray(raw.items)) {
    return raw.items.filter(isRecord);
  }
  return [];
}

/**
 * Lettura DIRETTA dal documento storage Firestore (come il delete segnalazione),
 * per vedere esattamente cio' che e' persistito e ricevera' la scrittura.
 */
async function readStorageListDirect(key: string): Promise<RawRecord[]> {
  const snap = await getDoc(doc(db, "storage", key));
  if (!snap.exists()) return [];
  return unwrapList(snap.data());
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function blockedResult(error: unknown): DeleteControlloAutistaResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      error:
        "Scrittura bloccata dal barrier clone (eliminazione controllo). Verificare pagina e scope autorizzati.",
    };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Eliminazione controllo non riuscita.",
  };
}

/**
 * Elimina un controllo KO (record @controlli_mezzo_autisti) e ripulisce i legami
 * sulle manutenzioni collegate in ENTRAMBE le direzioni (come il delete segnalazione):
 *  - forward-link: il controllo punta alla manutenzione (linkedLavoroId);
 *  - back-link:    la manutenzione punta al controllo (origineRefs/origineRefId).
 * Cosi' non lascia "origini orfane". NON tocca le foto Storage del controllo
 * (eventuali allegati restano; pulizia Storage non gestita qui).
 */
export async function deleteControlloAutista(
  input: DeleteControlloAutistaInput,
): Promise<DeleteControlloAutistaResult> {
  const controlloId = normalizeText(input.controlloId);
  if (!controlloId) return { ok: false, error: "ID controllo mancante." };

  try {
    return await runWithCloneWriteScopedAllowance(
      NEXT_CONTROLLO_DELETE_WRITE_SCOPE,
      async () => {
        const controlliList = await readStorageListDirect(CONTROLLI_KEY);
        const sourceIndex = controlliList.findIndex(
          (record) => normalizeText(record.id) === controlloId,
        );
        if (sourceIndex < 0) {
          return { ok: false, error: "Controllo non trovato." };
        }
        const sourceRecord = controlliList[sourceIndex];
        const linkedSet = new Set(readLegameLavoro(sourceRecord));

        let detachedManutenzioneIds: string[] = [];
        const manutenzioniList = await readStorageListDirect(MANUTENZIONI_KEY);
        let changed = false;
        const nextManutenzioni = manutenzioniList.map((record) => {
          const id = normalizeText(record.id);
          const isForwardLinked = linkedSet.has(id);
          const isBackLinked = readLegamiOrigine(record).some(
            (legame) =>
              legame.tipo === "controllo" &&
              normalizeText(legame.refId) === controlloId,
          );
          if (!isForwardLinked && !isBackLinked) return record;
          changed = true;
          detachedManutenzioneIds = [...detachedManutenzioneIds, id];
          return {
            ...record,
            ...removeLegameOrigine(record, {
              tipo: "controllo",
              refId: controlloId,
              refKey: CONTROLLI_KEY,
            }),
          };
        });

        if (changed) {
          assertCloneWriteAllowed("storageSync.setItemSync", { key: MANUTENZIONI_KEY });
          await setItemSync(MANUTENZIONI_KEY, nextManutenzioni);
        }

        const nextControlli = controlliList.filter(
          (record) => normalizeText(record.id) !== controlloId,
        );
        assertCloneWriteAllowed("storageSync.setItemSync", { key: CONTROLLI_KEY });
        await setItemSync(CONTROLLI_KEY, nextControlli);

        return {
          ok: true,
          removedId: controlloId,
          detachedManutenzioneIds,
        };
      },
    );
  } catch (error: unknown) {
    return blockedResult(error);
  }
}
