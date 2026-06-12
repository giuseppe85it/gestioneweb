import { ref } from "firebase/storage";
import { storage } from "../../firebase";
import { getItemSync, setItemSync } from "../../utils/storageSync";
import { deleteObject } from "../../utils/storageWriteOps";
import {
  assertCloneWriteAllowed,
  CloneWriteBlockedError,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";
import {
  readLegameLavoro,
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
        const segnalazioniRaw = await getItemSync(SEGNALAZIONI_KEY);
        const segnalazioniList = unwrapList(segnalazioniRaw);
        const sourceIndex = segnalazioniList.findIndex(
          (record) => normalizeText(record.id) === segnalazioneId,
        );
        if (sourceIndex < 0) {
          return { ok: false, error: "Segnalazione non trovata." };
        }
        const sourceRecord = segnalazioniList[sourceIndex];
        const linkedManutenzioneIds = readLegameLavoro(sourceRecord);
        const fotoPaths = readFotoStoragePaths(sourceRecord);

        let detachedManutenzioneIds: string[] = [];
        if (linkedManutenzioneIds.length > 0) {
          const manutenzioniRaw = await getItemSync(MANUTENZIONI_KEY);
          const manutenzioniList = unwrapList(manutenzioniRaw);
          const linkedSet = new Set(linkedManutenzioneIds);
          let changed = false;
          const nextManutenzioni = manutenzioniList.map((record) => {
            const id = normalizeText(record.id);
            if (!linkedSet.has(id)) return record;
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
