import { getItemSync, setItemSync } from "../utils/storageSync";
import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";

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
): Promise<{ ok: boolean; error?: string }> {
  const id: string = String(richiestaId ?? "").trim();
  if (!id) {
    return { ok: false, error: "ID richiesta mancante." };
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
      dataEvasione: Date.now(),
      evasa_by: SOURCE_LABEL,
    };
    const next: RawRecord[] = [...list];
    next[targetIndex] = updated;
    await runWithCloneWriteScopedAllowance(RICHIESTE_WRITE_SCOPE, () =>
      setItemSync(RICHIESTE_KEY, next),
    );
    return { ok: true };
  } catch (err: unknown) {
    const message: string =
      err instanceof Error ? err.message : "Errore salvataggio richiesta.";
    return { ok: false, error: message };
  }
}
