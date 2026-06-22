import { getItemSync, setItemSync } from "../utils/storageSync";
import {
  CloneWriteBlockedError,
  assertCloneWriteAllowed,
  runWithCloneWriteScopedAllowance,
} from "../utils/cloneWriteBarrier";

export const CONTROLLI_WRITE_SCOPE = "centro_controllo_controlli_write";

const CONTROLLI_KEY = "@controlli_mezzo_autisti";
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

export async function markControlloChiuso(
  controlloId: string,
  // Data REALE di chiusura (ms) scelta dall'utente nel modale. MAI Date.now():
  // regola TIMESTAMP-MAI-DA-CLICK. Il chiamante deve fornirla sempre.
  dataChiusuraMs: number,
): Promise<{ ok: boolean; error?: string }> {
  const id: string = String(controlloId ?? "").trim();
  if (!id) {
    return { ok: false, error: "ID controllo mancante." };
  }
  if (!Number.isFinite(dataChiusuraMs)) {
    return { ok: false, error: "Data di chiusura mancante o non valida." };
  }
  try {
    const raw: unknown = await getItemSync(CONTROLLI_KEY);
    const list: RawRecord[] = unwrapList(raw);
    const targetIndex: number = list.findIndex(
      (r: RawRecord) => String(r.id ?? "").trim() === id,
    );
    if (targetIndex < 0) {
      return { ok: false, error: "Controllo non trovato." };
    }
    const current: RawRecord = list[targetIndex];
    // Timbro UNIFICATO: stesso formato strutturato della chiusura automatica da
    // manutenzione (chiudiControlloDaEvento -> stato:"chiusa" + chiusuraDi/Data).
    // `chiusuraDi: "manuale"` distingue la chiusura manuale dalla propagata.
    // `chiuso: true` resta come flag legacy compatibile (innocuo, additivo).
    const updated: RawRecord = {
      ...current,
      chiuso: true,
      stato: "chiusa",
      chiusuraDi: "manuale",
      chiusuraData: dataChiusuraMs,
      dataChiusura: dataChiusuraMs,
      chiuso_by: SOURCE_LABEL,
    };
    const next: RawRecord[] = [...list];
    next[targetIndex] = updated;
    await runWithCloneWriteScopedAllowance(CONTROLLI_WRITE_SCOPE, async () => {
      assertCloneWriteAllowed("storageSync.setItemSync", { key: CONTROLLI_KEY });
      await setItemSync(CONTROLLI_KEY, next);
    });
    return { ok: true };
  } catch (err: unknown) {
    if (err instanceof CloneWriteBlockedError) {
      return {
        ok: false,
        error:
          "Scrittura bloccata dal barrier clone (controlli). Verificare che la pagina sia /next/centro-controllo.",
      };
    }
    const message: string =
      err instanceof Error ? err.message : "Errore salvataggio controllo.";
    return { ok: false, error: message };
  }
}
