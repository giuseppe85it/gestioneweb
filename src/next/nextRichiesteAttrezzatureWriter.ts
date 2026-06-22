import { getItemSync, setItemSync } from "../utils/storageSync";
import {
  CloneWriteBlockedError,
  assertCloneWriteAllowed,
  runWithCloneWriteScopedAllowance,
} from "../utils/cloneWriteBarrier";

export const RICHIESTE_WRITE_SCOPE = "centro_controllo_richieste_write";

const RICHIESTE_KEY = "@richieste_attrezzature_autisti_tmp";
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

export async function markRichiestaEvasa(
  richiestaId: string,
  // Data REALE di evasione (ms) scelta dall'utente nel modale. MAI Date.now():
  // regola TIMESTAMP-MAI-DA-CLICK. Il chiamante deve fornirla sempre.
  dataEvasioneMs: number,
): Promise<{ ok: boolean; error?: string }> {
  const id: string = String(richiestaId ?? "").trim();
  if (!id) {
    return { ok: false, error: "ID richiesta mancante." };
  }
  if (!Number.isFinite(dataEvasioneMs)) {
    return { ok: false, error: "Data di evasione mancante o non valida." };
  }
  try {
    const raw: unknown = await getItemSync(RICHIESTE_KEY);
    const list: RawRecord[] = unwrapList(raw);
    const targetIndex: number = list.findIndex(
      (r: RawRecord) => String(r.id ?? "").trim() === id,
    );
    if (targetIndex < 0) {
      return { ok: false, error: "Richiesta non trovata." };
    }
    const current: RawRecord = list[targetIndex];
    const updated: RawRecord = {
      ...current,
      evasa: true,
      dataEvasione: dataEvasioneMs,
      evasa_by: SOURCE_LABEL,
    };
    const next: RawRecord[] = [...list];
    next[targetIndex] = updated;
    await runWithCloneWriteScopedAllowance(RICHIESTE_WRITE_SCOPE, async () => {
      assertCloneWriteAllowed("storageSync.setItemSync", { key: RICHIESTE_KEY });
      await setItemSync(RICHIESTE_KEY, next);
    });
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof CloneWriteBlockedError) {
      return {
        ok: false,
        error:
          "Scrittura bloccata dal barrier clone (richieste). Verificare che la pagina sia /next/centro-controllo.",
      };
    }
    const message: string =
      err instanceof Error ? err.message : "Errore salvataggio richiesta.";
    return { ok: false, error: message };
  }
}
