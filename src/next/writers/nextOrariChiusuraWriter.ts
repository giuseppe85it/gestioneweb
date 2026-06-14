// =============================================================================
// Registratore Orari e Note — writer RIAPERTURA cartellino (lato gestionale).
// SPEC §6/§9: l'azione admin RIAPRI scrive `riapertoAt` su @orari_autisti_chiusure.
// Vive sotto /next/autisti-admin: coperta dalla deroga path-only già esistente in
// cloneWriteBarrier.ts, a condizione che la chiave sia nella whitelist
// AUTISTI_ADMIN_INBOX_ALLOWED_STORAGE_KEYS. Pattern di riferimento: reset dei campi
// di chiusura in src/next/writers/nextChiusuraEventoWriter.ts.
// =============================================================================

import { getItemSync, setItemSync } from "../../utils/storageSync";
import { assertCloneWriteAllowed, CloneWriteBlockedError } from "../../utils/cloneWriteBarrier";
import { withMeseRiaperto, type ChiusureDoc } from "../../utils/orariCalc";

const ORARI_AUTISTI_CHIUSURE_KEY = "@orari_autisti_chiusure";

export type RiapriCartellinoResult = {
  ok: boolean;
  error?: string;
};

function toChiusureDoc(raw: unknown): ChiusureDoc {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as ChiusureDoc) : {};
}

// Riapre il cartellino chiuso di un autista per un mese: setta chiuso=false e
// riapertoAt (epoch ms, azione admin esplicita), preservando chiusoAt.
export async function riapriCartellino(params: {
  badge: string;
  year: number;
  month1: number;
}): Promise<RiapriCartellinoResult> {
  const badge = String(params.badge ?? "").trim();
  if (!badge) return { ok: false, error: "Badge mancante." };

  try {
    const raw = await getItemSync(ORARI_AUTISTI_CHIUSURE_KEY);
    const doc = toChiusureDoc(raw);
    const next = withMeseRiaperto(doc, badge, params.year, params.month1, Date.now());

    // Verifica esplicita della barriera: setItemSync ingoia il blocco in silenzio,
    // quindi asseriamo prima per non riportare un falso successo.
    assertCloneWriteAllowed("storageSync.setItemSync", { key: ORARI_AUTISTI_CHIUSURE_KEY });
    await setItemSync(ORARI_AUTISTI_CHIUSURE_KEY, next);
    return { ok: true };
  } catch (err) {
    if (err instanceof CloneWriteBlockedError) {
      return { ok: false, error: "Scrittura bloccata dalla barriera clone (riapertura cartellino)." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Errore riapertura cartellino." };
  }
}
