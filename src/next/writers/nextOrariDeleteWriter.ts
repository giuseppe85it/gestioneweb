// =============================================================================
// Registro orari — writer ELIMINAZIONE admin di giorni (lato gestionale).
// ⚠️ DISTRUTTIVO: rimozione FISICA e IRREVERSIBILE dei record da @orari_autisti.
// Si elimina SOLO ciò che l'admin ha selezionato: i record con (badge AND data) esatti
// passati in `date`, per QUEL badge. Nessun match parziale, nessun "per sola data",
// nessun soft-delete, nessun nuovo campo. Read-modify-write sull'array, via barriera.
// Vive sotto /next/autisti-admin: chiave @orari_autisti già in whitelist (nessuna nuova
// eccezione di path/chiave). Consentito anche a mese chiuso (come la MODIFICA admin).
// Pattern fratello di nextOrariRecordWriter.ts.
// =============================================================================

import { getItemSync, setItemSync } from "../../utils/storageSync";
import { assertCloneWriteAllowed, CloneWriteBlockedError } from "../../utils/cloneWriteBarrier";
import { type OrarioGiornoRecord } from "../../utils/orariCalc";

const ORARI_AUTISTI_KEY = "@orari_autisti";

export type EliminaGiorniAdminInput = {
  badge: string;
  date: string[]; // date "YYYY-MM-DD" esatte da eliminare per quel badge
};

export type EliminaGiorniAdminResult = {
  ok: boolean;
  removed: number;
  error?: string;
};

function toArray(raw: unknown): OrarioGiornoRecord[] {
  return Array.isArray(raw) ? (raw as OrarioGiornoRecord[]) : [];
}

// Elimina i record selezionati: tiene tutto TRANNE i record il cui badge coincide
// col badge corrente E la cui data è tra quelle selezionate. Quindi due autisti con la
// stessa data NON si toccano a vicenda: si rimuove solo il record del badge passato.
export async function eliminaGiorniAdmin(
  input: EliminaGiorniAdminInput
): Promise<EliminaGiorniAdminResult> {
  const badge = String(input.badge ?? "").trim();
  const dates = new Set(
    (input.date ?? []).map((d) => String(d ?? "").trim()).filter(Boolean)
  );
  if (!badge) return { ok: false, removed: 0, error: "Badge mancante." };
  if (dates.size === 0) return { ok: false, removed: 0, error: "Nessun giorno selezionato." };

  try {
    const list = toArray(await getItemSync(ORARI_AUTISTI_KEY));
    const nextList = list.filter(
      (r) =>
        !(
          String(r.badge ?? "").trim() === badge &&
          dates.has(String(r.data ?? "").trim())
        )
    );
    const removed = list.length - nextList.length;
    if (removed === 0) {
      return { ok: false, removed: 0, error: "Nessun record corrispondente trovato." };
    }

    // setItemSync ingoia il blocco in silenzio: asserisce prima per non riportare falso successo.
    assertCloneWriteAllowed("storageSync.setItemSync", { key: ORARI_AUTISTI_KEY });
    await setItemSync(ORARI_AUTISTI_KEY, nextList);
    return { ok: true, removed };
  } catch (err) {
    if (err instanceof CloneWriteBlockedError) {
      return { ok: false, removed: 0, error: "Scrittura bloccata dalla barriera clone (eliminazione giorni)." };
    }
    return { ok: false, removed: 0, error: err instanceof Error ? err.message : "Errore eliminazione giorni." };
  }
}
