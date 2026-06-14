// =============================================================================
// Registro orari — writer MODIFICA admin del record giorno (lato gestionale).
// SPEC v0.3 §2.2 + §9: l'admin può modificare QUALUNQUE giorno del cartellino di un
// autista (orari, flag, tipo, note), UPDATE-IN-PLACE per chiave (badge+data) su
// @orari_autisti, ANCHE a mese CHIUSO (la chiusura blocca solo l'autista).
// Vive sotto /next/autisti-admin: coperto dalla deroga path-only esistente +
// chiave @orari_autisti già in whitelist (nessuna nuova eccezione di path/chiave).
// Pattern: read-modify-write su array come nextOrariChiusuraWriter.
// =============================================================================

import { getItemSync, setItemSync } from "../../utils/storageSync";
import { assertCloneWriteAllowed, CloneWriteBlockedError } from "../../utils/cloneWriteBarrier";
import {
  findGiorno,
  upsertGiornoRecord,
  type OrarioGiornoRecord,
  type TipoGiorno,
} from "../../utils/orariCalc";

const ORARI_AUTISTI_KEY = "@orari_autisti";

export type SalvaGiornoAdminInput = {
  badge: string;
  data: string; // "YYYY-MM-DD"
  tipo: TipoGiorno;
  inizio: string | null;
  fine: string | null;
  notte: boolean;
  noPausa: boolean;
  note: string;
};

export type SalvaGiornoAdminResult = {
  ok: boolean;
  error?: string;
};

function toArray(raw: unknown): OrarioGiornoRecord[] {
  return Array.isArray(raw) ? (raw as OrarioGiornoRecord[]) : [];
}

// Crea/aggiorna IN-PLACE il record giorno (chiave badge+data). createdAt ereditato se
// il record esiste già; updatedAt = ora (azione admin esplicitamente temporale).
export async function salvaGiornoAdmin(input: SalvaGiornoAdminInput): Promise<SalvaGiornoAdminResult> {
  const badge = String(input.badge ?? "").trim();
  const data = String(input.data ?? "").trim();
  if (!badge) return { ok: false, error: "Badge mancante." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, error: "Data non valida." };

  try {
    const list = toArray(await getItemSync(ORARI_AUTISTI_KEY));
    const existing = findGiorno(list, badge, data);
    const now = Date.now();
    const isAssenza = input.tipo !== "lavoro";
    const record: OrarioGiornoRecord = {
      badge,
      data,
      tipo: input.tipo,
      inizio: isAssenza ? null : input.inizio || null,
      fine: isAssenza ? null : input.fine || null,
      notte: isAssenza ? false : input.notte === true,
      noPausa: isAssenza ? false : input.noPausa === true,
      note: input.note ?? "",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const nextList = upsertGiornoRecord(list, record);

    // setItemSync ingoia il blocco in silenzio: asserisce prima per non riportare falso successo.
    assertCloneWriteAllowed("storageSync.setItemSync", { key: ORARI_AUTISTI_KEY });
    await setItemSync(ORARI_AUTISTI_KEY, nextList);
    return { ok: true };
  } catch (err) {
    if (err instanceof CloneWriteBlockedError) {
      return { ok: false, error: "Scrittura bloccata dalla barriera clone (modifica cartellino)." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Errore salvataggio giorno." };
  }
}
