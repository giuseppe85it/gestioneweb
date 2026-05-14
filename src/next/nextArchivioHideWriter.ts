// PROMPT 31.1 — writer hide flag Archivio Storico.
// Soft-hide di un record (manutenzione/segnalazione/richiesta)
// patch UN SOLO campo: `nascostoInArchivio: boolean`.
// Riusa il pattern dei writer NEXT esistenti (markSegnalazioneChiusa,
// markRichiestaEvasa) basato su storageSync + cloneWriteBarrier.
// Vincolo SPEC §6 PROMPT 31.1: SOLO 4 collezioni, SOLO 1 campo.

import { getItemSync, setItemSync } from "../utils/storageSync";
import {
  CloneWriteBlockedError,
  assertCloneWriteAllowed,
  runWithCloneWriteScopedAllowance,
} from "../utils/cloneWriteBarrier";

export const ARCHIVIO_HIDE_WRITE_SCOPE =
  "centro_controllo_archivio_hide_write";

export type ArchivioHideKind =
  | "manutenzione"
  | "segnalazione"
  | "richiesta";

const MANUTENZIONI_KEY = "@manutenzioni";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const RICHIESTE_KEY = "@richieste_attrezzature_autisti_tmp";

function storageKeyForKind(kind: ArchivioHideKind): string {
  switch (kind) {
    case "manutenzione":
      return MANUTENZIONI_KEY;
    case "segnalazione":
      return SEGNALAZIONI_KEY;
    case "richiesta":
      return RICHIESTE_KEY;
  }
}

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) {
    return raw.value.filter(isRecord);
  }
  return [];
}

export type SetArchivioHiddenParams = {
  kind: ArchivioHideKind;
  recordId: string;
  hidden: boolean;
};

export type SetArchivioHiddenResult = {
  ok: boolean;
  error?: string;
};

export async function setArchivioHidden(
  params: SetArchivioHiddenParams,
): Promise<SetArchivioHiddenResult> {
  const id: string = String(params.recordId ?? "").trim();
  if (!id) {
    return { ok: false, error: "ID record mancante." };
  }
  const storageKey: string = storageKeyForKind(params.kind);
  try {
    const raw: unknown = await getItemSync(storageKey);
    const list: RawRecord[] = unwrapList(raw);
    const targetIndex: number = list.findIndex(
      (r: RawRecord) => String(r.id ?? "").trim() === id,
    );
    if (targetIndex < 0) {
      return {
        ok: false,
        error: `Record non trovato nello storage ${storageKey} (id stabile mancante o cancellato).`,
      };
    }
    const current: RawRecord = list[targetIndex];
    const updated: RawRecord = {
      ...current,
      nascostoInArchivio: params.hidden,
    };
    const next: RawRecord[] = [...list];
    next[targetIndex] = updated;
    await runWithCloneWriteScopedAllowance(ARCHIVIO_HIDE_WRITE_SCOPE, async () => {
      assertCloneWriteAllowed("storageSync.setItemSync", { key: storageKey });
      await setItemSync(storageKey, next);
    });
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof CloneWriteBlockedError) {
      return {
        ok: false,
        error:
          "Scrittura bloccata dal barrier clone (archivio hide). Verificare che la pagina sia /next/centro-controllo.",
      };
    }
    const message: string =
      err instanceof Error ? err.message : "Errore patch archivio hide.";
    return { ok: false, error: message };
  }
}

// Helper per leggere gli ID nascosti per kind, usato dal reader filter
// in useArchivioData per escludere i record nascosti dall'archivio.
export async function readArchivioHiddenIdsByKind(): Promise<
  Record<ArchivioHideKind, Set<string>>
> {
  const empty: Record<ArchivioHideKind, Set<string>> = {
    manutenzione: new Set<string>(),
    segnalazione: new Set<string>(),
    richiesta: new Set<string>(),
  };
  try {
    const [manutRaw, segnRaw, richRaw] = await Promise.all([
      getItemSync(MANUTENZIONI_KEY),
      getItemSync(SEGNALAZIONI_KEY),
      getItemSync(RICHIESTE_KEY),
    ]);
    const collectHidden = (raw: unknown, target: Set<string>): void => {
      const list: RawRecord[] = unwrapList(raw);
      for (const r of list) {
        if (r.nascostoInArchivio === true) {
          const id: string = String(r.id ?? "").trim();
          if (id) target.add(id);
        }
      }
    };
    collectHidden(manutRaw, empty.manutenzione);
    collectHidden(segnRaw, empty.segnalazione);
    collectHidden(richRaw, empty.richiesta);
    return empty;
  } catch {
    return empty;
  }
}
