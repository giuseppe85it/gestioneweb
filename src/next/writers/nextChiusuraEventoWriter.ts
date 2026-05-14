import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  CloneWriteBlockedError,
  assertCloneWriteAllowed,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";

export const CHIUSURA_DA_EVENTO_WRITE_SCOPE = "next_chiusura_da_evento_write_scope";

const MANUTENZIONI_KEY = "@manutenzioni";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";

type RawRecord = Record<string, unknown>;
type ChiusuraTargetKey =
  | typeof MANUTENZIONI_KEY
  | typeof SEGNALAZIONI_KEY
  | typeof CONTROLLI_KEY;
type SgancioStato = "daFare" | "aperta" | "in_carico";

export type ChiusuraDaEventoResult = {
  ok: boolean;
  updated: number;
  error?: string;
};

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items.filter(isRecord);
  return [];
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function buildChiusuraPatch(args: {
  stato: "chiusa_da_evento" | "chiusa";
  tipoEvento: string;
  idEvento: string;
  chiusuraData?: number;
}): RawRecord {
  return {
    stato: args.stato,
    chiusuraDi: args.tipoEvento,
    chiusuraRefId: args.idEvento,
    chiusuraData:
      typeof args.chiusuraData === "number" && Number.isFinite(args.chiusuraData)
        ? args.chiusuraData
        : Date.now(),
  };
}

function buildSgancioPatch(stato: SgancioStato): RawRecord {
  return {
    stato,
    chiusuraDi: null,
    chiusuraRefId: null,
    chiusuraData: null,
  };
}

function patchById(
  list: RawRecord[],
  id: string,
  patch: RawRecord,
): { nextList: RawRecord[]; updated: number } {
  const targetId = normalizeText(id);
  let updated = 0;
  const nextList = list.map((record) => {
    if (normalizeText(record.id) !== targetId) return record;
    updated += 1;
    return { ...record, ...patch };
  });
  return { nextList, updated };
}

function patchByIdIfGommeEvento(
  list: RawRecord[],
  id: string,
  patch: RawRecord,
): { nextList: RawRecord[]; updated: number; blockedReason?: string } {
  const targetId = normalizeText(id);
  let updated = 0;
  let blockedReason: string | undefined;
  const nextList = list.map((record) => {
    if (normalizeText(record.id) !== targetId) return record;
    if (normalizeText(record.chiusuraDi) !== "gomme_evento") {
      blockedReason = "Sgancio consentito solo per record chiusi da cambio gomme.";
      return record;
    }
    updated += 1;
    return { ...record, ...patch };
  });
  return { nextList, updated, blockedReason };
}

function blockedResult(error: unknown): ChiusuraDaEventoResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      updated: 0,
      error:
        "Scrittura bloccata dal barrier clone (chiusura da evento). Verificare pagina e scope autorizzati.",
    };
  }
  return {
    ok: false,
    updated: 0,
    error: error instanceof Error ? error.message : "Errore chiusura da evento.",
  };
}

async function chiudiRecordDaEvento(args: {
  key: ChiusuraTargetKey;
  id: string;
  stato: "chiusa_da_evento" | "chiusa";
  tipoEvento: string;
  idEvento: string;
  chiusuraData?: number;
}): Promise<ChiusuraDaEventoResult> {
  const recordId = normalizeText(args.id);
  const tipoEvento = normalizeText(args.tipoEvento);
  const idEvento = normalizeText(args.idEvento);
  if (!recordId) return { ok: false, updated: 0, error: "ID record mancante." };
  if (!tipoEvento) return { ok: false, updated: 0, error: "Tipo evento chiusura mancante." };
  if (!idEvento) return { ok: false, updated: 0, error: "ID evento chiusura mancante." };

  try {
    return await runWithCloneWriteScopedAllowance(CHIUSURA_DA_EVENTO_WRITE_SCOPE, async () => {
      const raw = await getItemSync(args.key);
      const list = unwrapList(raw);
      const patch = buildChiusuraPatch({
        stato: args.stato,
        tipoEvento,
        idEvento,
        chiusuraData: args.chiusuraData,
      });
      const { nextList, updated } = patchById(list, recordId, patch);
      if (updated === 0) {
        return { ok: false, updated: 0, error: `Record non trovato in ${args.key}: ${recordId}` };
      }
      assertCloneWriteAllowed("storageSync.setItemSync", { key: args.key });
      await setItemSync(args.key, nextList);
      return { ok: true, updated };
    });
  } catch (error) {
    return blockedResult(error);
  }
}

async function sganciaRecordDaEvento(args: {
  key: ChiusuraTargetKey;
  id: string;
  stato: SgancioStato;
}): Promise<ChiusuraDaEventoResult> {
  const recordId = normalizeText(args.id);
  if (!recordId) return { ok: false, updated: 0, error: "ID record mancante." };

  try {
    return await runWithCloneWriteScopedAllowance(CHIUSURA_DA_EVENTO_WRITE_SCOPE, async () => {
      const raw = await getItemSync(args.key);
      const list = unwrapList(raw);
      const { nextList, updated, blockedReason } = patchByIdIfGommeEvento(
        list,
        recordId,
        buildSgancioPatch(args.stato),
      );
      if (blockedReason) return { ok: false, updated: 0, error: blockedReason };
      if (updated === 0) {
        return { ok: false, updated: 0, error: `Record non trovato in ${args.key}: ${recordId}` };
      }
      assertCloneWriteAllowed("storageSync.setItemSync", { key: args.key });
      await setItemSync(args.key, nextList);
      return { ok: true, updated };
    });
  } catch (error) {
    return blockedResult(error);
  }
}

export function chiudiManutenzioneDaEvento(
  idManutenzione: string,
  tipoEvento: string,
  idEvento: string,
  chiusuraData?: number,
): Promise<ChiusuraDaEventoResult> {
  return chiudiRecordDaEvento({
    key: MANUTENZIONI_KEY,
    id: idManutenzione,
    stato: "chiusa_da_evento",
    tipoEvento,
    idEvento,
    chiusuraData,
  });
}

export function chiudiSegnalazioneDaEvento(
  idSegnalazione: string,
  tipoEvento: string,
  idEvento: string,
  chiusuraData?: number,
): Promise<ChiusuraDaEventoResult> {
  return chiudiRecordDaEvento({
    key: SEGNALAZIONI_KEY,
    id: idSegnalazione,
    stato: "chiusa",
    tipoEvento,
    idEvento,
    chiusuraData,
  });
}

export function chiudiControlloDaEvento(
  idControllo: string,
  tipoEvento: string,
  idEvento: string,
  chiusuraData?: number,
): Promise<ChiusuraDaEventoResult> {
  return chiudiRecordDaEvento({
    key: CONTROLLI_KEY,
    id: idControllo,
    stato: "chiusa",
    tipoEvento,
    idEvento,
    chiusuraData,
  });
}

export function sganciaManutenzioneDaEvento(
  idManutenzione: string,
  statoOriginale: "daFare" = "daFare",
): Promise<ChiusuraDaEventoResult> {
  return sganciaRecordDaEvento({
    key: MANUTENZIONI_KEY,
    id: idManutenzione,
    stato: statoOriginale,
  });
}

export function sganciaSegnalazioneDaEvento(
  idSegnalazione: string,
  statoOriginale: "aperta" | "in_carico" = "aperta",
): Promise<ChiusuraDaEventoResult> {
  return sganciaRecordDaEvento({
    key: SEGNALAZIONI_KEY,
    id: idSegnalazione,
    stato: statoOriginale,
  });
}

export function sganciaControlloDaEvento(
  idControllo: string,
  statoOriginale: "aperta" | "in_carico" = "aperta",
): Promise<ChiusuraDaEventoResult> {
  return sganciaRecordDaEvento({
    key: CONTROLLI_KEY,
    id: idControllo,
    stato: statoOriginale,
  });
}
