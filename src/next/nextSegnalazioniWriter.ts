import { getItemSync, setItemSync } from "../utils/storageSync";
import {
  CloneWriteBlockedError,
  assertCloneWriteAllowed,
  runWithCloneWriteScopedAllowance,
} from "../utils/cloneWriteBarrier";

export const SEGNALAZIONI_WRITE_SCOPE = "centro_controllo_segnalazioni_write";

const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const SOURCE_LABEL = "centro_controllo_next";

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

export async function markSegnalazioneChiusa(
  segnalazioneId: string,
): Promise<{ ok: boolean; error?: string }> {
  const id: string = String(segnalazioneId ?? "").trim();
  if (!id) {
    return { ok: false, error: "ID segnalazione mancante." };
  }
  try {
    const raw: unknown = await getItemSync(SEGNALAZIONI_KEY);
    const list: RawRecord[] = unwrapList(raw);
    const targetIndex: number = list.findIndex(
      (r: RawRecord) => String(r.id ?? "").trim() === id,
    );
    if (targetIndex < 0) {
      return { ok: false, error: "Segnalazione non trovata." };
    }
    const current: RawRecord = list[targetIndex];
    const updated: RawRecord = {
      ...current,
      chiusa: true,
      dataChiusura: Date.now(),
      chiusa_by: SOURCE_LABEL,
    };
    const next: RawRecord[] = [...list];
    next[targetIndex] = updated;
    await runWithCloneWriteScopedAllowance(SEGNALAZIONI_WRITE_SCOPE, async () => {
      assertCloneWriteAllowed("storageSync.setItemSync", { key: SEGNALAZIONI_KEY });
      await setItemSync(SEGNALAZIONI_KEY, next);
    });
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof CloneWriteBlockedError) {
      return {
        ok: false,
        error:
          "Scrittura bloccata dal barrier clone (segnalazioni). Verificare che la pagina sia /next/centro-controllo.",
      };
    }
    const message: string =
      err instanceof Error ? err.message : "Errore salvataggio segnalazione.";
    return { ok: false, error: message };
  }
}
