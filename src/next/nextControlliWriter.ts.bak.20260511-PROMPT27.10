import { getItemSync, setItemSync } from "../utils/storageSync";
import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";

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
): Promise<{ ok: boolean; error?: string }> {
  const id: string = String(controlloId ?? "").trim();
  if (!id) {
    return { ok: false, error: "ID controllo mancante." };
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
    const updated: RawRecord = {
      ...current,
      chiuso: true,
      dataChiusura: Date.now(),
      chiuso_by: SOURCE_LABEL,
    };
    const next: RawRecord[] = [...list];
    next[targetIndex] = updated;
    await runWithCloneWriteScopedAllowance(CONTROLLI_WRITE_SCOPE, () =>
      setItemSync(CONTROLLI_KEY, next),
    );
    return { ok: true };
  } catch (err: unknown) {
    const message: string =
      err instanceof Error ? err.message : "Errore salvataggio controllo.";
    return { ok: false, error: message };
  }
}
