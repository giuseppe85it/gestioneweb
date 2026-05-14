import { getItemSync, setItemSync } from "../utils/storageSync";
import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";

export const DELETE_MEZZO_WRITE_SCOPE = "centro_controllo_delete_mezzo_write";

const MEZZI_KEY = "@mezzi_aziendali";
const DOSSIER_RIFORNIMENTI_KEY = "@rifornimenti";
const RIFORNIMENTI_TMP_KEY = "@rifornimenti_autisti_tmp";
const MANUTENZIONI_KEY = "@manutenzioni";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const RICHIESTE_KEY = "@richieste_attrezzature_autisti_tmp";
const GOMME_TMP_KEY = "@cambi_gomme_autisti_tmp";
const GOMME_EVENTI_KEY = "@gomme_eventi";
const SESSIONI_KEY = "@autisti_sessione_attive";

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value;
  return [];
}

function normalizeTarga(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function recordTargaCandidates(record: RawRecord): string[] {
  const keys: string[] = [
    "targa",
    "mezzoTarga",
    "targaCamion",
    "targaMotrice",
    "targaRimorchio",
  ];
  const list: string[] = [];
  for (const k of keys) {
    const t: string = normalizeTarga(record[k]);
    if (t && !list.includes(t)) list.push(t);
  }
  return list;
}

function recordMatchesMezzo(
  record: unknown,
  targaUp: string,
  mezzoId: string,
): boolean {
  if (!isRecord(record)) return false;
  if (targaUp && recordTargaCandidates(record).includes(targaUp)) return true;
  if (mezzoId && typeof record.mezzoId === "string") {
    if (String(record.mezzoId).trim() === mezzoId) return true;
  }
  return false;
}

export type HardDeleteResult = {
  ok: boolean;
  error?: string;
  deletedCounts: {
    mezzi: number;
    rifornimentiDossier: number;
    rifornimentiTmp: number;
    manutenzioni: number;
    segnalazioni: number;
    controlli: number;
    richieste: number;
    gommeTmp: number;
    gommeEventi: number;
    sessioni: number;
  };
};

export type HardDeletePreview = HardDeleteResult["deletedCounts"];

export async function previewHardDeleteCounts(
  targa: string,
  mezzoId: string,
): Promise<HardDeletePreview> {
  const targaUp: string = normalizeTarga(targa);
  const idTrim: string = String(mezzoId ?? "").trim();
  const countByMezzo = async (key: string): Promise<number> => {
    const list: unknown[] = unwrapList(await getItemSync(key));
    return list.filter((r: unknown) => recordMatchesMezzo(r, targaUp, idTrim))
      .length;
  };
  const mezziList: unknown[] = unwrapList(await getItemSync(MEZZI_KEY));
  const mezziCount: number = mezziList.filter(
    (r: unknown) => isRecord(r) && String(r.id ?? "").trim() === idTrim,
  ).length;
  return {
    mezzi: mezziCount,
    rifornimentiDossier: await countByMezzo(DOSSIER_RIFORNIMENTI_KEY),
    rifornimentiTmp: await countByMezzo(RIFORNIMENTI_TMP_KEY),
    manutenzioni: await countByMezzo(MANUTENZIONI_KEY),
    segnalazioni: await countByMezzo(SEGNALAZIONI_KEY),
    controlli: await countByMezzo(CONTROLLI_KEY),
    richieste: await countByMezzo(RICHIESTE_KEY),
    gommeTmp: await countByMezzo(GOMME_TMP_KEY),
    gommeEventi: await countByMezzo(GOMME_EVENTI_KEY),
    sessioni: await countByMezzo(SESSIONI_KEY),
  };
}

async function deleteByMezzoInDataset(
  key: string,
  targaUp: string,
  mezzoId: string,
): Promise<number> {
  const raw: unknown = await getItemSync(key);
  const list: unknown[] = unwrapList(raw);
  if (list.length === 0) return 0;
  const filtered: unknown[] = list.filter((r: unknown) => {
    return !recordMatchesMezzo(r, targaUp, mezzoId);
  });
  const removed: number = list.length - filtered.length;
  if (removed > 0) {
    await setItemSync(key, filtered);
  }
  return removed;
}

async function deleteMezzoById(mezzoId: string): Promise<number> {
  const idTrim: string = String(mezzoId ?? "").trim();
  if (!idTrim) return 0;
  const raw: unknown = await getItemSync(MEZZI_KEY);
  const list: unknown[] = unwrapList(raw);
  if (list.length === 0) return 0;
  const filtered: unknown[] = list.filter((r: unknown) => {
    if (!isRecord(r)) return true;
    return String(r.id ?? "").trim() !== idTrim;
  });
  const removed: number = list.length - filtered.length;
  if (removed > 0) {
    await setItemSync(MEZZI_KEY, filtered);
  }
  return removed;
}

export async function hardDeleteMezzo(
  targa: string,
  mezzoId: string,
): Promise<HardDeleteResult> {
  const targaUp: string = normalizeTarga(targa);
  const idTrim: string = String(mezzoId ?? "").trim();
  if (!targaUp || !idTrim) {
    return {
      ok: false,
      error: "Targa o ID mezzo mancanti.",
      deletedCounts: {
        mezzi: 0,
        rifornimentiDossier: 0,
        rifornimentiTmp: 0,
        manutenzioni: 0,
        segnalazioni: 0,
        controlli: 0,
        richieste: 0,
        gommeTmp: 0,
        gommeEventi: 0,
        sessioni: 0,
      },
    };
  }
  try {
    const result: HardDeleteResult["deletedCounts"] =
      await runWithCloneWriteScopedAllowance(
        DELETE_MEZZO_WRITE_SCOPE,
        async () => {
          const rifornimentiDossier: number = await deleteByMezzoInDataset(
            DOSSIER_RIFORNIMENTI_KEY,
            targaUp,
            idTrim,
          );
          const rifornimentiTmp: number = await deleteByMezzoInDataset(
            RIFORNIMENTI_TMP_KEY,
            targaUp,
            idTrim,
          );
          const manutenzioni: number = await deleteByMezzoInDataset(
            MANUTENZIONI_KEY,
            targaUp,
            idTrim,
          );
          const segnalazioni: number = await deleteByMezzoInDataset(
            SEGNALAZIONI_KEY,
            targaUp,
            idTrim,
          );
          const controlli: number = await deleteByMezzoInDataset(
            CONTROLLI_KEY,
            targaUp,
            idTrim,
          );
          const richieste: number = await deleteByMezzoInDataset(
            RICHIESTE_KEY,
            targaUp,
            idTrim,
          );
          const gommeTmp: number = await deleteByMezzoInDataset(
            GOMME_TMP_KEY,
            targaUp,
            idTrim,
          );
          const gommeEventi: number = await deleteByMezzoInDataset(
            GOMME_EVENTI_KEY,
            targaUp,
            idTrim,
          );
          const sessioni: number = await deleteByMezzoInDataset(
            SESSIONI_KEY,
            targaUp,
            idTrim,
          );
          const mezzi: number = await deleteMezzoById(idTrim);
          return {
            mezzi,
            rifornimentiDossier,
            rifornimentiTmp,
            manutenzioni,
            segnalazioni,
            controlli,
            richieste,
            gommeTmp,
            gommeEventi,
            sessioni,
          };
        },
      );
    return { ok: true, deletedCounts: result };
  } catch (err: unknown) {
    const message: string =
      err instanceof Error ? err.message : "Errore eliminazione mezzo.";
    return {
      ok: false,
      error: message,
      deletedCounts: {
        mezzi: 0,
        rifornimentiDossier: 0,
        rifornimentiTmp: 0,
        manutenzioni: 0,
        segnalazioni: 0,
        controlli: 0,
        richieste: 0,
        gommeTmp: 0,
        gommeEventi: 0,
        sessioni: 0,
      },
    };
  }
}
