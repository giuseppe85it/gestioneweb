import { ref } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { setItemSync } from "../../utils/storageSync";
import { deleteObject } from "../../utils/storageWriteOps";
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

export const NEXT_SEGNALAZIONE_DELETE_WRITE_SCOPE = "next_segnalazione_delete_write_scope";

const MANUTENZIONI_KEY = "@manutenzioni";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";

type RawRecord = Record<string, unknown>;

export type DeleteSegnalazioneAutistaInput = {
  segnalazioneId: string;
};

export type DeleteSegnalazioneAutistaResult = {
  ok: boolean;
  error?: string;
  removedId?: string;
  detachedManutenzioneIds?: string[];
  deletedFotoPaths?: string[];
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
 * Lettura DIRETTA dal documento storage Firestore (stesso percorso usato dal
 * pannello per mostrare le origini), invece di `getItemSync` che in clone runtime
 * passa per l'overlay. Garantisce che il delete veda esattamente cio' che e'
 * persistito (e che ricevera' la scrittura), evitando il falso "non trovata".
 */
async function readStorageListDirect(key: string): Promise<RawRecord[]> {
  const snap = await getDoc(doc(db, "storage", key));
  if (!snap.exists()) return [];
  return unwrapList(snap.data());
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function pushPath(paths: Set<string>, value: unknown): void {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  if (!trimmed) return;
  if (/^https?:\/\//i.test(trimmed)) {
    const decoded = extractFirebaseStoragePathFromUrl(trimmed);
    if (decoded) paths.add(decoded);
    return;
  }
  if (/^(blob:|data:)/i.test(trimmed)) return;
  paths.add(trimmed.replace(/^\/+/, ""));
}

function extractFirebaseStoragePathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = "/o/";
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    const encodedPath = parsed.pathname.slice(markerIndex + marker.length);
    const path = decodeURIComponent(encodedPath).trim();
    return path || null;
  } catch {
    return null;
  }
}

function readFotoStoragePaths(record: RawRecord): string[] {
  const paths = new Set<string>();
  pushPath(paths, record.fotoStoragePath);
  if (Array.isArray(record.fotoStoragePaths)) {
    record.fotoStoragePaths.forEach((entry) => pushPath(paths, entry));
  }
  if (Array.isArray(record.fotoUrls)) {
    record.fotoUrls.forEach((entry) => pushPath(paths, entry));
  }
  return Array.from(paths);
}

function blockedResult(error: unknown): DeleteSegnalazioneAutistaResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      error:
        "Scrittura bloccata dal barrier clone (eliminazione segnalazione). Verificare pagina e scope autorizzati.",
    };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Eliminazione segnalazione non riuscita.",
  };
}

async function deleteFotoPaths(paths: readonly string[]): Promise<string[]> {
  const deleted: string[] = [];
  for (const path of paths) {
    try {
      await deleteObject(ref(storage, path));
      deleted.push(path);
    } catch (error) {
      const code = isRecord(error) ? normalizeText(error.code) : "";
      if (code === "storage/object-not-found") {
        deleted.push(path);
        continue;
      }
      console.warn("Foto segnalazione non eliminata:", path, error);
    }
  }
  return deleted;
}

export async function deleteSegnalazioneAutista(
  input: DeleteSegnalazioneAutistaInput,
): Promise<DeleteSegnalazioneAutistaResult> {
  const segnalazioneId = normalizeText(input.segnalazioneId);
  if (!segnalazioneId) return { ok: false, error: "ID segnalazione mancante." };

  try {
    return await runWithCloneWriteScopedAllowance(
      NEXT_SEGNALAZIONE_DELETE_WRITE_SCOPE,
      async () => {
        const segnalazioniList = await readStorageListDirect(SEGNALAZIONI_KEY);
        const sourceIndex = segnalazioniList.findIndex(
          (record) => normalizeText(record.id) === segnalazioneId,
        );
        if (sourceIndex < 0) {
          return { ok: false, error: "Segnalazione non trovata." };
        }
        const sourceRecord = segnalazioniList[sourceIndex];
        const linkedManutenzioneIds = readLegameLavoro(sourceRecord);
        const fotoPaths = readFotoStoragePaths(sourceRecord);

        // Pulisci i riferimenti su TUTTE le manutenzioni collegate, in ENTRAMBE
        // le direzioni del legame:
        //  - forward-link: la segnalazione punta alla manutenzione (linkedLavoroId);
        //  - back-link:    la manutenzione punta alla segnalazione (origineRefs/
        //                  origineRefId), anche quando la segnalazione NON ha
        //                  linkedLavoroId (legame unidirezionale, frequente nei
        //                  dati legacy/migrati).
        // Senza il ramo back-link la cancellazione lasciava "origini orfane"
        // (manutenzioni che puntano a una segnalazione ormai sparita).
        let detachedManutenzioneIds: string[] = [];
        const linkedSet = new Set(linkedManutenzioneIds);
        const manutenzioniList = await readStorageListDirect(MANUTENZIONI_KEY);
        let changed = false;
        const nextManutenzioni = manutenzioniList.map((record) => {
          const id = normalizeText(record.id);
          const isForwardLinked = linkedSet.has(id);
          const isBackLinked = readLegamiOrigine(record).some(
            (legame) =>
              legame.tipo === "segnalazione" &&
              normalizeText(legame.refId) === segnalazioneId,
          );
          if (!isForwardLinked && !isBackLinked) return record;
          changed = true;
          detachedManutenzioneIds = [...detachedManutenzioneIds, id];
          return {
            ...record,
            ...removeLegameOrigine(record, {
              tipo: "segnalazione",
              refId: segnalazioneId,
              refKey: SEGNALAZIONI_KEY,
            }),
          };
        });

        if (changed) {
          assertCloneWriteAllowed("storageSync.setItemSync", { key: MANUTENZIONI_KEY });
          await setItemSync(MANUTENZIONI_KEY, nextManutenzioni);
        }

        const nextSegnalazioni = segnalazioniList.filter(
          (record) => normalizeText(record.id) !== segnalazioneId,
        );
        assertCloneWriteAllowed("storageSync.setItemSync", { key: SEGNALAZIONI_KEY });
        await setItemSync(SEGNALAZIONI_KEY, nextSegnalazioni);

        const deletedFotoPaths = await deleteFotoPaths(fotoPaths);
        return {
          ok: true,
          removedId: segnalazioneId,
          detachedManutenzioneIds,
          deletedFotoPaths,
        };
      },
    );
  } catch (error: unknown) {
    return blockedResult(error);
  }
}
